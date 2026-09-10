from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import skill_engine, matching, analytics

app = FastAPI(
    title="AYUSH-SETU AI Engine",
    description="AI Engine for matching, gap analysis, and recommendations in AYUSH domain.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
