from pathlib import Path
import json
import re

from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .api.client import VinteoClientError, vinteo_client


def _natural_sort_key(file_name: str) -> list[tuple[int, int | str]]:
    parts = re.split(r"(\d+)", file_name.lower())
    key: list[tuple[int, int | str]] = []
    for part in parts:
        if not part:
            continue
        if part.isdigit():
            key.append((0, int(part)))
        else:
            key.append((1, part))
    return key


def _collect_layout_images(category: str) -> list[str]:
    base_dir = Path(settings.BASE_DIR) / "static" / "layout" / category
    if not base_dir.exists():
        return []

    allowed_ext = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    files = [
        file_path
        for file_path in base_dir.iterdir()
        if file_path.is_file() and file_path.suffix.lower() in allowed_ext
    ]
    files.sort(key=lambda file_path: _natural_sort_key(file_path.name))
    return [f"layout/{category}/{file_path.name}" for file_path in files]


def dashboard(request):
    context = {
        "layout_focus_images": _collect_layout_images("focus"),
        "layout_equal_images": _collect_layout_images("equal"),
    }
    return render(request, "dashboard.html", context)


def _build_proxy_response(status: int, headers: dict[str, str], body: bytes) -> HttpResponse:
    content_type = headers.get("Content-Type", "application/json")

    if "application/json" in content_type.lower():
        if not body:
            return JsonResponse({}, status=status)

        try:
            payload = json.loads(body.decode("utf-8"))
            return JsonResponse(payload, safe=not isinstance(payload, list), status=status)
        except (UnicodeDecodeError, json.JSONDecodeError):
            return HttpResponse(body, status=status, content_type=content_type)

    return HttpResponse(body, status=status, content_type=content_type)


@csrf_exempt
@require_http_methods(["GET", "POST", "PUT", "PATCH", "DELETE"])
def vinteo_proxy(request, endpoint: str):
    query = request.META.get("QUERY_STRING", "").strip()
    upstream_endpoint = endpoint
    if query:
        upstream_endpoint += "?" + query

    body = request.body if request.body else None
    extra_headers: dict[str, str] = {}
    content_type = request.META.get("CONTENT_TYPE", "").strip()
    if content_type:
        extra_headers["Content-Type"] = content_type

    try:
        response = vinteo_client.request(
            method=request.method,
            endpoint=upstream_endpoint,
            body=body,
            extra_headers=extra_headers,
        )
    except VinteoClientError as error:
        return JsonResponse({"error": str(error)}, status=502)

    return _build_proxy_response(response.status, response.headers, response.body)
