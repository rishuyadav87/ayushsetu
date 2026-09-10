import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any
from app.models.schemas import Skill, Opportunity
from app.data.nsqf_taxonomy import NSQF_ROLES

def compute_similarity(profile_skills: List[Skill], opportunities: List[Opportunity]) -> List[Dict[str, Any]]:
    """
    Matches student profile to opportunities using cosine similarity and rule-based boosting.
    """
    if not opportunities:
        return []
        
    all_skills = set(s.name for s in profile_skills)
    for opp in opportunities:
        all_skills.update(opp.required_skills.keys())
        
    skill_list = list(all_skills)
    
    # Vectorize profile
    profile_vector = np.zeros(len(skill_list))
    profile_dict = {s.name: s.proficiency for s in profile_skills}
    for i, skill in enumerate(skill_list):
        profile_vector[i] = profile_dict.get(skill, 0.0)
        
    results = []
    profile_vec_2d = profile_vector.reshape(1, -1)
    
    for opp in opportunities:
        opp_vector = np.zeros(len(skill_list))
        for i, skill in enumerate(skill_list):
            opp_vector[i] = opp.required_skills.get(skill, 0.0)
            
        opp_vec_2d = opp_vector.reshape(1, -1)
        
        if np.sum(opp_vector) == 0:
            sim = 0.0
        else:
            sim = cosine_similarity(profile_vec_2d, opp_vec_2d)[0][0]
            
        # Rule-based boosting: if they perfectly match a highly weighted skill
        boost = 0.0
        for req_skill, req_weight in opp.required_skills.items():
            if req_weight >= 4.0 and profile_dict.get(req_skill, 0.0) >= req_weight:
                boost += 0.05
                
        final_score = min(1.0, sim + boost)
        results.append({
            "opportunity_id": opp.id,
            "title": opp.title,
            "match_score": float(final_score)
        })
        
    # Sort by score
    results.sort(key=lambda x: x["match_score"], reverse=True)
    return results

def get_career_paths(profile_skills: List[Skill]) -> List[Dict[str, Any]]:
    opps = [
        Opportunity(id=role, title=role, required_skills=skills)
        for role, skills in NSQF_ROLES.items()
    ]
    return compute_similarity(profile_skills, opps)
