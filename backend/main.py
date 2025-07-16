from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.api import analyzer, projects
from app.core.db import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables checked/created (lifespan startup)")
    yield
    # --- Shutdown ---
    # Optionnel : clean up resources

app = FastAPI(lifespan=lifespan)

# Ne préfixe pas deux fois ! Les routes doivent être "/convert", pas "/api/v1/analyzer/convert"
app.include_router(analyzer.router, prefix="/api/v1/analyzer")
app.include_router(projects.router, prefix="/api/v1/projects")

@app.get("/ping")
def ping():
    return {"message": "pong"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
