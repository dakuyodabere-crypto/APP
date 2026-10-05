"""Idempotent demo-data seeding for the local Smart Campus environment."""

from datetime import datetime, timezone

from .config import ADMIN_EMAIL, ADMIN_PASSWORD, db
from .security import hash_password

TEACHER_NAME = "Prof. Martin Leroy"
MATH_SUBJECT = "Mathématiques"


async def ensure_users():
    await db.users.create_index("email", unique=True)
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        await db.users.insert_one({
            "name": "Administration", "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD), "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat()})

    teacher = await db.users.find_one({"email": "prof@campus.edu"})
    if not teacher:
        teacher_id = (await db.users.insert_one({
            "name": TEACHER_NAME, "email": "prof@campus.edu",
            "password_hash": hash_password("prof123"), "role": "teacher",
            "created_at": datetime.now(timezone.utc).isoformat()})).inserted_id
    else:
        teacher_id = teacher["_id"]

    student = await db.users.find_one({"email": "etudiant@campus.edu"})
    if not student:
        student_id = (await db.users.insert_one({
            "name": "Sophie Dubois", "email": "etudiant@campus.edu",
            "password_hash": hash_password("etudiant123"), "role": "student",
            "created_at": datetime.now(timezone.utc).isoformat()})).inserted_id
    else:
        student_id = student["_id"]
    return teacher_id, student_id


async def seed_grades(student_id: str):
    if await db.grades.count_documents({}):
        return
    grades = [
        (MATH_SUBJECT, "Contrôle 1", 15.5, 3), (MATH_SUBJECT, "Examen final", 14.0, 4),
        ("Informatique", "TP Algorithmes", 17.0, 2), ("Informatique", "Projet", 18.5, 3),
        ("Physique", "Contrôle continu", 12.0, 2), ("Physique", "Examen", 13.5, 3),
        ("Anglais", "Oral", 16.0, 1), ("Histoire", "Dissertation", 11.5, 2),
    ]
    for course, title, score, coef in grades:
        await db.grades.insert_one({
            "student_id": student_id, "course": course, "title": title, "score": score,
            "max_score": 20.0, "coefficient": float(coef), "teacher": TEACHER_NAME,
            "created_at": datetime.now(timezone.utc).isoformat()})


async def seed_timetable():
    if await db.timetable.count_documents({}):
        return
    slots = [
        ("Lundi", "08:00", "10:00", MATH_SUBJECT, "Salle A101", TEACHER_NAME),
        ("Lundi", "10:15", "12:15", "Informatique", "Lab B204", TEACHER_NAME),
        ("Lundi", "14:00", "16:00", "Physique", "Salle C302", "Dr. Petit"),
        ("Mardi", "09:00", "11:00", "Anglais", "Salle D105", "Mme. Clarke"),
        ("Mardi", "11:15", "12:45", "Histoire", "Salle A203", "M. Bernard"),
        ("Mercredi", "08:00", "10:00", "Informatique", "Lab B204", TEACHER_NAME),
        ("Mercredi", "10:15", "12:15", MATH_SUBJECT, "Salle A101", TEACHER_NAME),
        ("Jeudi", "14:00", "17:00", "Projet tutoré", "Lab B210", TEACHER_NAME),
        ("Vendredi", "09:00", "11:00", "Physique", "Salle C302", "Dr. Petit"),
        ("Vendredi", "11:15", "12:45", "Anglais", "Salle D105", "Mme. Clarke"),
    ]
    for day, start, end, course, room, teacher_name in slots:
        await db.timetable.insert_one({
            "day": day, "start": start, "end": end, "course": course,
            "room": room, "teacher": teacher_name, "program": "Informatique", "year": "Année 1"})


async def seed_courses(teacher_id):
    if await db.courses.count_documents({}):
        return
    sample_courses = [
        ("Algorithmes avancés", "Supports de cours pour l’optimisation et la complexité algorithmique.", "Informatique", "https://example.com/cours-algorithmes.pdf"),
        ("Analyse de données", "Séance d’introduction aux tableaux croisés et visualisation des données.", MATH_SUBJECT, "https://example.com/cours-donnees.pdf"),
    ]
    for title, description, subject, file_url in sample_courses:
        await db.courses.insert_one({
            "title": title, "description": description, "subject": subject,
            "file_url": file_url, "created_by": TEACHER_NAME, "teacher_id": str(teacher_id),
            "created_at": datetime.now(timezone.utc).isoformat()})


async def seed_fees(student_id: str):
    if await db.fees.count_documents({}):
        return
    fees = [
        ("Frais de scolarité — Semestre 1", 1200.00, "2026-02-15", "paid"),
        ("Frais de scolarité — Semestre 2", 1200.00, "2026-07-15", "pending"),
        ("Frais de bibliothèque", 45.00, "2026-03-01", "pending"),
        ("Cotisation activités étudiantes", 80.00, "2026-03-10", "pending"),
    ]
    for label, amount, due, status in fees:
        await db.fees.insert_one({"student_id": student_id, "label": label, "amount": amount, "due_date": due, "status": status})


async def seed_books():
    if await db.books.count_documents({}):
        return
    cover1 = "https://images.pexels.com/photos/8581043/pexels-photo-8581043.jpeg"
    cover2 = "https://images.pexels.com/photos/683929/pexels-photo-683929.jpeg"
    books = [
        ("Introduction aux algorithmes", "Cormen, Leiserson", "Informatique", 3, cover1),
        ("Analyse mathématique", "Jean Dieudonné", MATH_SUBJECT, 2, cover2),
        ("Physique quantique", "R. Feynman", "Physique", 1, cover1),
        ("Histoire contemporaine", "E. Hobsbawm", "Histoire", 4, cover2),
        ("Clean Code", "Robert C. Martin", "Informatique", 2, cover1),
        ("L'Anglais des affaires", "M. Clarke", "Langues", 5, cover2),
    ]
    for title, author, category, copies, cover in books:
        await db.books.insert_one({"title": title, "author": author, "category": category, "total": copies, "available": copies, "cover": cover})


async def seed_notifications(student_id: str):
    if await db.notifications.count_documents({"user_id": student_id}):
        return
    for title, body, notification_type in [
        ("Bienvenue sur CampusConnect", "Votre espace étudiant est prêt.", "info"),
        ("Échéance de paiement", "Frais de scolarité S2 à régler avant le 15/07.", "payment"),
        ("Nouvelle note publiée", "Informatique — Projet: 18.5/20", "grade"),
    ]:
        await db.notifications.insert_one({
            "user_id": student_id, "title": title, "body": body, "type": notification_type,
            "read": False, "created_at": datetime.now(timezone.utc).isoformat()})


async def seed_messages(teacher_id, student_id: str):
    if await db.messages.count_documents({}):
        return
    await db.messages.insert_one({
        "sender_id": str(teacher_id), "sender_name": TEACHER_NAME, "recipient_id": student_id,
        "content": "Bonjour Sophie, pensez à rendre le projet avant vendredi.",
        "read": False, "created_at": datetime.now(timezone.utc).isoformat()})


async def seed():
    teacher_id, student_id = await ensure_users()
    student_id_str = str(student_id)
    await seed_grades(student_id_str)
    await seed_timetable()
    await seed_courses(teacher_id)
    await seed_fees(student_id_str)
    await seed_books()
    await seed_notifications(student_id_str)
    await seed_messages(teacher_id, student_id_str)
