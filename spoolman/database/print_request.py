import secrets
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from spoolman.api.v1 import models as api_models
from spoolman.database import models
from spoolman.exceptions import ItemNotFoundError


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _validate_filament_selection(
        filament_ids: list[int],
        other_filament_requested: bool,
        other_filament_description: Optional[str],
) -> None:
    if not filament_ids and not other_filament_requested:
        raise ValueError("At least one filament must be selected or other_filament_requested must be true.")

    if other_filament_requested and not other_filament_description:
        raise ValueError("other_filament_description is required when other_filament_requested is true.")


async def _get_filaments_by_ids(db: AsyncSession, filament_ids: list[int]) -> list[models.Filament]:
    if not filament_ids:
        return []

    result = await db.execute(
        select(models.Filament).where(models.Filament.id.in_(filament_ids))
    )
    filaments = list(result.unique().scalars().all())

    if len(filaments) != len(set(filament_ids)):
        raise ValueError("One or more filament IDs are invalid.")

    return filaments


async def _set_filaments(
        db: AsyncSession,
        request_obj: models.PrintRequest,
        filament_ids: list[int],
) -> None:
    await _get_filaments_by_ids(db, filament_ids)

    await db.execute(
        delete(models.PrintRequestFilament).where(models.PrintRequestFilament.request_id == request_obj.id)
    )

    now = utcnow()
    for filament_id in sorted(set(filament_ids)):
        db.add(
            models.PrintRequestFilament(
                request_id=request_obj.id,
                filament_id=filament_id,
                created_at=now,
            )
        )


async def create_print_request(
        db: AsyncSession,
        data: api_models.PublicPrintRequestCreate,
) -> models.PrintRequest:
    _validate_filament_selection(
        filament_ids=data.filament_ids,
        other_filament_requested=data.other_filament_requested,
        other_filament_description=data.other_filament_description,
    )
    await _get_filaments_by_ids(db, data.filament_ids)

    now = utcnow()
    request_obj = models.PrintRequest(
        public_id=secrets.token_urlsafe(24),
        created_at=now,
        updated_at=None,

        requester_name=data.requester_name,
        requester_contact=data.requester_contact,

        delivery_type=data.delivery_type,
        delivery_details=data.delivery_details,

        title=data.title,
        description=data.description,

        makerworld_url=data.makerworld_url,
        additional_links_text=data.additional_links_text,

        wanted_date=data.wanted_date,
        priority=data.priority,

        other_filament_requested=data.other_filament_requested,
        other_filament_description=data.other_filament_description,

        color_assignment=data.color_assignment,
        comment=data.comment,

        status="Angefragt",

        accepted_at=None,
        rejected_at=None,
        completed_at=None,

        rejection_reason=None,
        internal_notes=None,
    )

    db.add(request_obj)
    await db.flush()

    await _set_filaments(db, request_obj, data.filament_ids)

    await db.commit()
    await db.refresh(request_obj)

    return await get_print_request(db, request_obj.id)


async def get_print_request(db: AsyncSession, request_id: int) -> models.PrintRequest:
    result = await db.execute(
        select(models.PrintRequest)
        .where(models.PrintRequest.id == request_id)
        .options(
            selectinload(models.PrintRequest.filaments)
            .selectinload(models.PrintRequestFilament.filament)
            .selectinload(models.Filament.vendor)
        )
    )
    obj = result.scalar_one_or_none()
    if obj is None:
        raise ItemNotFoundError(f"Print request with ID {request_id} was not found.")
    return obj


async def get_print_request_by_public_id(db: AsyncSession, public_id: str) -> models.PrintRequest:
    result = await db.execute(
        select(models.PrintRequest)
        .where(models.PrintRequest.public_id == public_id)
        .options(
            selectinload(models.PrintRequest.filaments)
            .selectinload(models.PrintRequestFilament.filament)
            .selectinload(models.Filament.vendor)
        )
    )
    obj = result.scalar_one_or_none()
    if obj is None:
        raise ItemNotFoundError(f"Print request with public ID {public_id} was not found.")
    return obj


