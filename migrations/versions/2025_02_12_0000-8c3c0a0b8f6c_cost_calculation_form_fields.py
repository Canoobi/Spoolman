"""Add cost calculation form fields.

Revision ID: 8c3c0a0b8f6c
Revises: merge_printers_and_multicolor_heads
Create Date: 2025-02-12 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "8c3c0a0b8f6c"
down_revision = "merge_printers_and_multicolor_heads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Perform the upgrade."""
    op.add_column("cost_calculation", sa.Column("energy_cost_per_kwh", sa.Float(), nullable=True))
    op.add_column("cost_calculation", sa.Column("labor_cost_per_hour", sa.Float(), nullable=True))
    op.add_column("cost_calculation", sa.Column("item_names", sa.String(length=512), nullable=True))


def downgrade() -> None:
    """Perform the downgrade."""
    op.drop_column("cost_calculation", "item_names")
    op.drop_column("cost_calculation", "labor_cost_per_hour")
    op.drop_column("cost_calculation", "energy_cost_per_kwh")
