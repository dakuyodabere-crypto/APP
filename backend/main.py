"""Application entry point for the Smart Campus backend."""

import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.staticfiles import StaticFiles

from backend.config import ROOT_DIR, logger
from backend.routes.auth import router as auth_router
from backend.routes.courses import router as courses_router
from backend.routes.grades import router as grades_router
from backend.routes.payments import router as payments_router
from backend.seed import seed as seed_database


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await seed_database()
    logger.info("Seed terminé")
    yield


app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)
app.include_router(grades_router)
app.include_router(payments_router)
app.include_router(courses_router)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Requête invalide", "errors": exc.errors()})

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Une erreur interne s'est produite"})

app.mount("/uploads", StaticFiles(directory=ROOT_DIR / "uploads"), name="uploads")

allowed_origins = {
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", "").split(",")
    if origin.strip()
}
allowed_origins.update({"http://localhost:5173", "http://127.0.0.1:5173"})

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=list(sorted(allowed_origins)),
    allow_methods=["*"],
    allow_headers=["*"],
)


# Serve frontend build if available, after API routes so backend endpoints remain usable.
static_dir = ROOT_DIR / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
