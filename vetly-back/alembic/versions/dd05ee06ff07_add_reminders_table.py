"""Add reminders table

Revision ID: dd05ee06ff07
Revises: cc03dd04ee05
Create Date: 2026-03-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'dd05ee06ff07'
down_revision: Union[str, None] = 'cc03dd04ee05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'reminders',
        sa.Column('pet_id', sa.UUID(), nullable=False),
        sa.Column('vet_id', sa.UUID(), nullable=False),
        sa.Column('pet_owner_id', sa.UUID(), nullable=False),
        sa.Column('type', sa.Enum('vaccination', 'checkup', 'medication', 'custom', name='remindertype'), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('reminder_date', sa.Date(), nullable=False),
        sa.Column('is_sent', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('is_dismissed', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pet_id'], ['pets.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['pet_owner_id'], ['pet_owners.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vet_id'], ['vets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_reminders_id'), 'reminders', ['id'], unique=False)
    op.create_index(op.f('ix_reminders_pet_id'), 'reminders', ['pet_id'], unique=False)
    op.create_index(op.f('ix_reminders_vet_id'), 'reminders', ['vet_id'], unique=False)
    op.create_index(op.f('ix_reminders_pet_owner_id'), 'reminders', ['pet_owner_id'], unique=False)
    op.create_index(op.f('ix_reminders_is_sent'), 'reminders', ['is_sent'], unique=False)
    op.create_index(op.f('ix_reminders_is_dismissed'), 'reminders', ['is_dismissed'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_reminders_is_dismissed'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_is_sent'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_pet_owner_id'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_vet_id'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_pet_id'), table_name='reminders')
    op.drop_index(op.f('ix_reminders_id'), table_name='reminders')
    op.drop_table('reminders')
    op.execute("DROP TYPE IF EXISTS remindertype")
