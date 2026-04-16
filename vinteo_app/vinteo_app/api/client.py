"""Vinteo API client with automatic token injection/refresh."""

from __future__ import annotations

import json
import os
import ssl
import urllib.error
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
        self.verify_ssl = str(os.getenv("VINTEO_VERIFY_SSL", "false")).lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

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

    def request(
        self,
        method: str,
        endpoint: str,
        body: bytes | None = None,
        extra_headers: dict[str, str] | None = None,
    ) -> VinteoResponse:
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
        response = self._send(method, endpoint, body, headers)

        if response.status == 401:
            try:
                self.token_manager.invalidate_access()
                access_token = self.token_manager.get_access_token(force_refresh=True)
            except VinteoAuthError as error:
                raise VinteoClientError(str(error)) from error

            headers["Authorization"] = "Bearer " + access_token
            response = self._send(method, endpoint, body, headers)

        return response


vinteo_token_manager = VinteoTokenManager()
vinteo_client = VinteoApiClient(vinteo_token_manager)
