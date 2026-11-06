"""Owner account preferences and session revocation."""
from alembic import op
import sqlalchemy as sa
revision = 'a7f319c4d205'
down_revision = 'b4c5d6e7f8a9'
branch_labels = None
depends_on = None
def upgrade():
    op.add_column('pet_owners', sa.Column('auth_version', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('pet_owners', sa.Column('email_appointments', sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column('pet_owners', sa.Column('email_reminders', sa.Boolean(), nullable=False, server_default=sa.true()))
def downgrade():
    for col in ['email_reminders', 'email_appointments', 'auth_version']:
        op.drop_column('pet_owners', col)

