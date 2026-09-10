from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.schemas import SkillProfile, GapAnalysisRequest, GapAnalysisResponse, EligibilityRequest, EligibilityResponse
from app.services.gap_analysis import perform_gap_analysis
from app.services.scoring import calculate_eligibility_score
from app.services.recommendation import get_career_paths

router = APIRouter(prefix="/api/ai", tags=["Skill Engine"])

@router.post("/skill-profile", response_model=SkillProfile)
def create_skill_profile(profile: SkillProfile):
    """Build a skill profile from assessment results."""
    return profile

@router.post("/gap-analysis", response_model=GapAnalysisResponse)
def gap_analysis(request: GapAnalysisRequest):
    """Analyze gaps against a target NSQF role."""
    try:
        match_percentage, missing_skills, skill_gaps, recommendations = perform_gap_analysis(
            request.target_role, request.current_skills
        )
        return GapAnalysisResponse(
            target_role=request.target_role,
            match_percentage=match_percentage,
            missing_skills=missing_skills,
            skill_gaps=skill_gaps,
            recommendations=recommendations
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/eligibility-score", response_model=EligibilityResponse)
def eligibility_score(request: EligibilityRequest):
    """Score a student's eligibility for a specific role."""
    try:
        score, is_eligible, factors = calculate_eligibility_score(
            request.target_role, request.skills, request.education_level, request.experience_months
        )
        return EligibilityResponse(
            score=score,
            is_eligible=is_eligible,
            factors=factors
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/career-paths")
def career_paths(profile: SkillProfile):
    """Suggest AYUSH career paths based on skill profile."""
    paths = get_career_paths(profile.skills)
    return {"career_paths": paths}
