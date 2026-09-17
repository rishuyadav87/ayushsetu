import json
import logging
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy import text
from app.data.db import SessionLocal
from app.services.embedding import (
    generate_embedding,
    build_student_profile_text,
    build_opportunity_text,
    get_embedding_model
)
import scipy.spatial.distance

logger = logging.getLogger(__name__)

WEIGHT_SEMANTIC_SIMILARITY: float = 0.65
WEIGHT_ELIGIBILITY_MATCH: float = 0.35
WEIGHT_COMPETENCY: float = 0.50
WEIGHT_EXPERIENCE: float = 0.25
WEIGHT_EDUCATION: float = 0.25
ELIGIBILITY_SCORE_THRESHOLD: float = 60.0
DEFAULT_TARGET_ROLE: str = "Ayurveda Dietician"

EDUCATION_RANKS: Dict[str, int] = {
    "high school": 1, "10th": 1, "12th": 1, "intermediate": 1,
    "certificate": 2, "diploma": 3, "polytechnic": 3,
    "bachelor": 4, "bachelors": 4, "bams": 4, "bhms": 4, "bums": 4, "bnys": 4, "bsms": 4, "bsc": 4, "undergraduate": 4,
    "master": 5, "masters": 5, "md": 5, "ms": 5, "postgraduate": 5,
    "phd": 6, "doctorate": 6,
}

MIN_EDUCATION_RANK_BY_NSQF: Dict[int, int] = {
    1: 1, 2: 1, 3: 1, 4: 2, 5: 4, 6: 4, 7: 5, 8: 5,
}

def parse_json_safely(data: Any, default: Any = None) -> Any:
    if default is None: default = []
    if not data: return default
    if isinstance(data, (dict, list)): return data
    try: return json.loads(data)
    except Exception: return default

def format_vector_for_pg(embedding: List[float]) -> str:
    return "[" + ",".join(f"{v:.6f}" for v in embedding) + "]"

def parse_vector(vec_str):
    if not vec_str: return [0.0]*384
    try:
        return [float(x) for x in vec_str.strip('[]').split(',')]
    except:
        return [0.0]*384

def ensure_opportunity_embeddings(db) -> None:
    try:
        query = text('SELECT id, title, description, type, location, embedding FROM "PostedOpportunity" WHERE status = ''OPEN'' AND embedding IS NULL;')
        rows = db.execute(query).fetchall()
        for row in rows:
            opp_id = row[0]
            title = row[1] or ""
            desc = row[2] or ""
            opp_type = row[3] or ""
            location = row[4] or ""
            opp_text = build_opportunity_text(title, desc, opp_type, location)
            emb = generate_embedding(opp_text)
            vec_str = format_vector_for_pg(emb)
            db.execute(text('UPDATE "PostedOpportunity" SET embedding = :vec WHERE id = :id;'), {"vec": vec_str, "id": opp_id})
        if rows:
            db.commit()
    except Exception as e:
        db.rollback()

def get_target_taxonomy_role(db, role_identifier: str) -> Optional[Dict[str, Any]]:
    try:
        query = text('SELECT "qpCode", "roleName", "nsqfLevel", "competencyUnits" FROM "SkillTaxonomy" WHERE "roleName" LIKE :role_id OR "qpCode" = :role_id OR :role_id LIKE ''%'' || "roleName" || ''%'' LIMIT 1;')
        row = db.execute(query, {"role_id": f"%{role_identifier.strip()}%"}).fetchone()
        if row:
            return {"qpCode": row[0], "roleName": row[1], "nsqfLevel": row[2], "competencyUnits": parse_json_safely(row[3], default=[])}
    except Exception as e:
        pass
    return None

def calculate_eligibility_score(target_role: str, skills: List[Any], education_level: str = "Bachelor", experience_months: int = 0) -> Tuple[float, bool, Dict[str, float]]:
    db = SessionLocal()
    try:
        tax_role = get_target_taxonomy_role(db, target_role)
        if not tax_role: tax_role = get_target_taxonomy_role(db, DEFAULT_TARGET_ROLE)
        nsqf_level = tax_role["nsqfLevel"] if tax_role else 5
        required_comps = [c.get("name", "") for c in tax_role.get("competencyUnits", []) if isinstance(c, dict)] if tax_role else []
        student_skill_names = set()
        for s in skills:
            if hasattr(s, "name"): name = s.name.lower()
            elif isinstance(s, dict): name = s.get("name", "").lower()
            else: name = str(s).lower()
            student_skill_names.add(name)
        matched_comps = 0
        for comp in required_comps:
            comp_lower = comp.lower()
            matched = False
            for s_name in student_skill_names:
                if s_name in comp_lower or comp_lower in s_name:
                    matched = True
                    break
                s_tokens = [w for w in s_name.replace('-', ' ').split() if len(w) >= 4]
                if any(tok in comp_lower for tok in s_tokens):
                    matched = True
                    break
            if matched: matched_comps += 1
        comp_score = min(100.0, (matched_comps / len(required_comps)) * 100.0) if required_comps else (75.0 if student_skill_names else 50.0)
        if required_comps and matched_comps > 0: comp_score = max(comp_score, 65.0)
        student_edu_rank = EDUCATION_RANKS.get(education_level.lower().strip(), 4)
        min_required_edu_rank = MIN_EDUCATION_RANK_BY_NSQF.get(nsqf_level, 4)
        edu_score = 100.0 if student_edu_rank >= min_required_edu_rank else (70.0 if student_edu_rank == min_required_edu_rank - 1 else 40.0)
        exp_score = min(100.0, (experience_months / 24.0) * 100.0)
        final_eligibility = (comp_score * WEIGHT_COMPETENCY) + (exp_score * WEIGHT_EXPERIENCE) + (edu_score * WEIGHT_EDUCATION)
        is_eligible = final_eligibility >= ELIGIBILITY_SCORE_THRESHOLD
        factors = {"competency_match": round(comp_score, 1), "education": round(edu_score, 1), "experience": round(exp_score, 1), "nsqf_level": float(nsqf_level)}
        return round(final_eligibility, 2), is_eligible, factors
    finally:
        db.close()

