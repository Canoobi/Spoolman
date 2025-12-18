"""Helper functions for interacting with printer database objects."""

import logging
from datetime import datetime
from typing import Optional

import sqlalchemy
from sqlalchemy.exc import NoResultFound
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from spoolman.api.v1.models import EventType, Printer, PrinterEvent
from spoolman.database import models
from spoolman.database.utils import SortOrder, add_where_clause_str_opt, parse_nested_field
from spoolman.exceptions import ItemNotFoundError
from spoolman.ws import websocket_manager

logger = logging.getLogger(__name__)


async def create(
    *,
    db: AsyncSession,
    name: str,
    power_watts: Optional[float] = None,
    depreciation_cost_per_hour: Optional[float] = None,
    comment: Optional[str] = None,
) -> models.Printer:
    """Add a new printer to the database."""
    printer = models.Printer(
        registered=datetime.utcnow().replace(microsecond=0),
        name=name,
        power_watts=power_watts,
        depreciation_cost_per_hour=depreciation_cost_per_hour,
        comment=comment,
    )
    db.add(printer)
    await db.commit()
    await db.refresh(printer)
    await printer_changed(printer, EventType.ADDED)
    return printer


async def get_by_id(db: AsyncSession, printer_id: int) -> models.Printer:
    """Get a printer object from the database by the unique ID."""
    printer = await db.get(
        models.Printer,
        printer_id,
        options=[joinedload("*")],
    )
    if printer is None:
        raise ItemNotFoundError(f"No printer with ID {printer_id} found.")
    return printer


async def find(
    *,
    db: AsyncSession,
    name: Optional[str] = None,
    sort_by: Optional[dict[str, SortOrder]] = None,
    limit: Optional[int] = None,
    offset: int = 0,
) -> tuple[list[models.Printer], int]:
    """Find a list of printer objects by search criteria."""
    stmt = sqlalchemy.select(models.Printer)
    stmt = add_where_clause_str_opt(stmt, models.Printer.name, name)

    total_count = None

    if limit is not None:
        total_count_stmt = stmt.with_only_columns(sqlalchemy.func.count(), maintain_column_froms=True)
        total_count = (await db.execute(total_count_stmt)).scalar()

        stmt = stmt.offset(offset).limit(limit)

    if sort_by is not None:
        for fieldstr, order in sort_by.items():
            sort_field = parse_nested_field(models.Printer, fieldstr)
            if order == SortOrder.ASC:
                stmt = stmt.order_by(sort_field.asc())
            elif order == SortOrder.DESC:
                stmt = stmt.order_by(sort_field.desc())

    result = await db.execute(stmt.options(joinedload(models.Printer.cost_calculations)))
    items = result.scalars().unique().all()
    if total_count is None:
        total_count = len(items)

    return items, total_count


async def update(
    *,
    db: AsyncSession,
    printer_id: int,
    name: Optional[str] = None,
    power_watts: Optional[float] = None,
    depreciation_cost_per_hour: Optional[float] = None,
    comment: Optional[str] = None,
) -> models.Printer:
    """Update a printer."""
    printer = await get_by_id(db, printer_id)
    printer.name = name if name is not None else printer.name
    printer.power_watts = power_watts if power_watts is not None else printer.power_watts
    printer.depreciation_cost_per_hour = (
        depreciation_cost_per_hour if depreciation_cost_per_hour is not None else printer.depreciation_cost_per_hour
    )
    printer.comment = comment if comment is not None else printer.comment
    await db.commit()
    await printer_changed(printer, EventType.UPDATED)
    return printer


async def delete(db: AsyncSession, printer_id: int) -> None:
    """Delete a printer."""
    try:
        printer = (
            await db.execute(sqlalchemy.select(models.Printer).filter_by(id=printer_id).options(joinedload("*")))
        ).scalar_one()
    except NoResultFound as e:
        raise ItemNotFoundError(f"No printer with ID {printer_id} found.") from e
    await db.delete(printer)
    await db.commit()
    await printer_changed(printer, EventType.DELETED)


async def printer_changed(printer: models.Printer, typ: EventType) -> None:
    """Notify websocket clients that a printer has changed."""
    try:
        await websocket_manager.send(
            ("printer", str(printer.id)),
            PrinterEvent(
                type=typ,
                resource="printer",
                date=datetime.utcnow(),
                payload=Printer.from_db(printer),
            ),
        )
    except Exception:
        logger.exception("Failed to send websocket message")
