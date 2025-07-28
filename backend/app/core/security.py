"""backend/app/core/security.py"""
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, UTC, timedelta
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    """Verifie le mot de passe."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Retourne le hachage du mot de passe."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Créer un token d'accès."""
    expire = datetime.now(UTC) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str):
    """Décodage du token d'accès."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


if __name__ == "__main__":
    print(get_password_hash("test"))
