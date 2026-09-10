from fastapi import APIRouter
from typing import List, Dict, Any
from app.models.schemas import MatchRequest, Opportunity, CourseRecommendationRequest, CourseRecommendationResponse
from app.services.recommendation import compute_similarity

router = APIRouter(prefix="/api/ai", tags=["Matching"])

@router.post("/match-opportunities")
def match_opportunities(request: MatchRequest, opportunities: List[Opportunity]):
    """Match student profile to opportunities."""
    matches = compute_similarity(request.skills, opportunities)
    return {"matches": matches}

@router.post("/match-candidates")
def match_candidates(opportunity: Opportunity, candidates: List[MatchRequest]):
    """Match opportunity requirements to student pool."""
    results = []
    for cand in candidates:
        sim = compute_similarity(cand.skills, [opportunity])
        if sim:
            results.append({
                "candidate_id": cand.user_id,
                "match_score": sim[0]["match_score"]
            })
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return {"candidates": results}

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
            recommended.append(f"Generic Course on {gap}")
            
    return CourseRecommendationResponse(recommended_courses=recommended)

@router.post("/recommend-mentors")
def recommend_mentors(request: MatchRequest):
    """Recommend mentors based on student needs."""
    return {"mentors": ["Mentor A (Ayurveda)", "Mentor B (Yoga)"]}
