"""Add vet_time_off table for closures and time off."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '5c8f2b71d9e4'
down_revision = 'f2a3b4c5d6e7'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'vet_time_off',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('vet_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('vets.id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=True),
        sa.Column('end_time', sa.Time(), nullable=True),
        sa.Column('reason', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_vet_time_off_id', 'vet_time_off', ['id'])
    op.create_index('ix_vet_time_off_vet_id', 'vet_time_off', ['vet_id'])


def downgrade():
    op.drop_index('ix_vet_time_off_vet_id', table_name='vet_time_off')
    op.drop_index('ix_vet_time_off_id', table_name='vet_time_off')
    op.drop_table('vet_time_off')
