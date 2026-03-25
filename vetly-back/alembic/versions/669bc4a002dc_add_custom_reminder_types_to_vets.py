"""Add custom_reminder_types to vets

Revision ID: 669bc4a002dc
Revises: aa11bb22cc33
Create Date: 2026-03-25 18:30:49.931204

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '669bc4a002dc'
down_revision: Union[str, None] = 'aa11bb22cc33'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('vets', sa.Column('custom_reminder_types', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False))


def downgrade() -> None:
    op.drop_column('vets', 'custom_reminder_types')
