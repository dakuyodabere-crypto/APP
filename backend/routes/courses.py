"""Courses and timetable routes."""

from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from backend.config import ACCESS_DENIED_MESSAGE, UPLOAD_DIR
from backend.security import clean, get_current_user, require_roles
from backend.database import db
from backend.services.activity import log_activity
from backend.services.files import build_upload_path

router = APIRouter(prefix="/api")


@router.get("/timetable")
async def get_timetable(user: dict = Depends(get_current_user)):
    docs = await db.timetable.find().to_list(500)
    return [clean(d) for d in docs]


@router.get("/courses")
async def get_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    user: dict = Depends(get_current_user),
):
    docs = await db.courses.find().sort("created_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return [clean(d) for d in docs]


@router.post("/courses")
async def create_course(
    title: str = Form(...),
    description: str = Form(...),
    subject: str = Form(...),
    file_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    user: dict = Depends(require_roles("teacher", "admin")),
):
    if not file and not file_url:
        raise HTTPException(status_code=400, detail="Ajoutez un fichier ou un lien vers la ressource")

    stored_url = None
    stored_name = None
    if file:
        allowed_types = {"application/pdf", "image/png", "image/jpeg", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"}
        max_file_size = 10 * 1024 * 1024
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Type de fichier non autorisé")
        file_path, safe_name = build_upload_path(file.filename or "course")
        content = await file.read()
        if len(content) > max_file_size:
            raise HTTPException(status_code=413, detail="Le fichier ne doit pas dépasser 10 Mo")
        file_path.write_bytes(content)
        stored_url = f"/uploads/{safe_name}"
        stored_name = Path(file.filename or "course").name

    if file_url and not stored_url:
        stored_url = file_url.strip()

    doc = {
        "title": title.strip(),
        "description": description.strip(),
        "subject": subject.strip(),
        "file_url": stored_url,
        "file_name": stored_name,
        "created_by": user["name"],
        "teacher_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    res = await db.courses.insert_one(doc)
    await log_activity(user, "create", "course", str(res.inserted_id))
    return clean({**doc, "_id": res.inserted_id})
