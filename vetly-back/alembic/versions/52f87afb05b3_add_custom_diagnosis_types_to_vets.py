"""Add custom_diagnosis_types to vets

Revision ID: 52f87afb05b3
Revises: 669bc4a002dc
Create Date: 2026-03-25 18:44:49.781311

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '52f87afb05b3'
down_revision: Union[str, None] = '669bc4a002dc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('vets', sa.Column('custom_diagnosis_types', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False))


def downgrade() -> None:
    op.drop_column('vets', 'custom_diagnosis_types')