def match_opportunities_for_student(user_id: Optional[str] = None, target_role: Optional[str] = None, student_profile: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    db = SessionLocal()
    try:
        student_data = {}
        competency_names = []
        if user_id:
            query = text('SELECT sp.id, sp."userId", sp.specialization, sp.institution, sp."enrollmentYear", sp.bio, sp.skills, u.name, u.email FROM "StudentProfile" sp JOIN "User" u ON sp."userId" = u.id WHERE sp."userId" = :user_id OR sp.id = :user_id LIMIT 1;')
            row = db.execute(query, {"user_id": user_id}).fetchone()
            if row:
                student_data = {"id": row[0], "userId": row[1], "specialization": row[2], "institution": row[3], "enrollmentYear": row[4], "bio": row[5], "skills": parse_json_safely(row[6], default=[]), "name": row[7], "email": row[8]}
                assess_query = text('SELECT DISTINCT st."roleName", a.title, ar.score, ar."maxScore" FROM "AssessmentResult" ar JOIN "Assessment" a ON ar."assessmentId" = a.id JOIN "SkillTaxonomy" st ON a."qpCode" = st."qpCode" WHERE ar."studentId" = :student_id;')
                for ar in db.execute(assess_query, {"student_id": student_data["id"]}).fetchall():
                    competency_names.append(f"{ar[0]} - {ar[1]} ({int((ar[2]/ar[3])*100 if ar[3] else 0)}%)")
        if student_profile: student_data.update(student_profile)
        resolved_target_role = target_role or student_data.get("specialization") or DEFAULT_TARGET_ROLE
        tax_role = get_target_taxonomy_role(db, resolved_target_role)
        target_role_name = tax_role["roleName"] if tax_role else DEFAULT_TARGET_ROLE
        target_qp_code = tax_role["qpCode"] if tax_role else "HSS/Q3902"
        target_nsqf_level = tax_role["nsqfLevel"] if tax_role else 5
        profile_text = build_student_profile_text(target_role=target_role_name, nsqf_level=target_nsqf_level, specialization=student_data.get("specialization"), skills=student_data.get("skills"), competencies=competency_names, bio=student_data.get("bio"))
        student_embedding = generate_embedding(profile_text)
        vec_str = format_vector_for_pg(student_embedding)
        if student_data.get("id"):
            try:
                db.execute(text('UPDATE "StudentProfile" SET embedding = :vec WHERE id = :id;'), {"vec": vec_str, "id": student_data["id"]})
                db.commit()
            except Exception as ex:
                db.rollback()
        ensure_opportunity_embeddings(db)
        match_query = text('SELECT po.id, po.title, po.description, po.type, po.location, po."isRemote", po."requiredQpCodes", po.stipend, po.status, po.embedding FROM "PostedOpportunity" po WHERE po.status = ''OPEN'';')
        results = db.execute(match_query).fetchall()
        matched_opportunities = []
        for row in results:
            req_qps = parse_json_safely(row[6], default=[])
            if req_qps and target_qp_code not in req_qps: continue
            emb_str = row[9]
            opp_emb = parse_vector(emb_str)
            cosine_dist = scipy.spatial.distance.cosine(student_embedding, opp_emb) if any(opp_emb) else 0.5
            semantic_similarity = max(0.0, min(1.0, 1.0 - cosine_dist))
            elig_score_100, is_eligible, factors = calculate_eligibility_score(target_role=target_role_name, skills=list(student_data.get("skills", [])) + competency_names, education_level=student_data.get("education_level", "Bachelor"), experience_months=student_data.get("experience_months", 12))
            final_score = (WEIGHT_SEMANTIC_SIMILARITY * semantic_similarity) + (WEIGHT_ELIGIBILITY_MATCH * (elig_score_100 / 100.0))
            matched_opportunities.append({
                "opportunity_id": row[0], "title": row[1], "description": row[2] or "", "type": row[3] or "OPPORTUNITY", "location": row[4] or "Various", "is_remote": row[5] or False, "stipend": row[7] or "Unpaid",
                "match_score": round(final_score, 3), "semantic_similarity": round(semantic_similarity, 3), "eligibility_score": round(elig_score_100 / 100.0, 3), "is_eligible": is_eligible,
                "match_reasons": [f"Semantic match ({int(semantic_similarity*100)}%)"]
            })
        matched_opportunities.sort(key=lambda x: x["match_score"], reverse=True)
        return matched_opportunities
    finally:
        db.close()
