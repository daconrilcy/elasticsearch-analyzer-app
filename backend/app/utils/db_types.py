# backend/app/utils/db_types.py

import uuid
from sqlalchemy.types import TypeDecorator, CHAR, String, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from typing import Type
from sqlalchemy.orm import DeclarativeMeta


# --- Type Personnalisé pour UUID (compatible PG/SQLite) ---
class UuidType(TypeDecorator):
    """
    Type personnalisé pour stocker les UUID.
    Utilise le type UUID natif de PostgreSQL et CHAR(36) pour les autres BDD.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == 'postgresql':
            # Pour pg, la valeur est déjà un objet UUID
            return value
        if isinstance(value, uuid.UUID):
            # Pour les autres, on la convertit en string
            return str(value)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            # On s'assure de toujours retourner un objet UUID
            return uuid.UUID(value)
        return value


# --- Type Personnalisé pour JSON (compatible PG/SQLite) ---
class JSONOrJSONB(TypeDecorator):
    """Gère JSON vs JSONB selon le dialecte : JSONB pour PostgreSQL, JSON pour SQLite."""
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        else:
            return dialect.type_descriptor(JSON())


# --- Fonction utilitaire (conservée pour compatibilité) ---
def get_json_type(model_cls: Type[DeclarativeMeta]):
    """
    Retourne JSONB si PostgreSQL, sinon JSON standard.
    """
    try:
        dialect = model_cls.metadata.bind.dialect
        if dialect.name == "postgresql":
            return JSONB
    except AttributeError:
        pass
    return JSON
