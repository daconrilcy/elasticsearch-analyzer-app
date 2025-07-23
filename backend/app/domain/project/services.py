""" app/domain/project/services.py """
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .models import Project, ProjectStatus
from .schemas import ProjectCreate, ProjectUpdate
from backend.app.domain.analyzer.validators.validator import validate_full_graph, ValidationError


async def get_project(db: AsyncSession, project_id: int) -> Optional[Project]:
    """Récupère un projet par son ID."""
    return await db.get(Project, project_id)


async def get_all_projects(db: AsyncSession) -> List[Project]:
    """Récupère tous les projets."""
    result = await db.execute(select(Project))
    return result.scalars().all()


async def create_project(db: AsyncSession, project_in: ProjectCreate) -> Project:
    """Crée un nouveau projet et tente de le valider."""
    graph_data_for_db = project_in.graph.model_dump(mode='json')

    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        graph=graph_data_for_db,
        status=ProjectStatus.DRAFT  # Commence toujours en tant que brouillon
    )

    # Tente de valider le graphe. Si c'est bon, le statut passe à VALIDATED.
    try:
        validate_full_graph(project_in.graph)
        new_project.status = ProjectStatus.VALIDATED
    except ValidationError:
        # Si la validation échoue, il reste en DRAFT. Pas d'erreur levée.
        pass

    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project


async def update_project(db: AsyncSession, db_project: Project, project_in: ProjectUpdate) -> Project:
    """Met à jour un projet, incrémente sa version et re-valide le graphe."""
    update_data = project_in.model_dump(exclude_unset=True)
    version_changed = False
    graph_updated = "graph" in update_data

    for key, value in update_data.items():
        if key in ["name", "graph"] and getattr(db_project, key) != value:
            version_changed = True

        if key == "graph" and project_in.graph:
            setattr(db_project, key, project_in.graph.model_dump(mode='json'))
        else:
            setattr(db_project, key, value)

    if version_changed:
        db_project.version += 1
        # Si le graphe ou le nom change, on repasse le statut en brouillon
        db_project.status = ProjectStatus.DRAFT

    # Si le graphe a été mis à jour (ou si on met à jour un projet déjà en DRAFT),
    # on tente une nouvelle validation.
    if graph_updated or db_project.status == ProjectStatus.DRAFT:
        try:
            # On valide le graphe actuel du projet
            from backend.app.domain.analyzer.models import AnalyzerGraph
            current_graph = AnalyzerGraph.model_validate(db_project.graph)
            validate_full_graph(current_graph)
            db_project.status = ProjectStatus.VALIDATED
        except ValidationError:
            db_project.status = ProjectStatus.DRAFT

    await db.commit()
    await db.refresh(db_project)
    return db_project


async def delete_project(db: AsyncSession, project: Project) -> None:
    """Supprime un projet."""
    await db.delete(project)
    await db.commit()
