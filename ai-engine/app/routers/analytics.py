from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import AnalyticsRequest, DemandTrendsResponse

router = APIRouter(prefix="/api/ai", tags=["Analytics"])

@router.post("/demand-trends", response_model=DemandTrendsResponse)
def demand_trends(request: AnalyticsRequest):
    """Analyze skill demand across opportunities."""
    return DemandTrendsResponse(
        top_skills={"Prakriti Assessment": 85.0, "Patient Counseling": 78.5},
        growing_roles=["Ayurveda Dietician (Level 4)", "Yoga Wellness Trainer (Level 4)"]
    )

@router.post("/readiness-score")
def readiness_score(request: AnalyticsRequest):
    """Calculate institution readiness scores."""
    return {"readiness_score": 82.5, "institution": "AYUSH Training Institute"}

@router.post("/placement-insights")
def placement_insights(request: AnalyticsRequest):
    """Generate placement outcome insights."""
    return {"placement_rate": 75.0, "average_salary": 25000}

@router.post("/skill-heatmap")
def skill_heatmap(request: AnalyticsRequest):
    """Generate skill supply vs demand heatmap data."""
    return {
        "heatmap": [
            {"skill": "Ahara Vijnana", "supply": 40, "demand": 80},
            {"skill": "Asana Practice", "supply": 70, "demand": 60}
        ]
    }
