"""Record when and which terms version each account accepted at registration."""
from alembic import op
import sqlalchemy as sa

revision = 'f2a3b4c5d6e7'
down_revision = 'e1f2a3b4c5d6'
branch_labels = depends_on = None


def upgrade():
    for table in ('vets', 'pet_owners'):
        op.add_column(table, sa.Column('terms_accepted_at', sa.DateTime(), nullable=True))
        op.add_column(table, sa.Column('terms_version', sa.String(length=50), nullable=True))


def downgrade():
    for table in ('vets', 'pet_owners'):
        op.drop_column(table, 'terms_version')
        op.drop_column(table, 'terms_accepted_at')
