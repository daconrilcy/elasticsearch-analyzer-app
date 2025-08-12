"""add compiled_hash to mapping_versions

Revision ID: add_compiled_hash_001
Revises: 
Create Date: 2025-08-12 01:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_compiled_hash_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajouter la colonne compiled_hash à la table mapping_versions
    op.add_column('mapping_versions', sa.Column('compiled_hash', sa.String(64), nullable=True))
    
    # Créer un index sur cette colonne pour les performances
    op.create_index(op.f('ix_mapping_versions_compiled_hash'), 'mapping_versions', ['compiled_hash'], unique=False)


def downgrade() -> None:
    # Supprimer l'index
    op.drop_index(op.f('ix_mapping_versions_compiled_hash'), table_name='mapping_versions')
    
    # Supprimer la colonne
    op.drop_column('mapping_versions', 'compiled_hash')
