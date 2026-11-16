"""Vet email preferences and account deactivation marker."""
from alembic import op
import sqlalchemy as sa

revision = '7d1e5a90c3b2'
down_revision = '5c8f2b71d9e4'
branch_labels = None
depends_on = None

PREFS = ('email_new_bookings', 'email_cancellations', 'email_reviews')


def upgrade():
    for name in PREFS:
        op.add_column('vets', sa.Column(name, sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('vets', sa.Column('deactivated_at', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('vets', 'deactivated_at')
    for name in reversed(PREFS):
        op.drop_column('vets', name)
