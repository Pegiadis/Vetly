"""Admin accounts and owner suspension."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '9c4e1b7d2a60'
down_revision = '7d1e5a90c3b2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'admins',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('auth_version', sa.Integer(), server_default='0', nullable=False),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_admins_email'), 'admins', ['email'], unique=True)
    op.create_index(op.f('ix_admins_id'), 'admins', ['id'], unique=False)
    op.add_column('pet_owners', sa.Column('suspended_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('pet_owners', 'suspended_at')
    op.drop_index(op.f('ix_admins_id'), table_name='admins')
    op.drop_index(op.f('ix_admins_email'), table_name='admins')
    op.drop_table('admins')
