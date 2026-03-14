"""print request.

Revision ID: 5b044fc2277d
Revises: 8c3c0a0b8f6c
Create Date: 2026-03-13 22:01:11.578977
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '5b044fc2277d'
down_revision = '8c3c0a0b8f6c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "print_request",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("public_id", sa.String(length=64), nullable=False),

        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=True),

        sa.Column("requester_name", sa.String(length=128), nullable=False),
        sa.Column("requester_contact", sa.String(length=256), nullable=True),

        sa.Column("delivery_type", sa.String(length=32), nullable=True),
        sa.Column("delivery_details", sa.String(length=1024), nullable=True),

        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),

        sa.Column("makerworld_url", sa.String(length=2048), nullable=True),
        sa.Column("additional_links_text", sa.Text(), nullable=True),

        sa.Column("wanted_date", sa.DateTime(), nullable=True),
        sa.Column("priority", sa.String(length=16), nullable=True),

        sa.Column("other_filament_requested", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("other_filament_description", sa.String(length=1024), nullable=True),

        sa.Column("color_assignment", sa.String(length=2048), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),

        sa.Column("status", sa.String(length=32), nullable=False),

        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.Column("rejected_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),

        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("internal_notes", sa.Text(), nullable=True),

        sa.UniqueConstraint("public_id", name="uq_print_request_public_id"),
    )
    op.create_index("ix_print_request_public_id", "print_request", ["public_id"], unique=True)

    op.create_table(
        "print_request_filament",
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("filament_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),

        sa.ForeignKeyConstraint(["request_id"], ["print_request.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["filament_id"], ["filament.id"], ondelete="CASCADE"),

        sa.PrimaryKeyConstraint("request_id", "filament_id"),
    )
    op.create_index(
        "ix_print_request_filament_request_id",
        "print_request_filament",
        ["request_id"],
        unique=False,
    )
    op.create_index(
        "ix_print_request_filament_filament_id",
        "print_request_filament",
        ["filament_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_print_request_filament_filament_id", table_name="print_request_filament")
    op.drop_index("ix_print_request_filament_request_id", table_name="print_request_filament")
    op.drop_table("print_request_filament")

    op.drop_index("ix_print_request_public_id", table_name="print_request")
    op.drop_table("print_request")
