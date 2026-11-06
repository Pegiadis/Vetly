"""Unify clinic-only pets with clinical records without creating login accounts."""
from uuid import uuid4
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql as pg

revision = 'd9e031a7b423'
down_revision = 'c8d920f6a312'
branch_labels = depends_on = None


def upgrade():
    op.alter_column('pet_owners', 'email', nullable=True)
    for name in ('breed', 'age', 'weight', 'gender'):
        op.alter_column('pets', name, nullable=True)
    op.add_column('vet_clients', sa.Column('pending_owner_id', pg.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_client_pending_owner', 'vet_clients', 'pet_owners', ['pending_owner_id'], ['id'], ondelete='SET NULL')
    op.add_column('vet_client_pets', sa.Column('pet_id', pg.UUID(as_uuid=True), nullable=True))
    conn = op.get_bind()
    for client in conn.execute(sa.text('SELECT id, pet_owner_id, name, phone, address FROM vet_clients')).mappings().all():
        owner_id = client['pet_owner_id']
        if owner_id is None:
            owner_id = uuid4()
            conn.execute(sa.text('''INSERT INTO pet_owners
                (id, name, phone, address, email_verified, created_at, updated_at)
                VALUES (:id, :name, :phone, :address, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)'''),
                dict(id=owner_id, name=client['name'], phone=client['phone'], address=client['address']))
            conn.execute(sa.text('UPDATE vet_clients SET pet_owner_id=:owner WHERE id=:id'), dict(owner=owner_id,id=client['id']))
        # Keep the legacy UUID as the clinical UUID. Private notes stay on the legacy row.
        conn.execute(sa.text('''INSERT INTO pets
            (id, pet_owner_id, name, type, breed, age, weight, gender, created_at, updated_at)
            SELECT id, :owner, name, type, breed, age, weight, gender, created_at, updated_at
            FROM vet_client_pets WHERE vet_client_id=:client'''), dict(owner=owner_id,client=client['id']))
    conn.execute(sa.text('UPDATE vet_client_pets SET pet_id=id'))
    op.alter_column('vet_client_pets', 'pet_id', nullable=False)
    op.create_foreign_key('fk_client_pet_clinical', 'vet_client_pets', 'pets', ['pet_id'], ['id'], ondelete='RESTRICT')
    op.create_unique_constraint('uq_client_pet_clinical', 'vet_client_pets', ['pet_id'])


def downgrade():
    # Reverting would discard identities that may now have appointments and history.
    raise RuntimeError('Restore a verified backup to roll back clinic patient identities; destructive downgrade is disabled.')
