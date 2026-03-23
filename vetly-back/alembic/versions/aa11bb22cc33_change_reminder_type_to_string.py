"""Change reminder type column from enum to string

Revision ID: aa11bb22cc33
Revises: 03d62f8d288c
Create Date: 2026-03-23 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aa11bb22cc33'
down_revision: Union[str, None] = '03d62f8d288c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Convert enum column to varchar, preserving existing values
    op.alter_column(
        'reminders',
        'type',
        existing_type=sa.Enum('vaccination', 'checkup', 'medication', 'custom', name='remindertype'),
        type_=sa.String(100),
        existing_nullable=False,
        postgresql_using='type::text',
    )
    # Drop the old enum type
    op.execute("DROP TYPE IF EXISTS remindertype")


def downgrade() -> None:
    # Recreate the enum type
    remindertype = sa.Enum('vaccination', 'checkup', 'medication', 'custom', name='remindertype')
    remindertype.create(op.get_bind(), checkfirst=True)
    # Convert back - any custom types will be mapped to 'custom'
    op.execute("""
        UPDATE reminders
        SET type = 'custom'
        WHERE type NOT IN ('vaccination', 'checkup', 'medication', 'custom')
    """)
    op.alter_column(
        'reminders',
        'type',
        existing_type=sa.String(100),
        type_=remindertype,
        existing_nullable=False,
        postgresql_using='type::remindertype',
    )
