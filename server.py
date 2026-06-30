from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, BeforeValidator
from typing import List, Optional, Annotated, Dict
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest,
)

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
STRIPE_API_KEY = os.environ['STRIPE_API_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------------- Helpers ----------------
PyObjectId = Annotated[str, BeforeValidator(str)]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur introuvable")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Jeton invalide")


def require_roles(*roles):
    async def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Accès refusé")
        return user
    return checker


def clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password_hash", None)
    return doc


# ---------------- Models ----------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class GradeInput(BaseModel):
    student_id: str
    course: str
    title: str
    score: float
    max_score: float = 20.0
    coefficient: float = 1.0


class MessageInput(BaseModel):
    recipient_id: str
    content: str


class CheckoutInput(BaseModel):
    fee_id: str
    origin_url: str


class BorrowInput(BaseModel):
    book_id: str


# ---------------- Auth Routes ----------------
@api_router.post("/auth/register")
async def register(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    role = data.role if data.role in ("student", "teacher", "admin") else "student"
    doc = {
        "name": data.name, "email": email, "password_hash": hash_password(data.password),
        "role": role, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    token = create_access_token(uid, email, role)
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"token": token, "user": {"id": uid, "name": data.name, "email": email, "role": role}}


@api_router.post("/auth/login")
async def login(data: LoginInput, response: Response):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    uid = str(user["_id"])
    token = create_access_token(uid, email, user["role"])
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"token": token, "user": {"id": uid, "name": user["name"], "email": email, "role": user["role"]}}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------- Users / Contacts ----------------
@api_router.get("/users")
async def list_users(user: dict = Depends(require_roles("admin"))):
    docs = await db.users.find().to_list(500)
    return [clean(d) for d in docs]


@api_router.get("/contacts")
async def contacts(user: dict = Depends(get_current_user)):
    # students message teachers/admin; teachers/admin message everyone
    if user["role"] == "student":
        q = {"role": {"$in": ["teacher", "admin"]}}
    else:
        q = {"_id": {"$ne": ObjectId(user["id"])}}
    docs = await db.users.find(q).to_list(500)
    return [{"id": str(d["_id"]), "name": d["name"], "role": d["role"], "email": d["email"]} for d in docs]


# ---------------- Grades ----------------
@api_router.get("/grades")
async def get_grades(student_id: Optional[str] = None, user: dict = Depends(get_current_user)):
    if user["role"] == "student":
        q = {"student_id": user["id"]}
    elif student_id:
        q = {"student_id": student_id}
    else:
        q = {}
    docs = await db.grades.find(q).sort("created_at", -1).to_list(500)
    return [clean(d) for d in docs]


@api_router.post("/grades")
async def add_grade(data: GradeInput, user: dict = Depends(require_roles("teacher", "admin"))):
    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["teacher"] = user["name"]
    res = await db.grades.insert_one(doc)
    # notify student
    await db.notifications.insert_one({
        "user_id": data.student_id, "title": "Nouvelle note publiée",
        "body": f"{data.course} — {data.title}: {data.score}/{data.max_score}",
        "type": "grade", "read": False, "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return clean({**doc, "_id": res.inserted_id})


# ---------------- Timetable ----------------
@api_router.get("/timetable")
async def get_timetable(user: dict = Depends(get_current_user)):
    docs = await db.timetable.find().to_list(500)
    return [clean(d) for d in docs]


# ---------------- Fees & Payments ----------------
@api_router.get("/fees")
async def get_fees(user: dict = Depends(get_current_user)):
    if user["role"] == "student":
        q = {"student_id": user["id"]}
    else:
        q = {}
    docs = await db.fees.find(q).sort("due_date", 1).to_list(500)
    return [clean(d) for d in docs]


@api_router.post("/payments/checkout")
async def create_checkout(data: CheckoutInput, request: Request, user: dict = Depends(get_current_user)):
    fee = await db.fees.find_one({"_id": ObjectId(data.fee_id)})
    if not fee:
        raise HTTPException(status_code=404, detail="Frais introuvable")
    if fee.get("status") == "paid":
        raise HTTPException(status_code=400, detail="Ces frais sont déjà payés")
    amount = float(fee["amount"])
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{data.origin_url}/paiements?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/paiements"
    req = CheckoutSessionRequest(
        amount=amount, currency="eur", success_url=success_url, cancel_url=cancel_url,
        metadata={"fee_id": data.fee_id, "user_id": user["id"]},
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)
    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "fee_id": data.fee_id, "user_id": user["id"],
        "amount": amount, "currency": "eur", "payment_status": "initiated",
        "status": "initiated", "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}


@api_router.get("/payments/status/{session_id}")
async def payment_status(session_id: str, user: dict = Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction introuvable")
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
            "user_id": tx["user_id"], "title": "Paiement confirmé",
            "body": f"Votre paiement de {tx['amount']} € a été reçu.",
            "type": "payment", "read": False, "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"payment_status": status.payment_status, "status": status.status,
            "amount_total": status.amount_total, "currency": status.currency}


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    try:
        wh = await stripe_checkout.handle_webhook(body, sig)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"ok": False}
    if wh.payment_status == "paid" and wh.session_id:
        tx = await db.payment_transactions.find_one({"session_id": wh.session_id})
        if tx and tx["payment_status"] != "paid":
            await db.payment_transactions.update_one(
                {"session_id": wh.session_id}, {"$set": {"payment_status": "paid", "status": "complete"}})
            await db.fees.update_one(
                {"_id": ObjectId(tx["fee_id"])},
                {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}})
    return {"ok": True}


