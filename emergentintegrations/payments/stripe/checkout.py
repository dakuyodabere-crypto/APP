from dataclasses import dataclass


@dataclass
class CheckoutSessionRequest:
    amount: float
    currency: str
    success_url: str
    cancel_url: str
    metadata: dict


@dataclass
class CheckoutSessionResponse:
    session_id: str
    url: str


@dataclass
class CheckoutStatusResponse:
    payment_status: str
    status: str
    amount_total: float = 0.0
    currency: str = "eur"


class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str):
        self.api_key = api_key
        self.webhook_url = webhook_url

    def create_checkout_session(self, req: CheckoutSessionRequest):
        return CheckoutSessionResponse(session_id="stub-session", url=req.success_url.replace("{CHECKOUT_SESSION_ID}", "stub-session"))

    def get_checkout_status(self, _session_id: str):
        return CheckoutStatusResponse(payment_status="paid", status="paid", amount_total=0.0, currency="eur")

    def handle_webhook(self, _body: bytes, _sig: str):
        return CheckoutStatusResponse(payment_status="paid", status="paid", amount_total=0.0, currency="eur")
