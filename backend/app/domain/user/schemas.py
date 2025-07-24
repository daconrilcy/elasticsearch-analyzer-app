import uuid

from pydantic import BaseModel, EmailStr
from .models import UserRole


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True

