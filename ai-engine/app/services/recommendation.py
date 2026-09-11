import logging
from typing import List, Dict, Any, Optional
from app.models.schemas import Skill
from app.data.db import get_taxonomy, SessionLocal
from app.services.embedding import generate_embedding, get_embedding_model
from app.services.scoring import match_opportunities_for_student
from sqlalchemy import text

logger = logging.getLogger(__name__)

def match_opportunities(
    user_id: Optional[str] = None,
    target_role: Optional[str] = None,
    skills: Optional[List[Skill]] = None,
    education_level: str = "Bachelor",
    experience_months: int = 12
) -> List[Dict[str, Any]]:
    """
    Unified AI matching service using pgvector and sentence-transformers.
    Queries PostedOpportunity, SkillTaxonomy, and StudentProfile directly from PostgreSQL.
    """
    student_profile = {}
    if skills:
        student_profile["skills"] = [s.name if hasattr(s, "name") else str(s) for s in skills]
    student_profile["education_level"] = education_level
    student_profile["experience_months"] = experience_months

    return match_opportunities_for_student(
        user_id=user_id,
        target_role=target_role,
        student_profile=student_profile
    )

def get_career_paths(profile_skills: List[Skill]) -> List[Dict[str, Any]]:
    """
    Matches student's skill profile against all NSQF roles in SkillTaxonomy
    using semantic embedding similarity.
    """
    db = SessionLocal()
    try:
        query = text('SELECT "qpCode", "roleName", "nsqfLevel", "competencyUnits" FROM "SkillTaxonomy"')
        rows = db.execute(query).fetchall()
        if not rows:
            return []

        # Build profile text
        skill_names = [s.name for s in profile_skills] if profile_skills else []
        profile_text = f"AYUSH Practitioner with skills: {', '.join(skill_names)}." if skill_names else "AYUSH Healthcare Student"
        model = get_embedding_model()
        profile_vec = model.encode(profile_text, normalize_embeddings=True)

        results = []
        for row in rows:
            qp_code = row[0]
            role_name = row[1]
            level = row[2]
            role_title = f"{role_name} (Level {level})"
            
            # Semantic text for the taxonomy role
            comps = row[3] or []
            comp_names = [c.get("name", "") for c in comps if isinstance(c, dict)]
            role_text = f"NSQF Role: {role_name}. Qualification Pack: {qp_code}. Level: {level}. Competencies: {', '.join(comp_names)}."
            role_vec = model.encode(role_text, normalize_embeddings=True)

            # Cosine similarity between normalized vectors is dot product
            sim = float(profile_vec @ role_vec)
            sim = max(0.0, min(1.0, sim))

            results.append({
                "opportunity_id": role_title,
                "title": role_title,
                "qp_code": qp_code,
                "nsqf_level": level,
                "match_score": round(sim, 3)
            })

        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results
    finally:
        db.close()
