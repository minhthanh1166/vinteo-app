from pathlib import Path
import re

from django.conf import settings
from django.shortcuts import render


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
