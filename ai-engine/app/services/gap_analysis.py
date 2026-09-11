from typing import List, Dict, Tuple
from app.models.schemas import Skill
from app.data.db import get_taxonomy

def perform_gap_analysis(target_role: str, current_skills: List[Skill]) -> Tuple[float, List[str], Dict[str, float], List[str]]:
    """
    Analyzes the gap between a user's current skills and a target role.
    """
    nsqf_roles = get_taxonomy()
    if target_role not in nsqf_roles:
        raise ValueError(f"Role '{target_role}' not found in taxonomy.")
    
    required_skills = nsqf_roles[target_role]
    current_skill_dict = {s.name: s.proficiency for s in current_skills}
    
    total_required_weight = sum(required_skills.values())
    obtained_weight = 0.0
    
    missing_skills = []
    skill_gaps = {}
    recommendations = []
    
    for req_skill, req_level in required_skills.items():
        curr_level = current_skill_dict.get(req_skill, 0.0)
        
        if curr_level >= req_level:
            obtained_weight += req_level
        else:
            obtained_weight += curr_level
            gap = req_level - curr_level
            skill_gaps[req_skill] = gap
            if curr_level == 0:
                missing_skills.append(req_skill)
                recommendations.append(f"Start learning fundamentals of {req_skill}.")
            else:
                recommendations.append(f"Improve proficiency in {req_skill} from {curr_level} to {req_level}.")
                
    match_percentage = (obtained_weight / total_required_weight) * 100 if total_required_weight > 0 else 0.0
    
    return match_percentage, missing_skills, skill_gaps, recommendations
