"""Small helpers related to uploaded files."""

from pathlib import Path
from uuid import uuid4

from backend.config import UPLOAD_DIR


def build_upload_path(filename: str) -> tuple[Path, str]:
    safe_name = f"{uuid4().hex}_{Path(filename or 'course').name}"
    return UPLOAD_DIR / safe_name, safe_name
