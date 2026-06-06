from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "b7d2c1f4aa21"
down_revision = "9c6d7a8e4b11"
branch_labels = None
depends_on = None

TABLE_NAME = "cost_calculation"
COLUMN_NAME = "paid"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns(TABLE_NAME)}

    if COLUMN_NAME not in existing_columns:
        op.add_column(
            TABLE_NAME,
            sa.Column(COLUMN_NAME, sa.Boolean(), nullable=False, server_default=sa.false()),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns(TABLE_NAME)}

    if COLUMN_NAME in existing_columns:
        op.drop_column(TABLE_NAME, COLUMN_NAME)
