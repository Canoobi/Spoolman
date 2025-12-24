"""Cost calculation related endpoints."""

import asyncio
import logging
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from spoolman.api.v1.models import CostCalculation, CostEvent, Message
from spoolman.database import cost as cost_db
from spoolman.database.database import get_db_session
from spoolman.database.utils import SortOrder
from spoolman.exceptions import ItemNotFoundError
from spoolman.ws import websocket_manager

router = APIRouter(
    prefix="/cost",
    tags=["cost"],
)

# ruff: noqa: D103,B008

logger = logging.getLogger(__name__)


class CostCalculationParameters(BaseModel):
    printer_id: Optional[int] = Field(None, description="ID of the printer used for this calculation.")
    filament_id: Optional[int] = Field(None, description="ID of the filament used for this calculation.")
    print_time_hours: Optional[float] = Field(None, ge=0, description="Total print time in hours.")
    labor_time_hours: Optional[float] = Field(None, ge=0, description="Total labor time in hours.")
    filament_weight_g: Optional[float] = Field(None, ge=0, description="Filament weight used in grams.")
    material_cost: Optional[float] = Field(None, ge=0, description="Cost of material.")
    energy_cost: Optional[float] = Field(None, ge=0, description="Cost of electricity.")
    energy_cost_per_kwh: Optional[float] = Field(None, ge=0, description="Energy cost per kWh.")
    depreciation_cost: Optional[float] = Field(None, ge=0, description="Printer depreciation cost.")
    labor_cost: Optional[float] = Field(None, ge=0, description="Labor cost.")
    labor_cost_per_hour: Optional[float] = Field(None, ge=0, description="Labor cost per hour.")
    consumables_cost: Optional[float] = Field(None, ge=0, description="Consumables cost.")
    failure_rate: Optional[float] = Field(None, ge=0, description="Failure rate applied as a factor.")
    markup_rate: Optional[float] = Field(None, ge=0, description="Markup applied as a factor.")
    base_price: Optional[float] = Field(None, ge=0, description="Price before uplifts or markup.")
    uplifted_price: Optional[float] = Field(None, ge=0, description="Price after failure uplift and markup.")
    final_price: Optional[float] = Field(None, ge=0, description="Final quoted price (overrides computed).")
    currency: Optional[str] = Field(None, max_length=8, description="Currency used for the calculation.")
    item_names: Optional[str] = Field(None, max_length=512, description="Item names for the calculation.")
    notes: Optional[str] = Field(None, max_length=1024, description="Notes attached to the calculation.")


class CostCalculationUpdateParameters(CostCalculationParameters):
    """Update body for cost calculations."""


def _parse_int_csv(value: Optional[str]) -> Optional[list[int]]:
    if value is None:
        return None
    return [int(v) for v in value.split(",")]


