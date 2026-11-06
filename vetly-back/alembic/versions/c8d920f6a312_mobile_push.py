"""Mobile push registration and deduplication."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg
revision = 'c8d920f6a312'
down_revision = 'a7f319c4d205'
branch_labels = depends_on = None

def common():
    return [sa.Column('id', pg.UUID(as_uuid=True), primary_key=True), sa.Column('created_at', sa.DateTime(), nullable=False), sa.Column('updated_at', sa.DateTime(), nullable=False)]

def upgrade():
    op.add_column('notifications', sa.Column('source_key', sa.String(200), nullable=True))
    op.create_unique_constraint('uq_notifications_source_key', 'notifications', ['source_key'])
    op.create_table('push_devices', *common(),
        sa.Column('owner_id', pg.UUID(as_uuid=True), sa.ForeignKey('pet_owners.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token', sa.String(255), nullable=False, unique=True),
        sa.Column('platform', sa.String(10), nullable=False), sa.Column('auth_version', sa.Integer(), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False), sa.Column('registered_at', sa.DateTime(), nullable=False), sa.Column('last_seen_at', sa.DateTime(), nullable=False))
    op.create_index('ix_push_devices_owner_id', 'push_devices', ['owner_id'])
    op.create_table('push_deliveries', *common(),
        sa.Column('device_id', pg.UUID(as_uuid=True), sa.ForeignKey('push_devices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('notification_id', pg.UUID(as_uuid=True), sa.ForeignKey('notifications.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(20), nullable=False), sa.Column('attempts', sa.Integer(), nullable=False),
        sa.Column('retry_at', sa.DateTime(), nullable=False), sa.Column('ticket_id', sa.String(255)), sa.Column('error', sa.String(100)),
        sa.UniqueConstraint('device_id', 'notification_id', name='uq_push_delivery'))

def downgrade():
    op.drop_table('push_deliveries')
    op.drop_table('push_devices')
    op.drop_constraint('uq_notifications_source_key', 'notifications', type_='unique')
    op.drop_column('notifications', 'source_key')
