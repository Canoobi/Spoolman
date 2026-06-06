"""link cost calculation to print request.

Revision ID: 9c6d7a8e4b11
Revises: 5b044fc2277d
Create Date: 2026-05-03 01:30:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision = "9c6d7a8e4b11"
down_revision = "5b044fc2277d"
branch_labels = None
depends_on = None


INDEX_NAME = "ix_cost_calculation_print_request_id"
FK_NAME = "fk_cost_calculation_print_request_id"
TABLE_NAME = "cost_calculation"
COLUMN_NAME = "print_request_id"


def _has_column(inspector, table_name: str, column_name: str) -> bool:
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(inspector, table_name: str, index_name: str) -> bool:
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _has_foreign_key(inspector, table_name: str, fk_name: str) -> bool:
    return any(fk.get("name") == fk_name for fk in inspector.get_foreign_keys(table_name))


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    dialect = bind.dialect.name

    if not _has_column(inspector, TABLE_NAME, COLUMN_NAME):
        op.add_column(TABLE_NAME, sa.Column(COLUMN_NAME, sa.Integer(), nullable=True))
        inspector = inspect(bind)

    if not _has_index(inspector, TABLE_NAME, INDEX_NAME):
        op.create_index(INDEX_NAME, TABLE_NAME, [COLUMN_NAME], unique=True)
        inspector = inspect(bind)

    if dialect != "sqlite" and not _has_foreign_key(inspector, TABLE_NAME, FK_NAME):
        op.create_foreign_key(
            FK_NAME,
            TABLE_NAME,
            "print_request",
            [COLUMN_NAME],
            ["id"],
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    dialect = bind.dialect.name

    if dialect != "sqlite" and _has_foreign_key(inspector, TABLE_NAME, FK_NAME):
        op.drop_constraint(FK_NAME, TABLE_NAME, type_="foreignkey")
        inspector = inspect(bind)

    if _has_index(inspector, TABLE_NAME, INDEX_NAME):
        op.drop_index(INDEX_NAME, table_name=TABLE_NAME)
        inspector = inspect(bind)

    if _has_column(inspector, TABLE_NAME, COLUMN_NAME):
        op.drop_column(TABLE_NAME, COLUMN_NAME)
