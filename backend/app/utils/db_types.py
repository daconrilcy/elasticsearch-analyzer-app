from sqlalchemy.types import TypeDecorator
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

class JSONOrJSONB(TypeDecorator):
    """Gère JSON vs JSONB selon le dialecte : JSONB pour PostgreSQL, JSON pour SQLite."""
    impl = JSON

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(JSONB())
        return dialect.type_descriptor(JSON())