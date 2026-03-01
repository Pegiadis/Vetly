"""Add slug to vets table

Revision ID: f1g2h3i4j5k6
Revises: dd05ee06ff07
Create Date: 2026-03-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1g2h3i4j5k6'
down_revision: Union[str, None] = 'dd05ee06ff07'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add slug column as nullable first
    op.add_column('vets', sa.Column('slug', sa.String(length=255), nullable=True))

    # Data migration: generate slugs for existing vets using SQL
    # Transliteration of common Greek characters is handled in Python;
    # for the SQL data migration we use a simplified ASCII-safe approach
    # (latin names will work directly; Greek names will get a UUID-based fallback).
    op.execute("""
        UPDATE vets
        SET slug = (
            SELECT CONCAT(
                LOWER(
                    REGEXP_REPLACE(
                        REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s-]', '', 'g'),
                        '[\\s-]+', '-', 'g'
                    )
                )
            )
            FROM (SELECT name FROM vets v2 WHERE v2.id = vets.id) sub
        )
        WHERE slug IS NULL
    """)

    # For any vets where slug ended up empty or NULL after the regex
    # (e.g. fully Greek names), assign a UUID-based fallback
    op.execute("""
        UPDATE vets
        SET slug = CONCAT('vet-', SUBSTRING(id::text, 1, 8))
        WHERE slug IS NULL OR slug = '' OR slug = '-'
    """)

    # Handle duplicate slugs by appending a numeric suffix
    op.execute("""
        WITH ranked AS (
            SELECT id, slug,
                   ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
            FROM vets
        )
        UPDATE vets
        SET slug = CONCAT(ranked.slug, '-', ranked.rn - 1)
        FROM ranked
        WHERE vets.id = ranked.id AND ranked.rn > 1
    """)

    # Now add unique constraint and index
    op.create_index(op.f('ix_vets_slug'), 'vets', ['slug'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_vets_slug'), table_name='vets')
    op.drop_column('vets', 'slug')