@router.get(
    "",
    name="Find cost calculations",
    description=(
        "Get a list of cost calculations. "
        "A websocket is served on the same path to listen for updates to any cost entry, or added or deleted entries. "
        "See the HTTP Response code 299 for the content of the websocket messages."
    ),
    response_model_exclude_none=True,
    responses={
        200: {"model": list[CostCalculation]},
        299: {"model": CostEvent, "description": "Websocket message"},
    },
)
async def find(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    printer_id: Annotated[
        Optional[str],
        Query(
            title="Printer ID",
            description="Match an exact printer ID. Separate multiple IDs with a comma. Set it to -1 to match empty.",
            examples=["1", "1,2"],
            pattern=r"^-?\d+(,-?\d+)*$",
        ),
    ] = None,
    filament_id: Annotated[
        Optional[str],
        Query(
            title="Filament ID",
            description="Match an exact filament ID. Separate multiple IDs with a comma. Set it to -1 to match empty.",
            examples=["1", "1,2"],
            pattern=r"^-?\d+(,-?\d+)*$",
        ),
    ] = None,
    sort: Annotated[
        Optional[str],
        Query(
            title="Sort",
            description=(
                'Sort the results by the given field. Should be a comma-separate string with "field:direction" items.'
            ),
            example="created:desc,id:desc",
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

    printer_ids = _parse_int_csv(printer_id)
    filament_ids = _parse_int_csv(filament_id)

    db_items, total_count = await cost_db.find(
        db=db,
        printer_id=printer_ids,
        filament_id=filament_ids,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )
    return JSONResponse(
        content=jsonable_encoder(
            (
                CostCalculation.from_db(
                    db_item,
                )
                for db_item in db_items
            ),
            exclude_none=True,
        ),
        headers={"x-total-count": str(total_count)},
    )


@router.websocket(
    "",
    name="Listen to cost changes",
)
async def notify_any(
    websocket: WebSocket,
) -> None:
    await websocket.accept()
    websocket_manager.connect(("cost",), websocket)
    try:
        while True:
            await asyncio.sleep(0.5)
            if await websocket.receive_text():
                await websocket.send_json({"status": "healthy"})
    except WebSocketDisconnect:
        websocket_manager.disconnect(("cost",), websocket)


@router.get(
    "/{calculation_id}",
    name="Get cost calculation",
    description=(
        "Get a specific cost calculation. A websocket is served on the same path to listen for changes to the entry. "
        "See the HTTP Response code 299 for the content of the websocket messages."
    ),
    response_model_exclude_none=True,
    responses={299: {"model": CostEvent, "description": "Websocket message"}},
)
async def get(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    calculation_id: int,
) -> JSONResponse:
    try:
        db_item = await cost_db.get_by_id(db, calculation_id)
    except ItemNotFoundError as e:
        return JSONResponse(status_code=404, content=Message(message=e.args[0]).dict())
    return JSONResponse(
        content=jsonable_encoder(
            CostCalculation.from_db(db_item),
            exclude_none=True,
        ),
    )


@router.websocket(
    "/{calculation_id}",
    name="Listen to cost calculation changes",
)
async def notify(
    websocket: WebSocket,
    calculation_id: str,
) -> None:
    await websocket.accept()
    websocket_manager.connect(("cost", str(calculation_id)), websocket)
    try:
        while True:
            await asyncio.sleep(0.5)
            if await websocket.receive_text():
                await websocket.send_json({"status": "healthy"})
    except WebSocketDisconnect:
        websocket_manager.disconnect(("cost", str(calculation_id)), websocket)


@router.post(
    "",
    name="Create cost calculation",
    description="Create a new cost calculation entry.",
    response_model_exclude_none=True,
    responses={201: {"model": CostCalculation}, 400: {"model": Message}},
)
async def create(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    body: CostCalculationParameters,
) -> JSONResponse:
    try:
        calculation = await cost_db.create(
            db=db,
            printer_id=body.printer_id,
            filament_id=body.filament_id,
            print_time_hours=body.print_time_hours,
            labor_time_hours=body.labor_time_hours,
            filament_weight_g=body.filament_weight_g,
            material_cost=body.material_cost,
            energy_cost=body.energy_cost,
            energy_cost_per_kwh=body.energy_cost_per_kwh,
            depreciation_cost=body.depreciation_cost,
            labor_cost=body.labor_cost,
            labor_cost_per_hour=body.labor_cost_per_hour,
            consumables_cost=body.consumables_cost,
            failure_rate=body.failure_rate,
            markup_rate=body.markup_rate,
            base_price=body.base_price,
            uplifted_price=body.uplifted_price,
            final_price=body.final_price,
            currency=body.currency,
            item_names=body.item_names,
            notes=body.notes,
        )
    except ItemNotFoundError as e:
        return JSONResponse(status_code=404, content=Message(message=e.args[0]).dict())

    return JSONResponse(
        status_code=201,
        content=jsonable_encoder(
            CostCalculation.from_db(calculation),
            exclude_none=True,
        ),
    )


@router.patch(
    "/{calculation_id}",
    name="Update cost calculation",
    description="Update a specific cost calculation.",
    response_model_exclude_none=True,
    responses={404: {"model": Message}},
)
async def update(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    calculation_id: int,
    body: CostCalculationUpdateParameters,
) -> JSONResponse:
    try:
        calculation = await cost_db.update(
            db=db,
            calculation_id=calculation_id,
            printer_id=body.printer_id,
            filament_id=body.filament_id,
            print_time_hours=body.print_time_hours,
            labor_time_hours=body.labor_time_hours,
            filament_weight_g=body.filament_weight_g,
            material_cost=body.material_cost,
            energy_cost=body.energy_cost,
            energy_cost_per_kwh=body.energy_cost_per_kwh,
            depreciation_cost=body.depreciation_cost,
            labor_cost=body.labor_cost,
            labor_cost_per_hour=body.labor_cost_per_hour,
            consumables_cost=body.consumables_cost,
            failure_rate=body.failure_rate,
            markup_rate=body.markup_rate,
            base_price=body.base_price,
            uplifted_price=body.uplifted_price,
            final_price=body.final_price,
            currency=body.currency,
            item_names=body.item_names,
            notes=body.notes,
        )
    except ItemNotFoundError as e:
        return JSONResponse(status_code=404, content=Message(message=e.args[0]).dict())

    return JSONResponse(
        content=jsonable_encoder(
            CostCalculation.from_db(calculation),
            exclude_none=True,
        ),
    )


@router.delete(
    "/{calculation_id}",
    name="Delete cost calculation",
    description="Delete a specific cost calculation.",
    responses={404: {"model": Message}},
)
async def delete(
    db: Annotated[AsyncSession, Depends(get_db_session)],
    calculation_id: int,
) -> JSONResponse:
    try:
        await cost_db.delete(db, calculation_id)
    except ItemNotFoundError as e:
        return JSONResponse(status_code=404, content=Message(message=e.args[0]).dict())

    return JSONResponse(
        content=jsonable_encoder(Message(message="Cost calculation deleted.")),
    )
