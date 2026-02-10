"""Rename user to pet_owner

Revision ID: a1b2c3d4e5f6
Revises: 776d28b62e9b
Create Date: 2026-02-09 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '776d28b62e9b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop foreign key constraints first
    op.drop_constraint('pets_user_id_fkey', 'pets', type_='foreignkey')
    op.drop_constraint('appointments_user_id_fkey', 'appointments', type_='foreignkey')
    op.drop_constraint('reviews_user_id_fkey', 'reviews', type_='foreignkey')
    op.drop_constraint('notifications_user_id_fkey', 'notifications', type_='foreignkey')

    # Drop indexes on user_id columns
    op.drop_index('ix_pets_user_id', table_name='pets')
    op.drop_index('ix_appointments_user_id', table_name='appointments')
    op.drop_index('ix_reviews_user_id', table_name='reviews')
    op.drop_index('ix_notifications_user_id', table_name='notifications')

    # Rename the users table to pet_owners
    op.rename_table('users', 'pet_owners')

    # Rename user_id columns to pet_owner_id
    op.alter_column('pets', 'user_id', new_column_name='pet_owner_id')
    op.alter_column('appointments', 'user_id', new_column_name='pet_owner_id')
    op.alter_column('reviews', 'user_id', new_column_name='pet_owner_id')
    op.alter_column('notifications', 'user_id', new_column_name='pet_owner_id')

    # Create new indexes on pet_owner_id columns
    op.create_index(op.f('ix_pets_pet_owner_id'), 'pets', ['pet_owner_id'], unique=False)
    op.create_index(op.f('ix_appointments_pet_owner_id'), 'appointments', ['pet_owner_id'], unique=False)
    op.create_index(op.f('ix_reviews_pet_owner_id'), 'reviews', ['pet_owner_id'], unique=False)
    op.create_index(op.f('ix_notifications_pet_owner_id'), 'notifications', ['pet_owner_id'], unique=False)

    # Create new foreign key constraints
    op.create_foreign_key(
        'pets_pet_owner_id_fkey', 'pets', 'pet_owners',
        ['pet_owner_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'appointments_pet_owner_id_fkey', 'appointments', 'pet_owners',
        ['pet_owner_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'reviews_pet_owner_id_fkey', 'reviews', 'pet_owners',
        ['pet_owner_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'notifications_pet_owner_id_fkey', 'notifications', 'pet_owners',
        ['pet_owner_id'], ['id'], ondelete='CASCADE'
    )


def downgrade() -> None:
    # Drop foreign key constraints
    op.drop_constraint('pets_pet_owner_id_fkey', 'pets', type_='foreignkey')
    op.drop_constraint('appointments_pet_owner_id_fkey', 'appointments', type_='foreignkey')
    op.drop_constraint('reviews_pet_owner_id_fkey', 'reviews', type_='foreignkey')
    op.drop_constraint('notifications_pet_owner_id_fkey', 'notifications', type_='foreignkey')

    # Drop indexes on pet_owner_id columns
    op.drop_index(op.f('ix_pets_pet_owner_id'), table_name='pets')
    op.drop_index(op.f('ix_appointments_pet_owner_id'), table_name='appointments')
    op.drop_index(op.f('ix_reviews_pet_owner_id'), table_name='reviews')
    op.drop_index(op.f('ix_notifications_pet_owner_id'), table_name='notifications')

    # Rename pet_owner_id columns back to user_id
    op.alter_column('pets', 'pet_owner_id', new_column_name='user_id')
    op.alter_column('appointments', 'pet_owner_id', new_column_name='user_id')
    op.alter_column('reviews', 'pet_owner_id', new_column_name='user_id')
    op.alter_column('notifications', 'pet_owner_id', new_column_name='user_id')

    # Rename the pet_owners table back to users
    op.rename_table('pet_owners', 'users')

    # Create indexes on user_id columns
    op.create_index('ix_pets_user_id', 'pets', ['user_id'], unique=False)
    op.create_index('ix_appointments_user_id', 'appointments', ['user_id'], unique=False)
    op.create_index('ix_reviews_user_id', 'reviews', ['user_id'], unique=False)
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'], unique=False)

    # Create foreign key constraints
    op.create_foreign_key(
        'pets_user_id_fkey', 'pets', 'users',
        ['user_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'appointments_user_id_fkey', 'appointments', 'users',
        ['user_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'reviews_user_id_fkey', 'reviews', 'users',
        ['user_id'], ['id'], ondelete='CASCADE'
    )
    op.create_foreign_key(
        'notifications_user_id_fkey', 'notifications', 'users',
        ['user_id'], ['id'], ondelete='CASCADE'
    )
