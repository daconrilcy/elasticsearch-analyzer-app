from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from backend.app.core.db import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)

    # On ajoute une colonne pour stocker le graphe de l'analyseur.
    # JSONB est un type de données JSON binaire optimisé pour PostgreSQL.
    graph = Column(JSONB, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User")
