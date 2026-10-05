"""Authentication and user routes."""

import time
from datetime import datetime, timezone
from typing import Dict

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi import Query

from backend.utils.errors import api_error

from backend.config import ACCESS_DENIED_MESSAGE, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_SECONDS
from backend.models import LoginInput, RegisterInput
from backend.security import clean, create_access_token, get_current_user, hash_password, require_roles, verify_password
from backend.database import db

router = APIRouter(prefix="/api")
login_attempts: Dict[str, list[float]] = {}


@router.post("/auth/signup")
async def signup(data: RegisterInput, response: Response):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    doc = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "student",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    token = create_access_token(uid, email, "student")
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"token": token, "user": {"id": uid, "name": data.name, "email": email, "role": "student"}}


@router.post("/auth/register")
async def register(data: RegisterInput, current_user: dict = Depends(require_roles("admin"))):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    role = data.role
    doc = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": role,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.users.insert_one(doc)
    uid = str(res.inserted_id)
    return {"user": {"id": uid, "name": data.name, "email": email, "role": role}}


@router.post("/auth/login")
async def login(data: LoginInput, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    recent_attempts = [timestamp for timestamp in login_attempts.get(client_ip, []) if now - timestamp < LOGIN_WINDOW_SECONDS]
    if len(recent_attempts) >= LOGIN_MAX_ATTEMPTS:
        raise api_error(429, "Trop de tentatives. Réessayez dans une minute.")

    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        recent_attempts.append(now)
        login_attempts[client_ip] = recent_attempts
        raise api_error(401, "Email ou mot de passe incorrect")
    login_attempts.pop(client_ip, None)
    uid = str(user["_id"])
    token = create_access_token(uid, email, user["role"])
    response.set_cookie("access_token", token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"token": token, "user": {"id": uid, "name": user["name"], "email": email, "role": user["role"]}}


@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@router.get("/users/{user_id}")
async def get_user_by_id(user_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ("admin", "teacher") and current_user["id"] != user_id:
        raise api_error(403, ACCESS_DENIED_MESSAGE)
    if not ObjectId.is_valid(user_id):
        raise api_error(400, "Identifiant utilisateur invalide")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise api_error(404, "Utilisateur introuvable")

    return clean(user)


@router.get("/users")
async def list_users(user: dict = Depends(require_roles("admin"))):
    docs = await db.users.find().to_list(500)
    return [clean(d) for d in docs]


@router.get("/admin/activity")
async def activity_log(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_roles("admin")),
):
    docs = await db.activity_logs.find().sort("created_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return [clean(d) for d in docs]


@router.get("/contacts")
async def contacts(user: dict = Depends(get_current_user)):
    if user["role"] == "student":
        q = {"role": {"$in": ["teacher", "admin"]}}
    else:
        q = {"_id": {"$ne": ObjectId(user["id"])} }
    docs = await db.users.find(q).to_list(500)
    return [{"id": str(d["_id"]), "name": d["name"], "role": d["role"], "email": d["email"]} for d in docs]
