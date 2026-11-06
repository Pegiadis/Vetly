"""Link notifications to their appointment."""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
revision = 'b4c5d6e7f8a9'
down_revision = 'a3b4c5d6e7f8'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('notifications', sa.Column('appointment_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_notifications_appointment_id', 'notifications', 'appointments', ['appointment_id'], ['id'], ondelete='SET NULL')

def downgrade():
    op.drop_constraint('fk_notifications_appointment_id', 'notifications', type_='foreignkey')
    op.drop_column('notifications', 'appointment_id')
