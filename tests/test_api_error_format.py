import httpx
import pytest

from backend.main import app


@pytest.mark.anyio
async def test_login_returns_consistent_error_payload():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/login",
            json={"email": "missing@example.com", "password": "wrong"},
        )

    assert response.status_code == 401
    payload = response.json()
    assert payload["detail"]["detail"] == "Email ou mot de passe incorrect"
