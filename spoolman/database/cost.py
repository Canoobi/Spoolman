"""Helper functions for interacting with cost calculation database objects."""

import logging
from datetime import datetime
from typing import Optional

import sqlalchemy
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, joinedload, selectinload

from spoolman.api.v1.models import CostCalculation, CostEvent, EventType, Filament, Printer
from spoolman.database import models, printer as printer_db
from spoolman.database.utils import (
    SortOrder,
    add_where_clause_int,
    add_where_clause_int_opt,
    parse_nested_field,
)
from spoolman.exceptions import ItemNotFoundError
from spoolman.ws import websocket_manager

logger = logging.getLogger(__name__)


async def create(
    *,
    db: AsyncSession,
    printer_id: Optional[int] = None,
    filament_id: Optional[int] = None,
    print_time_hours: Optional[float] = None,
    labor_time_hours: Optional[float] = None,
    filament_weight_g: Optional[float] = None,
    material_cost: Optional[float] = None,
    energy_cost: Optional[float] = None,
    depreciation_cost: Optional[float] = None,
    labor_cost: Optional[float] = None,
    consumables_cost: Optional[float] = None,
    failure_rate: Optional[float] = None,
    markup_rate: Optional[float] = None,
    base_price: Optional[float] = None,
    uplifted_price: Optional[float] = None,
    final_price: Optional[float] = None,
    currency: Optional[str] = None,
    notes: Optional[str] = None,
) -> models.CostCalculation:
    """Add a new cost calculation entry to the database."""
    printer_obj = None
    filament_obj = None
    if printer_id is not None:
        printer_obj = await printer_db.get_by_id(db, printer_id)
    if filament_id is not None:
        filament_obj = await db.get(models.Filament, filament_id)
        if filament_obj is None:
            raise ItemNotFoundError(f"No filament with ID {filament_id} found.")

    calculation = models.CostCalculation(
        created=datetime.utcnow().replace(microsecond=0),
        printer=printer_obj,
        filament=filament_obj,
        print_time_hours=print_time_hours,
        labor_time_hours=labor_time_hours,
        filament_weight_g=filament_weight_g,
        material_cost=material_cost,
        energy_cost=energy_cost,
        depreciation_cost=depreciation_cost,
        labor_cost=labor_cost,
        consumables_cost=consumables_cost,
        failure_rate=failure_rate,
        markup_rate=markup_rate,
        base_price=base_price,
        uplifted_price=uplifted_price,
        final_price=final_price,
        currency=currency,
        notes=notes,
    )
    db.add(calculation)
    await db.commit()
    await db.refresh(calculation)
    await cost_changed(calculation, EventType.ADDED)
    return calculation


async def get_by_id(db: AsyncSession, calculation_id: int) -> models.CostCalculation:
    """Get a cost calculation object from the database by the unique ID."""
    calculation = await db.get(
        models.CostCalculation,
        calculation_id,
        options=[
            joinedload(models.CostCalculation.printer),
            joinedload(models.CostCalculation.filament).joinedload(models.Filament.vendor),
        ],
    )
    if calculation is None:
        raise ItemNotFoundError(f"No cost calculation with ID {calculation_id} found.")
    return calculation


