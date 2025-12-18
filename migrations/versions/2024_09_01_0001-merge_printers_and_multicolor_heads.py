"""Merge branch heads 415a8f855e14 and 1b23c4567abc.

Revision ID: merge_printers_and_multicolor_heads
Revises: 415a8f855e14, 1b23c4567abc
Create Date: 2024-09-01 00:01:00.000000
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "merge_printers_and_multicolor_heads"
down_revision = ("415a8f855e14", "1b23c4567abc")
branch_labels = None
depends_on = None


def upgrade() -> None:
    """No schema changes; merges multiple heads."""
    pass


def downgrade() -> None:
    """Downgrade is a no-op for merge migrations."""
    pass
