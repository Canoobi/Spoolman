"""Helper functions for print request workflow."""

import hashlib
import os
import secrets
from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from spoolman.database import models
from spoolman.exceptions import ItemNotFoundError

UPLOAD_DIR = Path(os.getenv("SPOOLMAN_PRINT_REQUEST_UPLOAD_DIR", "data/print-request-files"))


async def create(
    db: AsyncSession,
    *,
    requester_name: Optional[str],
    delivery_preference: Optional[str],
    delivery_notes: Optional[str],
    title: str,
    description: str,
    makerworld_link: Optional[str],
    links: list[tuple[str, Optional[str]]],
    filament_ids: list[int],
    other_filament_requested: bool,
    other_filament_notes: Optional[str],
    color_assignment: Optional[str],
    due_date: Optional[datetime],
    comment: Optional[str],
) -> models.PrintRequest:
    """Create a new print request and related child records."""
    request = models.PrintRequest(
        registered=datetime.utcnow().replace(microsecond=0),
        requester_name=requester_name,
        delivery_preference=delivery_preference,
        delivery_notes=delivery_notes,
        title=title,
        description=description,
        makerworld_link=makerworld_link,
        links=[models.PrintRequestLink(url=url, label=label) for url, label in links],
        filaments=[models.PrintRequestFilament(filament_id=filament_id) for filament_id in filament_ids],
        other_filament_requested=other_filament_requested,
        other_filament_notes=other_filament_notes,
        color_assignment=color_assignment,
        due_date=due_date,
        comment=comment,
        status="requested",
        public_token=secrets.token_urlsafe(24),
    )
    db.add(request)
    await db.commit()
    await db.refresh(request)
    return await get_by_id(db, request.id)


async def get_by_id(db: AsyncSession, request_id: int) -> models.PrintRequest:
    """Return one print request by ID."""
    request = await db.get(
        models.PrintRequest,
        request_id,
        options=[
            joinedload(models.PrintRequest.links),
            joinedload(models.PrintRequest.files),
            joinedload(models.PrintRequest.filaments).joinedload(models.PrintRequestFilament.filament),
        ],
    )
    if request is None:
        raise ItemNotFoundError(f"No print request with ID {request_id} found.")
    return request


async def get_by_public_token(db: AsyncSession, token: str) -> models.PrintRequest:
    """Return one print request by public token."""
    result = await db.execute(
        select(models.PrintRequest)
        .where(models.PrintRequest.public_token == token)
        .options(
            joinedload(models.PrintRequest.links),
            joinedload(models.PrintRequest.files),
            joinedload(models.PrintRequest.filaments).joinedload(models.PrintRequestFilament.filament),
        ),
    )
    request = result.scalar_one_or_none()
    if request is None:
        raise ItemNotFoundError("Print request not found.")
    return request


async def find(db: AsyncSession) -> list[models.PrintRequest]:
    """List all print requests sorted by creation date."""
    result = await db.execute(
        select(models.PrintRequest)
        .options(joinedload(models.PrintRequest.filaments).joinedload(models.PrintRequestFilament.filament))
        .order_by(models.PrintRequest.registered.desc()),
    )
    return list(result.unique().scalars().all())


async def update_status(db: AsyncSession, request_id: int, status: str) -> models.PrintRequest:
    """Update the status of a print request."""
    request = await get_by_id(db, request_id)
    request.status = status
    await db.commit()
    return await get_by_id(db, request_id)


async def add_file(
    db: AsyncSession,
    request_id: int,
    *,
    original_filename: str,
    content_type: Optional[str],
    content: bytes,
) -> models.PrintRequestFile:
    """Store an uploaded file on disk and persist metadata in the DB."""
    request = await get_by_id(db, request_id)
    digest = hashlib.sha256(content).hexdigest()
    ext = ""
    if "." in original_filename:
        ext = "." + original_filename.rsplit(".", 1)[1]
    stored_filename = f"{request.id}-{secrets.token_hex(8)}{ext}"

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / stored_filename).write_bytes(content)

    item = models.PrintRequestFile(
        request=request,
        original_filename=original_filename,
        stored_filename=stored_filename,
        content_type=content_type,
        size_bytes=len(content),
        sha256=digest,
        uploaded_at=datetime.utcnow().replace(microsecond=0),
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