async def list_print_requests(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
) -> tuple[list[models.PrintRequest], int]:
    total_result = await db.execute(select(func.count(models.PrintRequest.id)))
    total = int(total_result.scalar_one())

    result = await db.execute(
        select(models.PrintRequest)
        .options(
            selectinload(models.PrintRequest.filaments)
            .selectinload(models.PrintRequestFilament.filament)
            .selectinload(models.Filament.vendor)
        )
        .order_by(models.PrintRequest.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(result.scalars().all())
    return items, total


async def update_print_request_public(
        db: AsyncSession,
        public_id: str,
        data: api_models.PublicPrintRequestUpdate,
) -> models.PrintRequest:
    obj = await get_print_request_by_public_id(db, public_id)

    if obj.status not in api_models.PRINT_REQUEST_PUBLIC_EDITABLE_STATUS_VALUES:
        raise ValueError("This print request can no longer be edited by the requester.")

    _validate_filament_selection(
        filament_ids=data.filament_ids,
        other_filament_requested=data.other_filament_requested,
        other_filament_description=data.other_filament_description,
    )
    await _get_filaments_by_ids(db, data.filament_ids)

    obj.updated_at = utcnow()

    obj.requester_name = data.requester_name
    obj.requester_contact = data.requester_contact

    obj.delivery_type = data.delivery_type
    obj.delivery_details = data.delivery_details

    obj.title = data.title
    obj.description = data.description

    obj.makerworld_url = data.makerworld_url
    obj.additional_links_text = data.additional_links_text

    obj.wanted_date = data.wanted_date
    obj.priority = data.priority

    obj.other_filament_requested = data.other_filament_requested
    obj.other_filament_description = data.other_filament_description

    obj.color_assignment = data.color_assignment
    obj.comment = data.comment

    await _set_filaments(db, obj, data.filament_ids)

    await db.commit()
    await db.refresh(obj)
    return await get_print_request(db, obj.id)


async def update_print_request_internal(
        db: AsyncSession,
        request_id: int,
        data: api_models.PrintRequestInternalPatch,
) -> models.PrintRequest:
    obj = await get_print_request(db, request_id)

    obj.updated_at = utcnow()

    if data.requester_name is not None:
        obj.requester_name = data.requester_name
    if data.requester_contact is not None:
        obj.requester_contact = data.requester_contact

    if data.delivery_type is not None:
        obj.delivery_type = data.delivery_type
    if data.delivery_details is not None:
        obj.delivery_details = data.delivery_details

    if data.title is not None:
        obj.title = data.title
    if data.description is not None:
        obj.description = data.description

    if data.makerworld_url is not None:
        obj.makerworld_url = data.makerworld_url
    if data.additional_links_text is not None:
        obj.additional_links_text = data.additional_links_text

    if data.wanted_date is not None:
        obj.wanted_date = data.wanted_date
    if data.priority is not None:
        obj.priority = data.priority

    if data.other_filament_requested is not None:
        obj.other_filament_requested = data.other_filament_requested
    if data.other_filament_description is not None:
        obj.other_filament_description = data.other_filament_description

    if data.color_assignment is not None:
        obj.color_assignment = data.color_assignment
    if data.comment is not None:
        obj.comment = data.comment

    if data.internal_notes is not None:
        obj.internal_notes = data.internal_notes

    if data.rejection_reason is not None:
        obj.rejection_reason = data.rejection_reason

    if data.filament_ids is not None:
        _validate_filament_selection(
            filament_ids=data.filament_ids,
            other_filament_requested=(
                data.other_filament_requested
                if data.other_filament_requested is not None
                else obj.other_filament_requested
            ),
            other_filament_description=(
                data.other_filament_description
                if data.other_filament_description is not None
                else obj.other_filament_description
            ),
        )
        await _set_filaments(db, obj, data.filament_ids)

    if data.status is not None:
        obj.status = data.status
        if data.status == "Abgeschlossen" and obj.completed_at is None:
            obj.completed_at = utcnow()

    await db.commit()
    await db.refresh(obj)
    return await get_print_request(db, obj.id)


async def accept_print_request(db: AsyncSession, request_id: int) -> models.PrintRequest:
    obj = await get_print_request(db, request_id)

    obj.updated_at = utcnow()
    obj.status = "Offen"
    if obj.accepted_at is None:
        obj.accepted_at = utcnow()

    await db.commit()
    await db.refresh(obj)
    return await get_print_request(db, obj.id)


async def reject_print_request(
        db: AsyncSession,
        request_id: int,
        rejection_reason: Optional[str] = None,
) -> models.PrintRequest:
    obj = await get_print_request(db, request_id)

    obj.updated_at = utcnow()
    obj.status = "Abgelehnt"
    if obj.rejected_at is None:
        obj.rejected_at = utcnow()
    if rejection_reason is not None:
        obj.rejection_reason = rejection_reason

    await db.commit()
    await db.refresh(obj)
    return await get_print_request(db, obj.id)
