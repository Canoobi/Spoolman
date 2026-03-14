from fastapi import APIRouter, Depends, Query, Response
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from spoolman.api.v1 import models as api_models
from spoolman.database.database import get_db_session
from spoolman.database import print_request as print_request_db

router = APIRouter(prefix="/print-request", tags=["print-request"])


def _to_filament_info(filament_link) -> api_models.PrintRequestFilamentInfo:
    filament = filament_link.filament
    vendor_name = getattr(getattr(filament, "vendor", None), "name", None)
    material = getattr(filament, "material", None)
    if not isinstance(material, str): material = getattr(material, "name", None)
    display_parts = [part for part in [vendor_name, material, filament.name] if part]
    display_name = " – ".join(display_parts) if display_parts else str(filament.id)

    return api_models.PrintRequestFilamentInfo(
        id=filament.id,
        display_name=display_name,
    )


def _to_response(obj) -> api_models.PrintRequestResponse:
    return api_models.PrintRequestResponse(
        id=obj.id,
        public_id=obj.public_id,
        created_at=obj.created_at,
        updated_at=obj.updated_at,
        requester_name=obj.requester_name,
        requester_contact=obj.requester_contact,
        delivery_type=obj.delivery_type,
        delivery_details=obj.delivery_details,
        title=obj.title,
        description=obj.description,
        makerworld_url=obj.makerworld_url,
        additional_links_text=obj.additional_links_text,
        wanted_date=obj.wanted_date,
        priority=obj.priority,
        other_filament_requested=obj.other_filament_requested,
        other_filament_description=obj.other_filament_description,
        color_assignment=obj.color_assignment,
        comment=obj.comment,
        status=obj.status,
        accepted_at=obj.accepted_at,
        rejected_at=obj.rejected_at,
        completed_at=obj.completed_at,
        rejection_reason=obj.rejection_reason,
        internal_notes=obj.internal_notes,
        filaments=[_to_filament_info(item) for item in obj.filaments],
    )


@router.get("")
async def list_print_requests(
        response: Response,
        skip: int = Query(0, ge=0),
        limit: int = Query(100, ge=1, le=500),
        db: AsyncSession = Depends(get_db_session),
):
    items, total = await print_request_db.list_print_requests(db, skip=skip, limit=limit)
    response.headers["x-total-count"] = str(total)
    return jsonable_encoder([_to_response(item) for item in items])


@router.get("/{request_id}")
async def get_print_request(
        request_id: int,
        db: AsyncSession = Depends(get_db_session),
):
    obj = await print_request_db.get_print_request(db, request_id)
    return JSONResponse(content=jsonable_encoder(_to_response(obj)))


@router.patch("/{request_id}")
async def patch_print_request(
        request_id: int,
        body: api_models.PrintRequestInternalPatch,
        db: AsyncSession = Depends(get_db_session),
):
    obj = await print_request_db.update_print_request_internal(db, request_id, body)
    return JSONResponse(content=jsonable_encoder(_to_response(obj)))


@router.post("/{request_id}/accept")
async def accept_print_request(
        request_id: int,
        db: AsyncSession = Depends(get_db_session),
):
    obj = await print_request_db.accept_print_request(db, request_id)
    return JSONResponse(content=jsonable_encoder(_to_response(obj)))


@router.post("/{request_id}/reject")
async def reject_print_request(
        request_id: int,
        body: api_models.PrintRequestRejectRequest,
        db: AsyncSession = Depends(get_db_session),
):
    obj = await print_request_db.reject_print_request(db, request_id, body.rejection_reason)
    return JSONResponse(content=jsonable_encoder(_to_response(obj)))
