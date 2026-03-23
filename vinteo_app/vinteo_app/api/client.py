"""Vinteo API client with automatic token injection/refresh."""

from __future__ import annotations

import http.cookiejar
import json
import os
import re
import ssl
import threading
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any

from .auth import VinteoAuthError, VinteoTokenManager


class VinteoClientError(RuntimeError):
    """Raised when upstream Vinteo API cannot be reached."""


@dataclass
class VinteoResponse:
    status: int
    headers: dict[str, str]
    body: bytes


class VinteoApiClient:
    def __init__(self, token_manager: VinteoTokenManager) -> None:
        self.token_manager = token_manager
        self.base_url = str(os.getenv("BASE_URL", "")).strip().rstrip("/")
        self.web_username = str(
            os.getenv("VINTEO_WEB_USERNAME", os.getenv("VINTEO_USERNAME", "")),
        ).strip()
        self.web_password = str(
            os.getenv("VINTEO_WEB_PASSWORD", os.getenv("VINTEO_PASSWORD", "")),
        ).strip()
        self.verify_ssl = str(os.getenv("VINTEO_VERIFY_SSL", "false")).lower() in {
            "1",
            "true",
            "yes",
            "on",
        }
        self._web_lock = threading.RLock()
        self._web_cookie_jar = http.cookiejar.CookieJar()
        self._web_opener = urllib.request.build_opener(
            urllib.request.HTTPCookieProcessor(self._web_cookie_jar),
            urllib.request.HTTPSHandler(context=self._build_ssl_context()),
        )

    def _build_ssl_context(self) -> ssl.SSLContext:
        if self.verify_ssl:
            return ssl.create_default_context()
        return ssl._create_unverified_context()

    def _send(
        self,
        method: str,
        endpoint: str,
        body: bytes | None,
        headers: dict[str, str],
    ) -> VinteoResponse:
        if not self.base_url:
            raise VinteoClientError("BASE_URL is missing.")

        endpoint = endpoint if endpoint.startswith("/") else "/" + endpoint
        url = self.base_url + endpoint

        request = urllib.request.Request(
            url=url,
            data=body,
            headers=headers,
            method=method.upper(),
        )

        try:
            with urllib.request.urlopen(
                request,
                timeout=20,
                context=self._build_ssl_context(),
            ) as response:
                return VinteoResponse(
                    status=response.getcode(),
                    headers=dict(response.headers.items()),
                    body=response.read(),
                )
        except urllib.error.HTTPError as error:
            return VinteoResponse(
                status=error.code,
                headers=dict(error.headers.items()) if error.headers else {},
                body=error.read(),
            )
        except urllib.error.URLError as error:
            raise VinteoClientError(
                f"Cannot connect to Vinteo API: {error.reason}",
            ) from error

    def _send_with_opener(
        self,
        opener: urllib.request.OpenerDirector,
        method: str,
        endpoint: str,
        body: bytes | None,
        headers: dict[str, str],
    ) -> VinteoResponse:
        if not self.base_url:
            raise VinteoClientError("BASE_URL is missing.")

        endpoint = endpoint if endpoint.startswith("/") else "/" + endpoint
        url = self.base_url + endpoint

        request = urllib.request.Request(
            url=url,
            data=body,
            headers=headers,
            method=method.upper(),
        )

        try:
            with opener.open(
                request,
                timeout=20,
            ) as response:
                return VinteoResponse(
                    status=response.getcode(),
                    headers=dict(response.headers.items()),
                    body=response.read(),
                )
        except urllib.error.HTTPError as error:
            return VinteoResponse(
                status=error.code,
                headers=dict(error.headers.items()) if error.headers else {},
                body=error.read(),
            )
        except urllib.error.URLError as error:
            raise VinteoClientError(
                f"Cannot connect to Vinteo API: {error.reason}",
            ) from error

    @staticmethod
    def _normalize_endpoint(endpoint: str) -> str:
        text = str(endpoint or "").strip()
        if not text:
            return ""
        return text if text.startswith("/") else "/" + text

    @staticmethod
    def _is_login_html_response(response: VinteoResponse) -> bool:
        content_type = str(response.headers.get("Content-Type", "")).lower()
        if "text/html" not in content_type:
            return False
        if not response.body:
            return False
        text = response.body.decode("utf-8", errors="ignore")
        lowered = text.lower()
        return "name=\"_csrf\"" in lowered and "/auth/login" in lowered

    @staticmethod
    def _extract_hidden_input(html: str, field_name: str) -> str:
        pattern = (
            r'name=["\']'
            + re.escape(field_name)
            + r'["\']\s+value=["\']([^"\']+)["\']'
        )
        match = re.search(pattern, html, flags=re.IGNORECASE)
        if not match:
            return ""
        return str(match.group(1) or "").strip()

    @staticmethod
    def _convert_api_screenshot_endpoint(endpoint: str) -> str:
        normalized = VinteoApiClient._normalize_endpoint(endpoint)
        if "/api/v1/screenShot/" not in normalized:
            return normalized
        return normalized.replace("/api/v1/screenShot/", "/conferences/screenShot/", 1)

    def _ensure_web_session(self, target_endpoint: str) -> None:
        if not self.web_username or not self.web_password:
            raise VinteoClientError(
                "VINTEO_WEB_USERNAME/VINTEO_WEB_PASSWORD are missing.",
            )

        target_path = self._normalize_endpoint(target_endpoint)
        login_probe = self._send_with_opener(
            self._web_opener,
            "GET",
            target_path,
            None,
            {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )

        if not self._is_login_html_response(login_probe):
            return

        html = login_probe.body.decode("utf-8", errors="ignore")
        csrf_token = self._extract_hidden_input(html, "_csrf")
        target_value = self._extract_hidden_input(html, "target")
        if not target_value:
            target_value = target_path

        payload = urllib.parse.urlencode(
            {
                "method": "vinteo",
                "username": self.web_username,
                "password": self.web_password,
                "target": target_value,
                "_csrf": csrf_token,
            },
        ).encode("utf-8")

        login_response = self._send_with_opener(
            self._web_opener,
            "POST",
            "/auth/login",
            payload,
            {
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
        )

        if login_response.status >= 400:
            raise VinteoClientError(
                f"Web login failed with status {login_response.status}.",
            )

    def _request_web_screenshot(
        self,
        endpoint: str,
        extra_headers: dict[str, str] | None = None,
    ) -> VinteoResponse:
        normalized_endpoint = self._normalize_endpoint(endpoint)
        headers: dict[str, str] = {
            "Accept": "image/*,*/*;q=0.8",
        }
        if extra_headers:
            for key, value in extra_headers.items():
                if value:
                    headers[key] = value

        with self._web_lock:
            self._ensure_web_session(normalized_endpoint)
            response = self._send_with_opener(
                self._web_opener,
                "GET",
                normalized_endpoint,
                None,
                headers,
            )
            if self._is_login_html_response(response):
                self._ensure_web_session(normalized_endpoint)
                response = self._send_with_opener(
                    self._web_opener,
                    "GET",
                    normalized_endpoint,
                    None,
                    headers,
                )
            if self._is_login_html_response(response):
                raise VinteoClientError(
                    "Web screenshot endpoint returned login page.",
                )
            return response

    def request(
        self,
        method: str,
        endpoint: str,
        body: bytes | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> VinteoResponse:
        normalized_endpoint = self._normalize_endpoint(endpoint)
        converted_screen_endpoint = self._convert_api_screenshot_endpoint(
            normalized_endpoint,
        )
        is_screen_shot = "/conferences/screenShot/" in converted_screen_endpoint

        if is_screen_shot and method.upper() == "GET":
            try:
                return self._request_web_screenshot(
                    converted_screen_endpoint,
                    extra_headers,
                )
            except VinteoClientError:
                # Keep compatibility by falling back to legacy API screenshot path.
                pass

        headers: dict[str, str] = {
            "Accept": "application/json",
        }

        if extra_headers:
            for key, value in extra_headers.items():
                if value:
                    headers[key] = value

        if body is not None and "Content-Type" not in headers:
            headers["Content-Type"] = "application/json"

        try:
            access_token = self.token_manager.get_access_token()
        except VinteoAuthError as error:
            raise VinteoClientError(str(error)) from error

        headers["Authorization"] = "Bearer " + access_token
        response = self._send(method, normalized_endpoint, body, headers)

        if response.status == 401:
            try:
                self.token_manager.invalidate_access()
                access_token = self.token_manager.get_access_token(force_refresh=True)
            except VinteoAuthError as error:
                raise VinteoClientError(str(error)) from error

            headers["Authorization"] = "Bearer " + access_token
            response = self._send(method, normalized_endpoint, body, headers)

        return response


vinteo_token_manager = VinteoTokenManager()
vinteo_client = VinteoApiClient(vinteo_token_manager)
