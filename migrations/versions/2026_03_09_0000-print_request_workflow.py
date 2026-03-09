"""Add print request workflow tables.

Revision ID: print_request_workflow
Revises: 8c3c0a0b8f6c
Create Date: 2026-03-09 00:00:00.000000
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "print_request_workflow"
down_revision = "8c3c0a0b8f6c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Perform the upgrade."""
    op.create_table(
        "print_request",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registered", sa.DateTime(), nullable=False),
        sa.Column("requester_name", sa.String(length=128), nullable=True),
        sa.Column("delivery_preference", sa.String(length=64), nullable=True),
        sa.Column("delivery_notes", sa.String(length=1024), nullable=True),
        sa.Column("title", sa.String(length=256), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("makerworld_link", sa.String(length=1024), nullable=True),
        sa.Column("color_assignment", sa.String(length=1024), nullable=True),
        sa.Column("due_date", sa.DateTime(), nullable=True),
        sa.Column("comment", sa.String(length=1024), nullable=True),
        sa.Column("other_filament_requested", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("other_filament_notes", sa.String(length=1024), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="requested"),
        sa.Column("public_token", sa.String(length=128), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_print_request_id"), "print_request", ["id"], unique=False)
    op.create_index(op.f("ix_print_request_public_token"), "print_request", ["public_token"], unique=True)

    op.create_table(
        "print_request_link",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(length=1024), nullable=False),
        sa.Column("label", sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(["request_id"], ["print_request.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_print_request_link_id"), "print_request_link", ["id"], unique=False)
    op.create_index(op.f("ix_print_request_link_request_id"), "print_request_link", ["request_id"], unique=False)

    op.create_table(
        "print_request_file",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("original_filename", sa.String(length=512), nullable=False),
        sa.Column("stored_filename", sa.String(length=512), nullable=False),
        sa.Column("content_type", sa.String(length=256), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["request_id"], ["print_request.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("stored_filename"),
    )
    op.create_index(op.f("ix_print_request_file_id"), "print_request_file", ["id"], unique=False)
    op.create_index(op.f("ix_print_request_file_request_id"), "print_request_file", ["request_id"], unique=False)

    op.create_table(
        "print_request_filament",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("request_id", sa.Integer(), nullable=False),
        sa.Column("filament_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["filament_id"], ["filament.id"]),
        sa.ForeignKeyConstraint(["request_id"], ["print_request.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_print_request_filament_filament_id"), "print_request_filament", ["filament_id"], unique=False)
    op.create_index(op.f("ix_print_request_filament_id"), "print_request_filament", ["id"], unique=False)
    op.create_index(op.f("ix_print_request_filament_request_id"), "print_request_filament", ["request_id"], unique=False)


def downgrade() -> None:
    """Perform the downgrade."""
    op.drop_index(op.f("ix_print_request_filament_request_id"), table_name="print_request_filament")
    op.drop_index(op.f("ix_print_request_filament_id"), table_name="print_request_filament")
    op.drop_index(op.f("ix_print_request_filament_filament_id"), table_name="print_request_filament")
    op.drop_table("print_request_filament")

    op.drop_index(op.f("ix_print_request_file_request_id"), table_name="print_request_file")
    op.drop_index(op.f("ix_print_request_file_id"), table_name="print_request_file")
    op.drop_table("print_request_file")

    op.drop_index(op.f("ix_print_request_link_request_id"), table_name="print_request_link")
    op.drop_index(op.f("ix_print_request_link_id"), table_name="print_request_link")
    op.drop_table("print_request_link")

    op.drop_index(op.f("ix_print_request_public_token"), table_name="print_request")
    op.drop_index(op.f("ix_print_request_id"), table_name="print_request")
    op.drop_table("print_request")
