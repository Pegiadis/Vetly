"""Add chat conversation and message tables

Revision ID: aabb01cc02dd
Revises: 9996ec0e40ef
Create Date: 2026-02-28 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aabb01cc02dd'
down_revision: Union[str, None] = '9996ec0e40ef'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'chat_conversations',
        sa.Column('pet_owner_id', sa.UUID(), nullable=True),
        sa.Column('vet_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['pet_owner_id'], ['pet_owners.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['vet_id'], ['vets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_chat_conversations_id'), 'chat_conversations', ['id'], unique=False)
    op.create_index(op.f('ix_chat_conversations_pet_owner_id'), 'chat_conversations', ['pet_owner_id'], unique=False)
    op.create_index(op.f('ix_chat_conversations_vet_id'), 'chat_conversations', ['vet_id'], unique=False)

    op.create_table(
        'chat_messages',
        sa.Column('conversation_id', sa.UUID(), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['chat_conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_chat_messages_id'), 'chat_messages', ['id'], unique=False)
    op.create_index(op.f('ix_chat_messages_conversation_id'), 'chat_messages', ['conversation_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_messages_conversation_id'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_id'), table_name='chat_messages')
    op.drop_table('chat_messages')
    op.drop_index(op.f('ix_chat_conversations_vet_id'), table_name='chat_conversations')
    op.drop_index(op.f('ix_chat_conversations_pet_owner_id'), table_name='chat_conversations')
    op.drop_index(op.f('ix_chat_conversations_id'), table_name='chat_conversations')
    op.drop_table('chat_conversations')
