"""Grades and academic-related routes."""

import csv
import io
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from reportlab.lib import colors
from starlette.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, Spacer, SimpleDocTemplate, Table, TableStyle

from backend.config import ACCESS_DENIED_MESSAGE
from backend.models import GradeInput
from backend.security import clean, get_current_user, require_roles
from backend.database import db
from backend.services.activity import log_activity

router = APIRouter(prefix="/api")


@router.get("/grades")
async def get_grades(
    student_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    user: dict = Depends(get_current_user),
):
    if user["role"] == "student":
        q = {"student_id": user["id"]}
    elif student_id:
        q = {"student_id": student_id}
    else:
        q = {}
    docs = await db.grades.find(q).sort("created_at", -1).skip((page - 1) * page_size).limit(page_size).to_list(page_size)
    return [clean(d) for d in docs]


@router.get("/grades/export")
async def export_grades(student_id: Optional[str] = None, user: dict = Depends(require_roles("teacher", "admin"))):
    if student_id and not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Identifiant étudiant invalide")

    query = {"student_id": student_id} if student_id else {}
    docs = await db.grades.find(query).sort("created_at", -1).to_list(500)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Étudiant", "Matière", "Évaluation", "Professeur", "Note", "Note maximale", "Coefficient"])
    for grade in docs:
        writer.writerow([
            grade.get("student_id", ""),
            grade.get("course", ""),
            grade.get("title", ""),
            grade.get("teacher", ""),
            grade.get("score", ""),
            grade.get("max_score", ""),
            grade.get("coefficient", ""),
        ])

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=notes.csv"},
    )


@router.get("/grades/export.pdf")
async def export_grades_pdf(student_id: Optional[str] = None, user: dict = Depends(require_roles("teacher", "admin"))):
    if student_id and not ObjectId.is_valid(student_id):
        raise HTTPException(status_code=400, detail="Identifiant étudiant invalide")

    query = {"student_id": student_id} if student_id else {}
    docs = await db.grades.find(query).sort("created_at", -1).to_list(500)
    buffer = io.BytesIO()
    document = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=1.2 * cm, leftMargin=1.2 * cm)
    styles = getSampleStyleSheet()
    story = [Paragraph("Relevé des notes", styles["Title"]), Spacer(1, 0.4 * cm)]
    rows = [["Étudiant", "Matière", "Évaluation", "Professeur", "Note", "Coef."]]
    rows.extend([
        [
            grade.get("student_id", ""),
            grade.get("course", ""),
            grade.get("title", ""),
            grade.get("teacher", ""),
            f"{grade.get('score', '')}/{grade.get('max_score', '')}",
            grade.get("coefficient", ""),
        ]
        for grade in docs
    ])
    table = Table(rows, repeatRows=1, colWidths=[3.2 * cm, 3.2 * cm, 4.2 * cm, 3.4 * cm, 2.2 * cm, 1.5 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#002FA7")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D4D4D8")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F4F5")]),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(table)
    document.build(story)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=notes.pdf"},
    )


@router.post("/grades")
async def add_grade(data: GradeInput, user: dict = Depends(require_roles("teacher", "admin"))):
    if data.score < 0 or data.score > data.max_score:
        raise HTTPException(status_code=400, detail="La note doit être comprise entre 0 et la note maximale")
    if data.coefficient <= 0:
        raise HTTPException(status_code=400, detail="Le coefficient doit être positif")

    target_student = await db.users.find_one({"_id": ObjectId(data.student_id)})
    if not target_student:
        raise HTTPException(status_code=404, detail="Étudiant introuvable")

    doc = data.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["teacher"] = user["name"]
    res = await db.grades.insert_one(doc)
    await db.notifications.insert_one({
        "user_id": data.student_id,
        "title": "Nouvelle note publiée",
        "body": f"{data.course} — {data.title}: {data.score}/{data.max_score}",
        "type": "grade",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await log_activity(user, "create", "grade", str(res.inserted_id))
    return clean({**doc, "_id": res.inserted_id})
