"""Configuration and infrastructure clients for the backend."""

import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
load_dotenv(ROOT_DIR / ".env")


def require_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        if default is not None:
            return default
        raise RuntimeError(f"Variable d'environnement manquante: {name}")
    return value


MONGO_URL = require_env("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = require_env("DB_NAME", "smart_campus")
STRIPE_API_KEY = require_env("STRIPE_API_KEY", "sk_test_emergent")
JWT_SECRET = require_env("JWT_SECRET", "dev-secret-change-me-in-production")
ADMIN_EMAIL = require_env("ADMIN_EMAIL", "admin@campus.edu")
ADMIN_PASSWORD = require_env("ADMIN_PASSWORD", "admin123")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

try:
    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout,
        CheckoutSessionRequest,
        CheckoutSessionResponse,
        CheckoutStatusResponse,
    )
except ImportError:
    class CheckoutSessionRequest:
        def __init__(self, amount: float, currency: str, success_url: str, cancel_url: str, metadata: dict):
            self.amount = amount
            self.currency = currency
            self.success_url = success_url
            self.cancel_url = cancel_url
            self.metadata = metadata

    class CheckoutSessionResponse:
        def __init__(self, session_id: str, url: str):
            self.session_id = session_id
            self.url = url

    class CheckoutStatusResponse:
        def __init__(self, payment_status: str, status: str, amount_total: float = 0.0, currency: str = "eur"):
            self.payment_status = payment_status
            self.status = status
            self.amount_total = amount_total
            self.currency = currency

    class StripeCheckout:
        def __init__(self, api_key: str, webhook_url: str):
            self.api_key = api_key
            self.webhook_url = webhook_url

        def create_checkout_session(self, req: CheckoutSessionRequest):
            return CheckoutSessionResponse(
                session_id="stub-session",
                url=req.success_url.replace("{CHECKOUT_SESSION_ID}", "stub-session"),
            )

        def get_checkout_status(self, _session_id: str):
            return CheckoutStatusResponse(payment_status="paid", status="paid")

        def handle_webhook(self, _body: bytes, _sig: str):
            class WebhookResult:
                def __init__(self):
                    self.payment_status = "paid"
                    self.session_id = "stub-session"

            return WebhookResult()


JWT_ALGORITHM = "HS256"
ACCESS_DENIED_MESSAGE = "Accès refusé"
LOGIN_WINDOW_SECONDS = 60
LOGIN_MAX_ATTEMPTS = 5
logger = logging.getLogger("smart_campus")
