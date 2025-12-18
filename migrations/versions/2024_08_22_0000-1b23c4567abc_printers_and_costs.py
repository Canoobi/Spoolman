"""printers and cost calculations.

Revision ID: 1b23c4567abc
Revises: 304a32906234
Create Date: 2024-08-22 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "1b23c4567abc"
down_revision = "304a32906234"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Perform the upgrade."""
    op.create_table(
        "printer",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registered", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("power_watts", sa.Float(), nullable=True),
        sa.Column("depreciation_cost_per_hour", sa.Float(), nullable=True),
        sa.Column("comment", sa.String(length=1024), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_printer_id"), "printer", ["id"], unique=False)

    op.create_table(
        "cost_calculation",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("created", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("printer_id", sa.Integer(), nullable=True),
        sa.Column("filament_id", sa.Integer(), nullable=True),
        sa.Column("print_time_hours", sa.Float(), nullable=True),
        sa.Column("labor_time_hours", sa.Float(), nullable=True),
        sa.Column("filament_weight_g", sa.Float(), nullable=True),
        sa.Column("material_cost", sa.Float(), nullable=True),
        sa.Column("energy_cost", sa.Float(), nullable=True),
        sa.Column("depreciation_cost", sa.Float(), nullable=True),
        sa.Column("labor_cost", sa.Float(), nullable=True),
        sa.Column("consumables_cost", sa.Float(), nullable=True),
        sa.Column("failure_rate", sa.Float(), nullable=True),
        sa.Column("markup_rate", sa.Float(), nullable=True),
        sa.Column("base_price", sa.Float(), nullable=True),
        sa.Column("uplifted_price", sa.Float(), nullable=True),
        sa.Column("final_price", sa.Float(), nullable=True),
        sa.Column("currency", sa.String(length=8), nullable=True),
        sa.Column("notes", sa.String(length=1024), nullable=True),
        sa.ForeignKeyConstraint(
            ["filament_id"],
            ["filament.id"],
        ),
        sa.ForeignKeyConstraint(
            ["printer_id"],
            ["printer.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_cost_calculation_id"), "cost_calculation", ["id"], unique=False)


def downgrade() -> None:
    """Perform the downgrade."""
    op.drop_index(op.f("ix_cost_calculation_id"), table_name="cost_calculation")
    op.drop_table("cost_calculation")
    op.drop_index(op.f("ix_printer_id"), table_name="printer")
    op.drop_table("printer")
