"""Payments, fees, library, messaging, and notifications routes."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request

from backend.config import ACCESS_DENIED_MESSAGE, STRIPE_API_KEY, logger
from backend.models import BorrowInput, CheckoutInput, MessageInput
from backend.security import clean, get_current_user
from backend.database import db
from backend.services.activity import log_activity
from emergentintegrations.payments.stripe.checkout import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    StripeCheckout,
)

router = APIRouter(prefix="/api")


@router.get("/fees")
async def get_fees(user: dict = Depends(get_current_user)):
    if user["role"] == "student":
        q = {"student_id": user["id"]}
    else:
        q = {}
    docs = await db.fees.find(q).sort("due_date", 1).to_list(500)
    return [clean(d) for d in docs]


@router.post("/payments/checkout")
async def create_checkout(data: CheckoutInput, request: Request, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(data.fee_id):
        raise HTTPException(status_code=400, detail="Identifiant de frais invalide")
    fee = await db.fees.find_one({"_id": ObjectId(data.fee_id)})
    if not fee:
        raise HTTPException(status_code=404, detail="Frais introuvable")
    if fee.get("student_id") != user["id"] and user["role"] not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail=ACCESS_DENIED_MESSAGE)
    if fee.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Ces frais sont déjà payés")
    amount = float(fee["amount"])
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{data.origin_url}/paiements?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/paiements"
    req = CheckoutSessionRequest(
        amount=amount,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"fee_id": data.fee_id, "user_id": user["id"]},
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id,
        "fee_id": data.fee_id,
        "user_id": user["id"],
        "amount": amount,
        "currency": "eur",
        "payment_status": "initiated",
        "status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await log_activity(user, "create", "payment", session.session_id)
    return {"url": session.url, "session_id": session.session_id}


@router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, user: dict = Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
    if tx.get("user_id") != user["id"] and user["role"] not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail=ACCESS_DENIED_MESSAGE)
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    if tx["payment_status"] != "paid" and status.payment_status == "paid":
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid", "status": status.status}},
        )
        await db.fees.update_one(
            {"_id": ObjectId(tx["fee_id"])},
            {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
        )
        await db.notifications.insert_one({
            "user_id": tx["user_id"],
            "title": "Paiement confirmé",
            "body": f"Votre paiement de {tx['amount']} € a été reçu.",
            "type": "payment",
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"payment_status": status.payment_status, "status": status.status, "amount_total": status.amount_total, "currency": status.currency}


@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    try:
        wh = await stripe_checkout.handle_webhook(body, sig)
    except Exception:
        logger.exception("Webhook error")
        raise HTTPException(status_code=400, detail="Webhook Stripe invalide")
    if wh.payment_status == "paid" and wh.session_id:
        tx = await db.payment_transactions.find_one({"session_id": wh.session_id})
        if tx and tx["payment_status"] != "paid":
            await db.payment_transactions.update_one(
                {"session_id": wh.session_id},
                {"$set": {"payment_status": "paid", "status": "complete"}},
            )
            await db.fees.update_one(
                {"_id": ObjectId(tx["fee_id"])},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
            )
    return {"ok": True}


@router.get("/books")
async def get_books(user: dict = Depends(get_current_user)):
    docs = await db.books.find().to_list(500)
    return [clean(d) for d in docs]


@router.post("/library/borrow")
async def borrow(data: BorrowInput, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(data.book_id):
        raise HTTPException(status_code=400, detail="Identifiant de livre invalide")

    book = await db.books.find_one({"_id": ObjectId(data.book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Livre introuvable")

    existing = await db.loans.find_one({"book_id": data.book_id, "user_id": user["id"], "returned": False})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà emprunté ce livre")

    stock_update = await db.books.update_one(
        {"_id": ObjectId(data.book_id), "available": {"$gt": 0}},
        {"$inc": {"available": -1}},
    )
    if stock_update.modified_count != 1:
        raise HTTPException(status_code=400, detail="Exemplaire indisponible")
    loan = {
        "book_id": data.book_id,
        "book_title": book["title"],
        "user_id": user["id"],
        "borrowed_at": datetime.now(timezone.utc).isoformat(),
        "due_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "returned": False,
    }
    res = await db.loans.insert_one(loan)
    return clean({**loan, "_id": res.inserted_id})


@router.get("/library/loans")
async def my_loans(user: dict = Depends(get_current_user)):
    docs = await db.loans.find({"user_id": user["id"], "returned": False}).to_list(500)
    return [clean(d) for d in docs]


@router.post("/library/return/{loan_id}")
async def return_book(loan_id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(loan_id):
        raise HTTPException(status_code=400, detail="Identifiant d'emprunt invalide")

    loan = await db.loans.find_one({"_id": ObjectId(loan_id)})
    if not loan:
        raise HTTPException(status_code=404, detail="Emprunt introuvable")
    if loan.get("user_id") != user["id"] and user["role"] not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail=ACCESS_DENIED_MESSAGE)
    if loan.get("returned"):
        raise HTTPException(status_code=400, detail="Ce prêt est déjà retourné")

    await db.loans.update_one({"_id": ObjectId(loan_id)}, {"$set": {"returned": True}})
    await db.books.update_one({"_id": ObjectId(loan["book_id"])}, {"$inc": {"available": 1}})
    return {"ok": True}


@router.get("/messages/{other_id}")
async def get_conversation(other_id: str, user: dict = Depends(get_current_user)):
    q = {"$or": [
        {"sender_id": user["id"], "recipient_id": other_id},
        {"sender_id": other_id, "recipient_id": user["id"]},
    ]}
    docs = await db.messages.find(q).sort("created_at", 1).to_list(1000)
    await db.messages.update_many(
        {"sender_id": other_id, "recipient_id": user["id"], "read": False},
        {"$set": {"read": True}},
    )
    return [clean(d) for d in docs]


@router.post("/messages")
async def send_message(data: MessageInput, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(data.recipient_id):
        raise HTTPException(status_code=400, detail="Destinataire invalide")
    recipient = await db.users.find_one({"_id": ObjectId(data.recipient_id)})
    if not recipient:
        raise HTTPException(status_code=404, detail="Destinataire introuvable")
    if data.recipient_id == user["id"]:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas vous écrire à vous-même")
    doc = {
        "sender_id": user["id"],
        "sender_name": user["name"],
        "recipient_id": data.recipient_id,
        "content": data.content,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.messages.insert_one(doc)
    return clean({**doc, "_id": res.inserted_id})


@router.get("/notifications")
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    docs = await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return [clean(d) for d in docs]


@router.post("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(notif_id):
        raise HTTPException(status_code=400, detail="Identifiant de notification invalide")

    notif = await db.notifications.find_one({"_id": ObjectId(notif_id)})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification introuvable")
    if notif.get("user_id") != user["id"] and user["role"] not in ("admin", "teacher"):
        raise HTTPException(status_code=403, detail=ACCESS_DENIED_MESSAGE)

    await db.notifications.update_one({"_id": ObjectId(notif_id)}, {"$set": {"read": True}})
    return {"ok": True}


@router.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


@router.get("/dashboard")
async def dashboard(user: dict = Depends(get_current_user)):
    if user["role"] == "student":
        grades = await db.grades.find({"student_id": user["id"]}).to_list(500)
        avg = None
        if grades:
            tw = sum(g["coefficient"] for g in grades)
            avg = round(sum((g["score"] / g["max_score"] * 20) * g["coefficient"] for g in grades) / tw, 2)
        fees = await db.fees.find({"student_id": user["id"]}).to_list(500)
        pending = sum(f["amount"] for f in fees if f.get("status") != "paid")
        loans = await db.loans.count_documents({"user_id": user["id"], "returned": False})
        unread = await db.notifications.count_documents({"user_id": user["id"], "read": False})
        return {"role": "student", "average": avg, "grades_count": len(grades), "pending_fees": round(pending, 2), "active_loans": loans, "unread_notifications": unread}
    else:
        return {
            "role": user["role"],
            "students": await db.users.count_documents({"role": "student"}),
            "teachers": await db.users.count_documents({"role": "teacher"}),
            "courses": len(await db.timetable.distinct("course")),
            "books": await db.books.count_documents({}),
        }
