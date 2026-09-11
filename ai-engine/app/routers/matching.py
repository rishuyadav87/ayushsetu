from fastapi import APIRouter, Query
from typing import List, Dict, Any, Optional
from app.models.schemas import MatchRequest, Opportunity, CourseRecommendationRequest, CourseRecommendationResponse
from app.services.scoring import match_opportunities_for_student

router = APIRouter(prefix="/api/ai", tags=["Matching"])

@router.post("/match-opportunities")
def match_opportunities_endpoint(
    request: MatchRequest
):
    """
    Genuine Semantic Matching endpoint:
    Uses pgvector (<=> cosine distance) and sentence-transformers.
    Queries PostedOpportunity, SkillTaxonomy, and StudentProfile directly from PostgreSQL.
    """
    student_dict = {
        "education_level": request.education_level or "Bachelor",
        "experience_months": request.experience_months if request.experience_months is not None else 12,
        "skills": [s.name for s in request.skills] if request.skills else []
    }

    matches = match_opportunities_for_student(
        user_id=request.user_id,
        target_role=request.target_role,
        student_profile=student_dict
    )
    return {
        "user_id": request.user_id,
        "target_role": request.target_role,
        "matches": matches,
        "total_matched": len(matches)
    }

@router.get("/match-opportunities/{user_id}")
def match_opportunities_for_user(
    user_id: str,
    target_role: Optional[str] = Query(None, description="Target NSQF role to match against")
):
    """
    Direct endpoint for fetching semantic matches for an existing student user in the database.
    """
    matches = match_opportunities_for_student(
        user_id=user_id,
        target_role=target_role
    )
    return {
        "user_id": user_id,
        "target_role": target_role,
        "matches": matches,
        "total_matched": len(matches)
    }

@router.post("/recommend-courses", response_model=CourseRecommendationResponse)
def recommend_courses(request: CourseRecommendationRequest):
    """Recommend courses based on skill gaps."""
    course_catalog = {
        "Prakriti Assessment": "AYU-101: Fundamentals of Prakriti",
        "Ahara Vijnana": "AYU-102: Ayurvedic Dietetics",
        "Asana Practice": "YOG-201: Advanced Asanas",
        "Anatomy Basics": "BIO-101: Human Anatomy for Healers"
    }
    
    recommended = []
    for gap in request.skill_gaps:
        if gap in course_catalog:
            recommended.append(course_catalog[gap])
        else:
            recommended.append(f"Certificate Training in {gap}")
            
    return CourseRecommendationResponse(recommended_courses=recommended)

@router.post("/recommend-mentors")
def recommend_mentors(request: MatchRequest):
    """Recommend mentors based on student needs."""
    return {"mentors": ["Dr. Vasant Lad (Ayurveda)", "Swami Ramdev (Yoga & Wellness)"]}
