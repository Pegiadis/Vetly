"""Add auth_version to vets so sessions and reset links can be revoked."""
from alembic import op
import sqlalchemy as sa

revision = 'e1f2a3b4c5d6'
down_revision = 'd9e031a7b423'
branch_labels = depends_on = None


def upgrade():
    op.add_column('vets', sa.Column('auth_version', sa.Integer(), nullable=False, server_default='0'))


def downgrade():
    op.drop_column('vets', 'auth_version')
