import importlib

import httpx
import pytest

from backend.main import app


def test_backend_config_uses_safe_defaults_when_environment_values_are_blank(monkeypatch):
    for key in [
        "MONGO_URL",
        "DB_NAME",
        "STRIPE_API_KEY",
        "JWT_SECRET",
        "ADMIN_EMAIL",
        "ADMIN_PASSWORD",
    ]:
        monkeypatch.setenv(key, "")

    import backend.config as config_module

    reloaded = importlib.reload(config_module)

    assert reloaded.MONGO_URL == "mongodb://localhost:27017"
    assert reloaded.DB_NAME == "smart_campus"
    assert reloaded.JWT_SECRET
    assert reloaded.ADMIN_EMAIL == "admin@campus.edu"
    assert reloaded.ADMIN_PASSWORD == "admin123"


@pytest.mark.anyio
async def test_app_exposes_backend_routes():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Non authentifié"
