from pydantic import BaseModel

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None

class ProjectOut(BaseModel):
    id: int
    name: str
    description: str | None = None

    model_config = {
        "from_attributes": True
    }
