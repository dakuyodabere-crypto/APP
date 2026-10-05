"""Helpers for consistent API error payloads."""

from fastapi import HTTPException


def api_error(status_code: int, detail: str, *, code: str | None = None) -> HTTPException:
    payload = {"detail": detail}
    if code:
        payload["code"] = code
    return HTTPException(status_code=status_code, detail=payload)
