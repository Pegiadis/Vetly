"""Add new pet types and review unique constraint

Revision ID: 03d62f8d288c
Revises: a1e93efa02ad
Create Date: 2026-03-21 17:21:05.555937

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '03d62f8d288c'
down_revision: Union[str, None] = 'a1e93efa02ad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new pet types to the enum (both name and value forms for SQLAlchemy compatibility)
    for val in ['Bird', 'BIRD', 'Rabbit', 'RABBIT', 'Hamster', 'HAMSTER', 'Fish', 'FISH', 'Reptile', 'REPTILE']:
        op.execute(f"ALTER TYPE pettype ADD VALUE IF NOT EXISTS '{val}'")

    # Add unique constraint on reviews
    op.create_unique_constraint('uq_review_vet_owner', 'reviews', ['vet_id', 'pet_owner_id'])


def downgrade() -> None:
    op.drop_constraint('uq_review_vet_owner', 'reviews', type_='unique')
    # Note: PostgreSQL does not support removing enum values
