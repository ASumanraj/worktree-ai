from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.api.routes import router as api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed demo data
    init_db()
    yield


app = FastAPI(
    title="WorkTree AI Cloud Core",
    description="Edge-Native Engineering Memory, Autonomous Standup & Flow Intelligence Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for localhost:3000 (wt-web) and VS Code (wt-ide)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "wt-cloud",
        "version": "1.0.0",
        "privacy_compliance": "DPDP Rules 2025 / k >= 5 Differential Privacy",
    }


@app.get("/")
def root():
    return {
        "name": "WorkTree AI (worktree.ai)",
        "docs_url": "/docs",
        "health_url": "/health",
        "api_v1": "/api/v1",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
