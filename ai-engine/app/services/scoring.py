from app.models.schemas import Skill
from typing import List, Dict, Tuple
from app.data.nsqf_taxonomy import NSQF_ROLES

def calculate_eligibility_score(target_role: str, skills: List[Skill], education_level: str, experience_months: int) -> Tuple[float, bool, Dict[str, float]]:
    """
    Calculates multi-factor eligibility score.
    """
    if target_role not in NSQF_ROLES:
        raise ValueError(f"Role '{target_role}' not found.")
        
    required_skills = NSQF_ROLES[target_role]
    skill_dict = {s.name: s.proficiency for s in skills}
    
    # 1. Skill Factor (weight: 60%)
    total_req_weight = sum(required_skills.values())
    obtained_weight = 0.0
    for s_name, s_req in required_skills.items():
        obtained_weight += min(skill_dict.get(s_name, 0.0), s_req)
        
    skill_score = (obtained_weight / total_req_weight) * 100 if total_req_weight > 0 else 0
    
    # 2. Experience Factor (weight: 20%)
    # Let's say 24 months is max score (100)
    exp_score = min(100.0, (experience_months / 24.0) * 100.0)
    
    # 3. Education Factor (weight: 20%)
    edu_levels = {"High School": 40, "Diploma": 70, "Bachelor": 90, "Master": 100}
    edu_score = edu_levels.get(education_level, 50.0)
    
    final_score = (skill_score * 0.6) + (exp_score * 0.2) + (edu_score * 0.2)
    is_eligible = final_score >= 65.0
    
    factors = {
        "skill_match": skill_score,
        "experience": exp_score,
        "education": edu_score
    }
    
    return final_score, is_eligible, factors
