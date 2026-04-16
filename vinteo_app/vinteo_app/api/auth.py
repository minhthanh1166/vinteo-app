"""Token manager for Vinteo API (server-side only)."""

from __future__ import annotations

import base64
import json
import os
import ssl
import threading
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Any


class VinteoAuthError(RuntimeError):
    """Raised when Vinteo authentication fails."""


@dataclass
class TokenBundle:
    access_token: str
    refresh_token: str
    access_exp: float


class VinteoTokenManager:
    """Stores and refreshes Vinteo JWT tokens in-memory."""

    def __init__(self) -> None:
        self.base_url = str(os.getenv("BASE_URL", "")).strip().rstrip("/")
        self.username = str(os.getenv("VINTEO_USERNAME", "")).strip()
        self.password = str(os.getenv("VINTEO_PASSWORD", "")).strip()
        self.verify_ssl = str(os.getenv("VINTEO_VERIFY_SSL", "false")).lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

        self._lock = threading.RLock()
        self._access_token = ""
        self._refresh_token = ""
        self._access_exp = 0.0

    def _build_ssl_context(self) -> ssl.SSLContext:
        if self.verify_ssl:
            return ssl.create_default_context()
        return ssl._create_unverified_context()

    def _request_json(
        self,
        method: str,
        endpoint: str,
        body: dict[str, Any] | None = None,
        headers: dict[str, str] | None = None,
    ) -> tuple[int, dict[str, str], dict[str, Any]]:
        if not self.base_url:
            raise VinteoAuthError("BASE_URL is missing.")

        url = self.base_url + endpoint
        payload = None
        request_headers = {
            "Accept": "application/json",
        }

        if body is not None:
            payload = json.dumps(body).encode("utf-8")
            request_headers["Content-Type"] = "application/json"

        if headers:
            request_headers.update(headers)

        request = urllib.request.Request(
            url=url,
            data=payload,
            headers=request_headers,
            method=method.upper(),
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=15,
                context=self._build_ssl_context(),
            ) as response:
                raw = response.read()
                status = response.getcode()
                response_headers = dict(response.headers.items())
        except urllib.error.HTTPError as error:
            raw = error.read()
            status = error.code
            response_headers = dict(error.headers.items()) if error.headers else {}
        except urllib.error.URLError as error:
            raise VinteoAuthError(f"Cannot connect to Vinteo API: {error.reason}") from error

        parsed: dict[str, Any] = {}
        if raw:
            try:
                parsed = json.loads(raw.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                parsed = {}

        return status, response_headers, parsed

    @staticmethod
    def _token_from_keys(source: dict[str, Any], keys: tuple[str, ...]) -> str:
        for key in keys:
            value = source.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return ""

    @classmethod
    def _extract_tokens(cls, payload: dict[str, Any]) -> tuple[str, str]:
        access_keys = ("access", "accessToken", "access_token", "token", "jwt")
        refresh_keys = ("refresh", "refreshToken", "refresh_token")

        def walk(value: Any) -> tuple[str, str]:
            if isinstance(value, dict):
                access_token = cls._token_from_keys(value, access_keys)
                refresh_token = cls._token_from_keys(value, refresh_keys)
                if access_token:
                    return access_token, refresh_token

                for nested in value.values():
                    nested_access, nested_refresh = walk(nested)
                    if nested_access:
                        return nested_access, nested_refresh
            elif isinstance(value, list):
                for nested in value:
                    nested_access, nested_refresh = walk(nested)
                    if nested_access:
                        return nested_access, nested_refresh

            return "", ""

        return walk(payload)

    @staticmethod
    def _decode_exp(token: str) -> float:
        parts = token.split(".")
        if len(parts) < 2:
            return time.time() + 300

        payload_part = parts[1]
        padding = "=" * (-len(payload_part) % 4)

        try:
            decoded = base64.urlsafe_b64decode(payload_part + padding)
            payload = json.loads(decoded.decode("utf-8"))
            exp = float(payload.get("exp", 0))
            if exp > 0:
                return exp
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            pass

        return time.time() + 300

    def _is_access_valid(self) -> bool:
        if not self._access_token:
            return False
        return time.time() < (self._access_exp - 30)

    def _apply_bundle(self, bundle: TokenBundle) -> None:
        self._access_token = bundle.access_token
        self._refresh_token = bundle.refresh_token
        self._access_exp = bundle.access_exp

    def _login(self) -> TokenBundle:
        if not self.username or not self.password:
            raise VinteoAuthError(
                "VINTEO_USERNAME or VINTEO_PASSWORD is missing in environment.",
            )

        status, _, payload = self._request_json(
            "POST",
            "/api/v1/auth/jwt",
            body={
                "username": self.username,
                "password": self.password,
            },
        )

        access_token, refresh_token = self._extract_tokens(payload)
        if status not in (200, 201) or not access_token:
            message = ""
            if isinstance(payload, dict):
                message = str(
                    payload.get("message")
                    or payload.get("error")
                    or payload.get("status")
                    or "",
                ).strip()
            if not message:
                message = "Access token is missing in response body."
            raise VinteoAuthError(
                f"Login failed with status {status}. {message}".strip(),
            )

        return TokenBundle(
            access_token=access_token,
            refresh_token=refresh_token,
            access_exp=self._decode_exp(access_token),
        )

    def _refresh(self) -> TokenBundle:
        if not self._refresh_token:
            raise VinteoAuthError("Refresh token is missing.")

        status, _, payload = self._request_json(
            "GET",
            "/api/v1/auth/refresh",
            headers={
                "Authorization": "Bearer " + self._refresh_token,
            },
        )

        access_token, refresh_token = self._extract_tokens(payload)
        if status not in (200, 201) or not access_token:
            message = ""
            if isinstance(payload, dict):
                message = str(
                    payload.get("message")
                    or payload.get("error")
                    or payload.get("status")
                    or "",
                ).strip()
            if not message:
                message = "Access token is missing in refresh response."
            raise VinteoAuthError(
                f"Refresh failed with status {status}. {message}".strip(),
            )

        return TokenBundle(
            access_token=access_token,
            refresh_token=refresh_token or self._refresh_token,
            access_exp=self._decode_exp(access_token),
        )

    def get_access_token(self, force_refresh: bool = False) -> str:
        with self._lock:
            if not force_refresh and self._is_access_valid():
                return self._access_token

            if self._refresh_token:
                try:
                    bundle = self._refresh()
                    self._apply_bundle(bundle)
                    return self._access_token
                except VinteoAuthError:
                    self._refresh_token = ""

            bundle = self._login()
            self._apply_bundle(bundle)
            return self._access_token

    def invalidate_access(self) -> None:
        with self._lock:
            self._access_token = ""
            self._access_exp = 0.0

    def reset_all(self) -> None:
        with self._lock:
            self._access_token = ""
            self._refresh_token = ""
            self._access_exp = 0.0
