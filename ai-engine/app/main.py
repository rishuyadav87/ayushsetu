from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import skill_engine, matching, analytics
from app.services.embedding import load_embedding_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load 'all-MiniLM-L6-v2' once into memory
    load_embedding_model()
    yield

app = FastAPI(
    title="AYUSH-SETU AI Engine",
    description="AI Engine for matching, gap analysis, and recommendations in AYUSH domain.",
    version="1.0.0",
    lifespan=lifespan
)

import os

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(skill_engine.router)
app.include_router(matching.router)
app.include_router(analytics.router)

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "AYUSH-SETU AI Engine"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
