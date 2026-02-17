"""add soft delete to pets

Revision ID: e5f6g7h8i9j0
Revises: d4e5f6g7h8i9
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6g7h8i9j0'
down_revision: Union[str, None] = 'd4e5f6g7h8i9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('pets', sa.Column('deleted_at', sa.DateTime(), nullable=True))
    op.create_index('ix_pets_deleted_at', 'pets', ['deleted_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_pets_deleted_at', table_name='pets')
    op.drop_column('pets', 'deleted_at')
