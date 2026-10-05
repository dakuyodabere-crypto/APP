import httpx
import pytest

from backend.main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_protected_routes_require_authentication():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json()["detail"] == "Non authentifié"


@pytest.mark.anyio
async def test_login_rejects_invalid_email_before_database_access():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={"email": "invalid-email", "password": "password"},
        )

    assert response.status_code == 422
    assert response.json()["detail"] == "Requête invalide"


def test_payment_routes_are_registered():
    routes = set(app.openapi()["paths"])

    assert "/api/payments/checkout" in routes
    assert "/api/webhook/stripe" in routes


def test_public_signup_route_is_registered_separately_from_admin_registration():
    routes = set(app.openapi()["paths"])

    assert "/api/auth/signup" in routes
    assert "/api/auth/register" in routes
