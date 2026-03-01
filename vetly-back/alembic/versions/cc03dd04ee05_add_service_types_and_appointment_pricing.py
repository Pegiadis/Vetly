"""Add service_types table and pricing columns to appointments

Revision ID: cc03dd04ee05
Revises: aabb01cc02dd
Create Date: 2026-03-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cc03dd04ee05'
down_revision: Union[str, None] = 'aabb01cc02dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create service_types table
    op.create_table(
        'service_types',
        sa.Column('vet_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['vet_id'], ['vets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_service_types_id'), 'service_types', ['id'], unique=False)
    op.create_index(op.f('ix_service_types_vet_id'), 'service_types', ['vet_id'], unique=False)

    # Add pricing columns to appointments table
    op.add_column('appointments', sa.Column(
        'service_type_id',
        sa.UUID(),
        sa.ForeignKey('service_types.id', ondelete='SET NULL'),
        nullable=True,
    ))
    op.add_column('appointments', sa.Column(
        'price',
        sa.Numeric(precision=10, scale=2),
        nullable=True,
    ))
    op.create_index(
        op.f('ix_appointments_service_type_id'),
        'appointments',
        ['service_type_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_appointments_service_type_id'), table_name='appointments')
    op.drop_column('appointments', 'price')
    op.drop_column('appointments', 'service_type_id')
    op.drop_index(op.f('ix_service_types_vet_id'), table_name='service_types')
    op.drop_index(op.f('ix_service_types_id'), table_name='service_types')
    op.drop_table('service_types')
