"""Print request endpoints."""

# ruff: noqa: D103

import os
from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Header, UploadFile
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from spoolman.api.v1.models import Message
from spoolman.database import filament as filament_db
from spoolman.database import models as db_models
from spoolman.database import print_request as print_request_db
from spoolman.database.database import get_db_session
from spoolman.exceptions import ItemNotFoundError

router = APIRouter(prefix="/print-request", tags=["print-request"])


class PrintRequestStatus(str, Enum):
    REQUESTED = "requested"
    IN_CLARIFICATION = "in_clarification"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    MANUFACTURED = "manufactured"
    COMPLETED = "completed"
    REJECTED = "rejected"


class PrintRequestLinkIn(BaseModel):
    url: str
    label: Optional[str] = None


class PrintRequestFileOut(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    content_type: Optional[str]
    size_bytes: int
    sha256: str
    uploaded_at: datetime


class PrintRequestOut(BaseModel):
    id: int
    registered: datetime
    requester_name: Optional[str]
    delivery_preference: Optional[str]
    delivery_notes: Optional[str]
    title: str
    description: str
    makerworld_link: Optional[str]
    links: list[PrintRequestLinkIn]
    filament_ids: list[int]
    filament_labels: list[str]
    other_filament_requested: bool
    other_filament_notes: Optional[str]
    color_assignment: Optional[str]
    due_date: Optional[datetime]
    comment: Optional[str]
    status: PrintRequestStatus
    public_token: str
    files: list[PrintRequestFileOut]


class PrintRequestCreateIn(BaseModel):
    requester_name: Optional[str] = None
    delivery_preference: Optional[str] = None
    delivery_notes: Optional[str] = None
    title: str
    description: str
    makerworld_link: Optional[str] = None
    links: list[PrintRequestLinkIn] = Field(default_factory=list)
    filament_ids: list[int] = Field(default_factory=list)
    other_filament_requested: bool = False
    other_filament_notes: Optional[str] = None
    color_assignment: Optional[str] = None
    due_date: Optional[datetime] = None
    comment: Optional[str] = None


class PrintRequestStatusUpdateIn(BaseModel):
    status: PrintRequestStatus


def _public_password_ok(password: Optional[str]) -> bool:
    configured = os.getenv("SPOOLMAN_PRINT_REQUEST_PUBLIC_PASSWORD", "")
    if not configured:
        return True
    return password == configured


def _to_out(item: db_models.PrintRequest) -> PrintRequestOut:
    labels: list[str] = []
    filament_ids: list[int] = []
    for requested_filament in item.filaments:
        filament_ids.append(requested_filament.filament_id)
        if requested_filament.filament:
            vendor = requested_filament.filament.vendor.name if requested_filament.filament.vendor else ""
            material = requested_filament.filament.material or ""
            name = requested_filament.filament.name or ""
            labels.append(f"{vendor} - {material} - {name}".strip(" -"))

    return PrintRequestOut(
        id=item.id,
        registered=item.registered,
        requester_name=item.requester_name,
        delivery_preference=item.delivery_preference,
        delivery_notes=item.delivery_notes,
        title=item.title,
        description=item.description,
        makerworld_link=item.makerworld_link,
        links=[PrintRequestLinkIn(url=link.url, label=link.label) for link in item.links],
        filament_ids=filament_ids,
        filament_labels=labels,
        other_filament_requested=item.other_filament_requested,
        other_filament_notes=item.other_filament_notes,
        color_assignment=item.color_assignment,
        due_date=item.due_date,
        comment=item.comment,
        status=PrintRequestStatus(item.status),
        public_token=item.public_token,
        files=[
            PrintRequestFileOut(
                id=file_item.id,
                original_filename=file_item.original_filename,
                stored_filename=file_item.stored_filename,
                content_type=file_item.content_type,
                size_bytes=file_item.size_bytes,
                sha256=file_item.sha256,
                uploaded_at=file_item.uploaded_at,
            )
            for file_item in item.files
        ],
    )


@router.get("")
async def list_requests(db: Annotated[AsyncSession, Depends(get_db_session)]) -> JSONResponse:
    items = await print_request_db.find(db)
    return JSONResponse(content=jsonable_encoder([_to_out(item) for item in items]))


@router.get("/{request_id}")
async def get_request(db: Annotated[AsyncSession, Depends(get_db_session)], request_id: int) -> JSONResponse:
    try:
        item = await print_request_db.get_by_id(db, request_id)
    except ItemNotFoundError as exc:
        return JSONResponse(status_code=404, content=Message(message=exc.args[0]).model_dump())
    return JSONResponse(content=jsonable_encoder(_to_out(item)))


@router.patch("/{request_id}/status")
async def patch_status(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request_id: int,
    body: PrintRequestStatusUpdateIn,
) -> JSONResponse:
    try:
        item = await print_request_db.update_status(db, request_id, body.status.value)
    except ItemNotFoundError as exc:
        return JSONResponse(status_code=404, content=Message(message=exc.args[0]).model_dump())
    return JSONResponse(content=jsonable_encoder(_to_out(item)))


@router.get("/public/form-data")
async def public_form_data(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    x_request_password: Annotated[Optional[str], Header()] = None,
) -> JSONResponse:
    if not _public_password_ok(x_request_password):
        return JSONResponse(status_code=401, content=Message(message="Invalid password.").model_dump())

    filaments, _ = await filament_db.find(db=db)
    data = [
        {
            "id": filament.id,
            "label": f"{filament.vendor.name if filament.vendor else ''} - {filament.material or ''} - "
            f"{filament.name or ''}".strip(" -"),
        }
        for filament in filaments
    ]
    return JSONResponse(content={"filaments": data})


@router.post("/public")
async def public_create(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    body: PrintRequestCreateIn,
    x_request_password: Annotated[Optional[str], Header()] = None,
) -> JSONResponse:
    if not _public_password_ok(x_request_password):
        return JSONResponse(status_code=401, content=Message(message="Invalid password.").model_dump())

    item = await print_request_db.create(
        db,
        requester_name=body.requester_name,
        delivery_preference=body.delivery_preference,
        delivery_notes=body.delivery_notes,
        title=body.title,
        description=body.description,
        makerworld_link=body.makerworld_link,
        links=[(link.url, link.label) for link in body.links],
        filament_ids=body.filament_ids,
        other_filament_requested=body.other_filament_requested,
        other_filament_notes=body.other_filament_notes,
        color_assignment=body.color_assignment,
        due_date=body.due_date,
        comment=body.comment,
    )
    return JSONResponse(status_code=201, content=jsonable_encoder(_to_out(item)))


@router.post("/public/{request_id}/files")
async def public_upload_files(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    request_id: int,
    files: Annotated[list[UploadFile], File(...)],
    x_request_password: Annotated[Optional[str], Header()] = None,
) -> JSONResponse:
    if not _public_password_ok(x_request_password):
        return JSONResponse(status_code=401, content=Message(message="Invalid password.").model_dump())

    uploaded = []
    for upload_file in files:
        uploaded_item = await print_request_db.add_file(
            db,
            request_id,
            original_filename=upload_file.filename,
            content_type=upload_file.content_type,
            content=await upload_file.read(),
        )
        uploaded.append(
            PrintRequestFileOut(
                id=uploaded_item.id,
                original_filename=uploaded_item.original_filename,
                stored_filename=uploaded_item.stored_filename,
                content_type=uploaded_item.content_type,
                size_bytes=uploaded_item.size_bytes,
                sha256=uploaded_item.sha256,
                uploaded_at=uploaded_item.uploaded_at,
            ),
        )

    return JSONResponse(content=jsonable_encoder(uploaded))


@router.get("/public/{token}")
async def public_get(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    token: str,
    x_request_password: Annotated[Optional[str], Header()] = None,
) -> JSONResponse:
    if not _public_password_ok(x_request_password):
        return JSONResponse(status_code=401, content=Message(message="Invalid password.").model_dump())
    try:
        item = await print_request_db.get_by_public_token(db, token)
    except ItemNotFoundError as exc:
        return JSONResponse(status_code=404, content=Message(message=exc.args[0]).model_dump())
    return JSONResponse(content=jsonable_encoder(_to_out(item)))
