"""Demo requests from clinics."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = 'b3d8f2a91c47'
down_revision = '9c4e1b7d2a60'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'demo_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('clinic_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='new', nullable=False),
        sa.Column('vet_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['vet_id'], ['vets.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_demo_requests_email'), 'demo_requests', ['email'], unique=False)
    op.create_index(op.f('ix_demo_requests_id'), 'demo_requests', ['id'], unique=False)
    op.create_index(op.f('ix_demo_requests_status'), 'demo_requests', ['status'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_demo_requests_status'), table_name='demo_requests')
    op.drop_index(op.f('ix_demo_requests_id'), table_name='demo_requests')
    op.drop_index(op.f('ix_demo_requests_email'), table_name='demo_requests')
    op.drop_table('demo_requests')
