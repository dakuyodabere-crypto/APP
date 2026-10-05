"""Activity logging helpers shared by the API routes."""

from datetime import datetime, timezone

from backend.database import db


async def log_activity(user: dict, action: str, resource: str, resource_id: str | None = None) -> None:
    await db.activity_logs.insert_one({
        "user_id": user["id"],
        "user_name": user["name"],
        "action": action,
        "resource": resource,
        "resource_id": resource_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