# ---------------- Library ----------------
@api_router.get("/books")
async def get_books(user: dict = Depends(get_current_user)):
    docs = await db.books.find().to_list(500)
    return [clean(d) for d in docs]


@api_router.post("/library/borrow")
async def borrow(data: BorrowInput, user: dict = Depends(get_current_user)):
    book = await db.books.find_one({"_id": ObjectId(data.book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Livre introuvable")
    if book.get("available", 0) <= 0:
        raise HTTPException(status_code=400, detail="Exemplaire indisponible")
    await db.books.update_one({"_id": ObjectId(data.book_id)}, {"$inc": {"available": -1}})
    loan = {
        "book_id": data.book_id, "book_title": book["title"], "user_id": user["id"],
        "borrowed_at": datetime.now(timezone.utc).isoformat(),
        "due_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "returned": False,
    }
    res = await db.loans.insert_one(loan)
    return clean({**loan, "_id": res.inserted_id})


@api_router.get("/library/loans")
async def my_loans(user: dict = Depends(get_current_user)):
    docs = await db.loans.find({"user_id": user["id"], "returned": False}).to_list(500)
    return [clean(d) for d in docs]


@api_router.post("/library/return/{loan_id}")
async def return_book(loan_id: str, user: dict = Depends(get_current_user)):
    loan = await db.loans.find_one({"_id": ObjectId(loan_id)})
    if not loan:
        raise HTTPException(status_code=404, detail="Emprunt introuvable")
    await db.loans.update_one({"_id": ObjectId(loan_id)}, {"$set": {"returned": True}})
    await db.books.update_one({"_id": ObjectId(loan["book_id"])}, {"$inc": {"available": 1}})
    return {"ok": True}


# ---------------- Messaging ----------------
@api_router.get("/messages/{other_id}")
async def get_conversation(other_id: str, user: dict = Depends(get_current_user)):
    q = {"$or": [
        {"sender_id": user["id"], "recipient_id": other_id},
        {"sender_id": other_id, "recipient_id": user["id"]},
    ]}
    docs = await db.messages.find(q).sort("created_at", 1).to_list(1000)
    # mark received as read
    await db.messages.update_many(
        {"sender_id": other_id, "recipient_id": user["id"], "read": False}, {"$set": {"read": True}})
    return [clean(d) for d in docs]


@api_router.post("/messages")
async def send_message(data: MessageInput, user: dict = Depends(get_current_user)):
    doc = {
        "sender_id": user["id"], "sender_name": user["name"], "recipient_id": data.recipient_id,
        "content": data.content, "read": False, "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.messages.insert_one(doc)
    return clean({**doc, "_id": res.inserted_id})


# ---------------- Notifications ----------------
@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return [clean(d) for d in docs]


@api_router.post("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, user: dict = Depends(get_current_user)):
    await db.notifications.update_one({"_id": ObjectId(notif_id)}, {"$set": {"read": True}})
    return {"ok": True}


@api_router.post("/notifications/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ---------------- Dashboard stats ----------------
@api_router.get("/dashboard")
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
        return {"role": "student", "average": avg, "grades_count": len(grades),
                "pending_fees": round(pending, 2), "active_loans": loans, "unread_notifications": unread}
    else:
        return {
            "role": user["role"],
            "students": await db.users.count_documents({"role": "student"}),
            "teachers": await db.users.count_documents({"role": "teacher"}),
            "courses": len(await db.timetable.distinct("course")),
            "books": await db.books.count_documents({}),
        }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Seeding ----------------
async def seed():
    await db.users.create_index("email", unique=True)
    admin_email = os.environ["ADMIN_EMAIL"]
    admin = await db.users.find_one({"email": admin_email})
    if not admin:
        await db.users.insert_one({
            "name": "Administration", "email": admin_email,
            "password_hash": hash_password(os.environ["ADMIN_PASSWORD"]),
            "role": "admin", "created_at": datetime.now(timezone.utc).isoformat()})

    teacher = await db.users.find_one({"email": "prof@campus.edu"})
    if not teacher:
        tid = (await db.users.insert_one({
            "name": "Prof. Martin Leroy", "email": "prof@campus.edu",
            "password_hash": hash_password("prof123"), "role": "teacher",
            "created_at": datetime.now(timezone.utc).isoformat()})).inserted_id
    else:
        tid = teacher["_id"]

    student = await db.users.find_one({"email": "etudiant@campus.edu"})
    if not student:
        sid = (await db.users.insert_one({
            "name": "Sophie Dubois", "email": "etudiant@campus.edu",
            "password_hash": hash_password("etudiant123"), "role": "student",
            "created_at": datetime.now(timezone.utc).isoformat()})).inserted_id
    else:
        sid = student["_id"]
    sid_str = str(sid)

    if await db.grades.count_documents({}) == 0:
        grades = [
            ("Mathématiques", "Contrôle 1", 15.5, 3), ("Mathématiques", "Examen final", 14.0, 4),
            ("Informatique", "TP Algorithmes", 17.0, 2), ("Informatique", "Projet", 18.5, 3),
            ("Physique", "Contrôle continu", 12.0, 2), ("Physique", "Examen", 13.5, 3),
            ("Anglais", "Oral", 16.0, 1), ("Histoire", "Dissertation", 11.5, 2),
        ]
        for course, title, score, coef in grades:
            await db.grades.insert_one({
                "student_id": sid_str, "course": course, "title": title, "score": score,
                "max_score": 20.0, "coefficient": float(coef), "teacher": "Prof. Martin Leroy",
                "created_at": datetime.now(timezone.utc).isoformat()})

    if await db.timetable.count_documents({}) == 0:
        slots = [
            ("Lundi", "08:00", "10:00", "Mathématiques", "Salle A101", "Prof. Martin Leroy"),
            ("Lundi", "10:15", "12:15", "Informatique", "Lab B204", "Prof. Martin Leroy"),
            ("Lundi", "14:00", "16:00", "Physique", "Salle C302", "Dr. Petit"),
            ("Mardi", "09:00", "11:00", "Anglais", "Salle D105", "Mme. Clarke"),
            ("Mardi", "11:15", "12:45", "Histoire", "Salle A203", "M. Bernard"),
            ("Mercredi", "08:00", "10:00", "Informatique", "Lab B204", "Prof. Martin Leroy"),
            ("Mercredi", "10:15", "12:15", "Mathématiques", "Salle A101", "Prof. Martin Leroy"),
            ("Jeudi", "14:00", "17:00", "Projet tutoré", "Lab B210", "Prof. Martin Leroy"),
            ("Vendredi", "09:00", "11:00", "Physique", "Salle C302", "Dr. Petit"),
            ("Vendredi", "11:15", "12:45", "Anglais", "Salle D105", "Mme. Clarke"),
        ]
        for day, start, end, course, room, teacher_name in slots:
            await db.timetable.insert_one({
                "day": day, "start": start, "end": end, "course": course,
                "room": room, "teacher": teacher_name})

    if await db.fees.count_documents({}) == 0:
        fees = [
            ("Frais de scolarité — Semestre 1", 1200.00, "2026-02-15", "paid"),
            ("Frais de scolarité — Semestre 2", 1200.00, "2026-07-15", "pending"),
            ("Frais de bibliothèque", 45.00, "2026-03-01", "pending"),
            ("Cotisation activités étudiantes", 80.00, "2026-03-10", "pending"),
        ]
        for label, amount, due, status in fees:
            await db.fees.insert_one({
                "student_id": sid_str, "label": label, "amount": amount,
                "due_date": due, "status": status})

    if await db.books.count_documents({}) == 0:
        cover1 = "https://images.pexels.com/photos/8581043/pexels-photo-8581043.jpeg"
        cover2 = "https://images.pexels.com/photos/683929/pexels-photo-683929.jpeg"
        books = [
            ("Introduction aux algorithmes", "Cormen, Leiserson", "Informatique", 3, cover1),
            ("Analyse mathématique", "Jean Dieudonné", "Mathématiques", 2, cover2),
            ("Physique quantique", "R. Feynman", "Physique", 1, cover1),
            ("Histoire contemporaine", "E. Hobsbawm", "Histoire", 4, cover2),
            ("Clean Code", "Robert C. Martin", "Informatique", 2, cover1),
            ("L'Anglais des affaires", "M. Clarke", "Langues", 5, cover2),
        ]
        for title, author, cat, copies, cover in books:
            await db.books.insert_one({
                "title": title, "author": author, "category": cat,
                "total": copies, "available": copies, "cover": cover})

    if await db.notifications.count_documents({"user_id": sid_str}) == 0:
        notifs = [
            ("Bienvenue sur CampusConnect", "Votre espace étudiant est prêt.", "info"),
            ("Échéance de paiement", "Frais de scolarité S2 à régler avant le 15/07.", "payment"),
            ("Nouvelle note publiée", "Informatique — Projet: 18.5/20", "grade"),
        ]
        for title, body, t in notifs:
            await db.notifications.insert_one({
                "user_id": sid_str, "title": title, "body": body, "type": t,
                "read": False, "created_at": datetime.now(timezone.utc).isoformat()})

    if await db.messages.count_documents({}) == 0:
        await db.messages.insert_one({
            "sender_id": str(tid), "sender_name": "Prof. Martin Leroy", "recipient_id": sid_str,
            "content": "Bonjour Sophie, pensez à rendre le projet avant vendredi.",
            "read": False, "created_at": datetime.now(timezone.utc).isoformat()})


@app.on_event("startup")
async def startup():
    await seed()
    logger.info("Seed terminé")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
