"""add group_id to appointments

Revision ID: d42bf6ee1848
Revises: f1g2h3i4j5k6
Create Date: 2026-03-08 18:43:36.829915

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd42bf6ee1848'
down_revision: Union[str, None] = 'f1g2h3i4j5k6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('appointments', sa.Column('group_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_appointments_group_id'), 'appointments', ['group_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_appointments_group_id'), table_name='appointments')
    op.drop_column('appointments', 'group_id')