async def find(
    *,
    db: AsyncSession,
    printer_id: Optional[int | list[int]] = None,
    filament_id: Optional[int | list[int]] = None,
    sort_by: Optional[dict[str, SortOrder]] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> tuple[list[models.CostCalculation], int]:
    """Find a list of cost calculation objects by search criteria."""
    stmt = (
        sqlalchemy.select(models.CostCalculation)
        .join(models.CostCalculation.printer, isouter=True)
        .join(models.CostCalculation.filament, isouter=True)
        .options(
            contains_eager(models.CostCalculation.printer),
            contains_eager(models.CostCalculation.filament).selectinload(models.Filament.vendor),        )
    )

    stmt = add_where_clause_int_opt(stmt, models.CostCalculation.printer_id, printer_id)
    stmt = add_where_clause_int_opt(stmt, models.CostCalculation.filament_id, filament_id)

    total_count = None
    if limit is not None:
        total_count_stmt = stmt.with_only_columns(sqlalchemy.func.count(), maintain_column_froms=True)
        total_count = (await db.execute(total_count_stmt)).scalar()
        stmt = stmt.offset(offset).limit(limit)

    if sort_by is not None:
        for fieldstr, order in sort_by.items():
            sort_field = parse_nested_field(models.CostCalculation, fieldstr)
            if order == SortOrder.ASC:
                stmt = stmt.order_by(sort_field.asc())
            elif order == SortOrder.DESC:
                stmt = stmt.order_by(sort_field.desc())

    result = await db.execute(stmt)
    items = result.scalars().unique().all()

    if total_count is None:
        total_count = len(items)

    return items, total_count


async def update(
    *,
    db: AsyncSession,
    calculation_id: int,
    printer_id: Optional[int] = None,
    filament_id: Optional[int] = None,
    print_time_hours: Optional[float] = None,
    labor_time_hours: Optional[float] = None,
    filament_weight_g: Optional[float] = None,
    material_cost: Optional[float] = None,
    energy_cost: Optional[float] = None,
    depreciation_cost: Optional[float] = None,
    labor_cost: Optional[float] = None,
    consumables_cost: Optional[float] = None,
    failure_rate: Optional[float] = None,
    markup_rate: Optional[float] = None,
    base_price: Optional[float] = None,
    uplifted_price: Optional[float] = None,
    final_price: Optional[float] = None,
    currency: Optional[str] = None,
    notes: Optional[str] = None,
) -> models.CostCalculation:
    """Update a cost calculation."""
    calculation = await get_by_id(db, calculation_id)
    if printer_id is not None:
        calculation.printer = await printer_db.get_by_id(db, printer_id)
    if filament_id is not None:
        filament_obj = await db.get(models.Filament, filament_id)
        if filament_obj is None:
            raise ItemNotFoundError(f"No filament with ID {filament_id} found.")
        calculation.filament = filament_obj

    calculation.print_time_hours = print_time_hours if print_time_hours is not None else calculation.print_time_hours
    calculation.labor_time_hours = labor_time_hours if labor_time_hours is not None else calculation.labor_time_hours
    calculation.filament_weight_g = (
        filament_weight_g if filament_weight_g is not None else calculation.filament_weight_g
    )
    calculation.material_cost = material_cost if material_cost is not None else calculation.material_cost
    calculation.energy_cost = energy_cost if energy_cost is not None else calculation.energy_cost
    calculation.depreciation_cost = (
        depreciation_cost if depreciation_cost is not None else calculation.depreciation_cost
    )
    calculation.labor_cost = labor_cost if labor_cost is not None else calculation.labor_cost
    calculation.consumables_cost = consumables_cost if consumables_cost is not None else calculation.consumables_cost
    calculation.failure_rate = failure_rate if failure_rate is not None else calculation.failure_rate
    calculation.markup_rate = markup_rate if markup_rate is not None else calculation.markup_rate
    calculation.base_price = base_price if base_price is not None else calculation.base_price
    calculation.uplifted_price = uplifted_price if uplifted_price is not None else calculation.uplifted_price
    calculation.final_price = final_price if final_price is not None else calculation.final_price
    calculation.currency = currency if currency is not None else calculation.currency
    calculation.notes = notes if notes is not None else calculation.notes
    await db.commit()
    await cost_changed(calculation, EventType.UPDATED)
    return calculation


async def delete(db: AsyncSession, calculation_id: int) -> None:
    """Delete a cost calculation."""
    try:
        calculation = (
            await db.execute(
                sqlalchemy.select(models.CostCalculation)
                .filter_by(id=calculation_id)
                .options(
                    joinedload(models.CostCalculation.printer),
                    joinedload(models.CostCalculation.filament).joinedload(models.Filament.vendor),
                )
            )
        ).scalar_one()
    except NoResultFound as e:
        raise ItemNotFoundError(f"No cost calculation with ID {calculation_id} found.") from e

    await db.delete(calculation)
    await db.commit()
    await cost_changed(calculation, EventType.DELETED)


async def cost_changed(cost_calc: models.CostCalculation, typ: EventType) -> None:
    """Notify websocket clients that a cost calculation has changed."""
    try:
        await websocket_manager.send(
            ("cost", str(cost_calc.id)),
            CostEvent(
                type=typ,
                resource="cost",
                date=datetime.utcnow(),
                payload=CostCalculation.from_db(
                    cost_calc,
                    printer=Printer.from_db(cost_calc.printer) if cost_calc.printer is not None else None,
                    filament=Filament.from_db(cost_calc.filament) if cost_calc.filament is not None else None,
                ),
            ),
        )
    except Exception:
        logger.exception("Failed to send websocket message")
