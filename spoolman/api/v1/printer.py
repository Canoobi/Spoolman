"""Printer related endpoints."""

import asyncio
import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from spoolman.api.v1.models import Message, Printer, PrinterEvent
from spoolman.database import printer as printer_db
from spoolman.database.database import get_db_session
from spoolman.database.utils import SortOrder
from spoolman.exceptions import ItemNotFoundError
from spoolman.ws import websocket_manager

router = APIRouter(
    prefix="/printer",
    tags=["printer"],
)

# ruff: noqa: D103,B008

logger = logging.getLogger(__name__)


class PrinterParameters(BaseModel):
    name: str = Field(description="Printer name.", examples=["Bambu X1C"])
    power_watts: Optional[float] = Field(
        None,
        ge=0,
        description="Average power consumption of the printer in watts.",
        examples=[250],
    )
    depreciation_cost_per_hour: Optional[float] = Field(
        None,
        ge=0,
        description="Depreciation or maintenance cost per print hour.",
        examples=[0.5],
    )
    comment: Optional[str] = Field(
        None,
        max_length=1024,
        description="Free text comment about this printer.",
        examples=["0.6mm nozzle installed"],
    )


class PrinterUpdateParameters(PrinterParameters):
    name: Optional[str] = Field(None, description="Printer name.", examples=["Bambu X1C"])

    @field_validator("name")
    @classmethod
    def prevent_none(cls: type["PrinterUpdateParameters"], v: Optional[str]) -> Optional[str]:
        """Prevent name from being None."""
        if v is None:
            raise ValueError("Value must not be None.")
        return v


@router.get(
    "",
    name="Find printer",
    description=(
        "Get a list of printers that matches the search query. "
        "A websocket is served on the same path to listen for updates to any printer, or added or deleted printers. "
        "See the HTTP Response code 299 for the content of the websocket messages."
    ),
    response_model_exclude_none=True,
    responses={
        200: {"model": list[Printer]},
        299: {"model": PrinterEvent, "description": "Websocket message"},
    },
)
async def find(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    name: Annotated[
        Optional[str],
        Query(
            title="Printer Name",
            description=(
                "Partial case-insensitive search term for the printer name. Separate multiple terms with a comma. "
                "Surround a term with quotes to search for the exact term."
            ),
        ),
    ] = None,
    sort: Annotated[
        Optional[str],
        Query(
            title="Sort",
            description=(
                'Sort the results by the given field. Should be a comma-separate string with "field:direction" items.'
            ),
            example="name:asc,id:desc",
        ),
    ] = None,
    limit: Annotated[
        Optional[int],
        Query(title="Limit", description="Maximum number of items in the response."),
    ] = None,
    offset: Annotated[int, Query(title="Offset", description="Offset in the full result set if a limit is set.")] = 0,
) -> JSONResponse:
    sort_by: dict[str, SortOrder] = {}
    if sort is not None:
        for sort_item in sort.split(","):
            field, direction = sort_item.split(":")
            sort_by[field] = SortOrder[direction.upper()]

    db_items, total_count = await printer_db.find(
        db=db,
        name=name,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )
    return JSONResponse(
        content=jsonable_encoder(
            (Printer.from_db(db_item) for db_item in db_items),
            exclude_none=True,
        ),
        headers={"x-total-count": str(total_count)},
    )


@router.websocket(
    "",
    name="Listen to printer changes",
)
async def notify_any(
    websocket: WebSocket,
) -> None:
    await websocket.accept()
    websocket_manager.connect(("printer",), websocket)
    try:
        while True:
            await asyncio.sleep(0.5)
            if await websocket.receive_text():
                await websocket.send_json({"status": "healthy"})
    except WebSocketDisconnect:
        websocket_manager.disconnect(("printer",), websocket)


@router.get(
    "/{printer_id}",
    name="Get printer",
    description=(
        "Get a specific printer. A websocket is served on the same path to listen for changes to the printer. "
        "See the HTTP Response code 299 for the content of the websocket messages."
    ),
    response_model_exclude_none=True,
    responses={299: {"model": PrinterEvent, "description": "Websocket message"}},
)
async def get(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    printer_id: int,
) -> JSONResponse:
    try:
        db_item = await printer_db.get_by_id(db, printer_id)
    except ItemNotFoundError as e:
        return JSONResponse(status_code=404, content=Message(message=e.args[0]).dict())
    return JSONResponse(
        content=jsonable_encoder(
            Printer.from_db(db_item),
            exclude_none=True,
        ),
    )


@router.websocket(
    "/{printer_id}",
    name="Listen to printer changes",
)
async def notify(
    websocket: WebSocket,
    printer_id: str,
) -> None:
    await websocket.accept()
    websocket_manager.connect(("printer", str(printer_id)), websocket)
    try:
        while True:
            await asyncio.sleep(0.5)
            if await websocket.receive_text():
                await websocket.send_json({"status": "healthy"})
    except WebSocketDisconnect:
        websocket_manager.disconnect(("printer", str(printer_id)), websocket)


@router.post(
    "",
    name="Create printer",
    description="Create a new printer.",
    response_model_exclude_none=True,
    responses={201: {"model": Printer}, 400: {"model": Message}},
)
async def create(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    body: PrinterParameters,
) -> JSONResponse:
    printer = await printer_db.create(
        db=db,
        name=body.name,
        power_watts=body.power_watts,
        depreciation_cost_per_hour=body.depreciation_cost_per_hour,
        comment=body.comment,
    )
    return JSONResponse(
        status_code=201,
        content=jsonable_encoder(
            Printer.from_db(printer),
            exclude_none=True,
        ),
    )


@router.patch(
    "/{printer_id}",
    name="Update printer",
    description="Update a specific printer.",
    response_model_exclude_none=True,
    responses={404: {"model": Message}},
)
async def update(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    printer_id: int,
    body: PrinterUpdateParameters,
) -> JSONResponse:
    try:
        printer = await printer_db.update(
            db=db,
            printer_id=printer_id,
            name=body.name,
            power_watts=body.power_watts,
            depreciation_cost_per_hour=body.depreciation_cost_per_hour,
            comment=body.comment,
        )
    except ItemNotFoundError as e:
        return JSONResponse(status_code=404, content=Message(message=e.args[0]).dict())

    return JSONResponse(
        content=jsonable_encoder(
            Printer.from_db(printer),
            exclude_none=True,
        ),
    )


@router.delete(
    "/{printer_id}",
    name="Delete printer",
    description="Delete a specific printer.",
    responses={404: {"model": Message}},
)
async def delete(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    printer_id: int,
) -> JSONResponse:
    try:
        await printer_db.delete(db, printer_id)
    except ItemNotFoundError as e:
        return JSONResponse(status_code=404, content=Message(message=e.args[0]).dict())

    return JSONResponse(
        content=jsonable_encoder(Message(message="Printer deleted.")),
    )
