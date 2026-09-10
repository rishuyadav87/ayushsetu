from pydantic import BaseModel, Field
from typing import List, Dict, Optional

class Skill(BaseModel):
    name: str
    proficiency: float = Field(..., ge=0.0, le=5.0, description="Proficiency level 1-5")

class SkillProfile(BaseModel):
    user_id: str
    skills: List[Skill]
    experience_months: int = 0

class GapAnalysisRequest(BaseModel):
    user_id: str
    target_role: str
    current_skills: List[Skill]

class GapAnalysisResponse(BaseModel):
    target_role: str
    match_percentage: float
    missing_skills: List[str]
    skill_gaps: Dict[str, float]
    recommendations: List[str]

class EligibilityRequest(BaseModel):
    user_id: str
    target_role: str
    skills: List[Skill]
    education_level: str
    experience_months: int

class EligibilityResponse(BaseModel):
    score: float
    is_eligible: bool
    factors: Dict[str, float]

class MatchRequest(BaseModel):
    user_id: str
    skills: List[Skill]
    preferences: Optional[Dict[str, str]] = None

class Opportunity(BaseModel):
    id: str
    title: str
    required_skills: Dict[str, float]

class MatchResponse(BaseModel):
    opportunities: List[Dict[str, float]] # list of opp_id to match score

class AnalyticsRequest(BaseModel):
    timeframe: str = "30d"

class DemandTrendsResponse(BaseModel):
    top_skills: Dict[str, float]
    growing_roles: List[str]

class CourseRecommendationRequest(BaseModel):
    user_id: str
    skill_gaps: List[str]

class CourseRecommendationResponse(BaseModel):
    recommended_courses: List[str]
