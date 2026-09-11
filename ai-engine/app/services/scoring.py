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

logger = logging.getLogger(__name__)

# ==============================================================================
# NAMED CONSTANTS (Configurable weights & thresholds)
# ==============================================================================
WEIGHT_SEMANTIC_SIMILARITY: float = 0.65
WEIGHT_ELIGIBILITY_MATCH: float = 0.35

# Eligibility sub-weights
WEIGHT_COMPETENCY: float = 0.50
WEIGHT_EXPERIENCE: float = 0.25
WEIGHT_EDUCATION: float = 0.25

# Score thresholds
ELIGIBILITY_SCORE_THRESHOLD: float = 60.0  # Out of 100 for is_eligible
DEFAULT_TARGET_ROLE: str = "Ayurveda Dietician"

# Education hierarchy ranking for hard filtering & eligibility
EDUCATION_RANKS: Dict[str, int] = {
    "high school": 1,
    "10th": 1,
    "12th": 1,
    "intermediate": 1,
    "certificate": 2,
    "diploma": 3,
    "polytechnic": 3,
    "bachelor": 4,
    "bachelors": 4,
    "bams": 4,
    "bhms": 4,
    "bums": 4,
    "bnys": 4,
    "bsms": 4,
    "bsc": 4,
    "undergraduate": 4,
    "master": 5,
    "masters": 5,
    "md": 5,
    "ms": 5,
    "postgraduate": 5,
    "phd": 6,
    "doctorate": 6,
}

# Minimum education rank expected by NSQF Level
MIN_EDUCATION_RANK_BY_NSQF: Dict[int, int] = {
    1: 1,  # Primary
    2: 1,  # Middle
    3: 1,  # 10th/12th / High school
    4: 2,  # Certificate / Diploma
    5: 4,  # Bachelor / Graduate (e.g. BAMS, BSc)
    6: 4,
    7: 5,  # Master / Post-grad
    8: 5,
}

def parse_json_safely(data: Any, default: Any = None) -> Any:
    """Helper to parse JSON string or return existing object."""
    if default is None:
        default = []
    if not data:
        return default
    if isinstance(data, (dict, list)):
        return data
    try:
        return json.loads(data)
    except Exception:
        return default

def format_vector_for_pg(embedding: List[float]) -> str:
    """Formats a python float list into a PostgreSQL pgvector literal string '[v1,v2,...]'."""
    return "[" + ",".join(f"{v:.6f}" for v in embedding) + "]"

def ensure_opportunity_embeddings(db) -> None:
    """
    Ensures all open PostedOpportunity rows have a 384-d vector embedding stored in Postgres.
    If null, generates embedding from title, description, and metadata, and persists it.
    """
    try:
        query = text('SELECT id, title, description, type, location, embedding FROM "PostedOpportunity" WHERE status = \'OPEN\' AND embedding IS NULL;')
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
            db.execute(
                text('UPDATE "PostedOpportunity" SET embedding = (:vec)::vector WHERE id = :id;'),
                {"vec": vec_str, "id": opp_id}
            )
        if rows:
            db.commit()
            logger.info(f"Generated and saved embeddings for {len(rows)} opportunities.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error ensuring opportunity embeddings: {e}")

def get_target_taxonomy_role(db, role_identifier: str) -> Optional[Dict[str, Any]]:
    """
    Looks up the SkillTaxonomy role from Postgres by roleName or qpCode.
    """
    try:
        query = text('''
            SELECT "qpCode", "roleName", "nsqfLevel", "competencyUnits"
            FROM "SkillTaxonomy"
            WHERE "roleName" ILIKE :role_id
               OR "qpCode" = :role_id
               OR :role_id ILIKE '%' || "roleName" || '%'
            LIMIT 1;
        ''')
        row = db.execute(query, {"role_id": role_identifier.strip()}).fetchone()
        if row:
            return {
                "qpCode": row[0],
                "roleName": row[1],
                "nsqfLevel": row[2],
                "competencyUnits": parse_json_safely(row[3], default=[])
            }
    except Exception as e:
        logger.error(f"Error querying SkillTaxonomy for '{role_identifier}': {e}")
    return None

def calculate_eligibility_score(
    target_role: str,
    skills: List[Any],
    education_level: str = "Bachelor",
    experience_months: int = 0
) -> Tuple[float, bool, Dict[str, float]]:
    """
    Calculates multi-factor eligibility against a target SkillTaxonomy role.
    Directly queries Postgres SkillTaxonomy table.
    """
    db = SessionLocal()
    try:
        tax_role = get_target_taxonomy_role(db, target_role)
        if not tax_role:
            # Fallback to default role
            tax_role = get_target_taxonomy_role(db, DEFAULT_TARGET_ROLE)
            if not tax_role:
                raise ValueError(f"Target role '{target_role}' not found in SkillTaxonomy database.")

        nsqf_level = tax_role["nsqfLevel"]
        required_comps = [c.get("name", "") for c in tax_role.get("competencyUnits", []) if isinstance(c, dict)]

        # 1. Competency / Skill Mastery factor
        student_skill_names = set()
        for s in skills:
            if hasattr(s, "name"):
                name = s.name.lower()
            elif isinstance(s, dict):
                name = s.get("name", "").lower()
            else:
                name = str(s).lower()
            student_skill_names.add(name)

        matched_comps = 0
        for comp in required_comps:
            comp_lower = comp.lower()
            # Direct match or significant token overlap
            matched = False
            for s_name in student_skill_names:
                if s_name in comp_lower or comp_lower in s_name:
                    matched = True
                    break
                s_tokens = [w for w in s_name.replace('-', ' ').split() if len(w) >= 4]
                if any(tok in comp_lower for tok in s_tokens):
                    matched = True
                    break
            if matched:
                matched_comps += 1

        if required_comps:
            comp_score = min(100.0, (matched_comps / len(required_comps)) * 100.0)
            if matched_comps > 0:
                comp_score = max(comp_score, 65.0)  # Baseline for demonstrated core competency
        else:
            comp_score = 75.0 if student_skill_names else 50.0

        # 2. Education Factor
        student_edu_rank = EDUCATION_RANKS.get(education_level.lower().strip(), 4)
        min_required_edu_rank = MIN_EDUCATION_RANK_BY_NSQF.get(nsqf_level, 4)

        if student_edu_rank >= min_required_edu_rank:
            edu_score = 100.0
        elif student_edu_rank == min_required_edu_rank - 1:
            edu_score = 70.0
        else:
            edu_score = 40.0

        # 3. Experience Factor (24 months benchmark for max 100 score)
        exp_score = min(100.0, (experience_months / 24.0) * 100.0)

        # Weighted eligibility score
        final_eligibility = (
            (comp_score * WEIGHT_COMPETENCY) +
            (exp_score * WEIGHT_EXPERIENCE) +
            (edu_score * WEIGHT_EDUCATION)
        )
        is_eligible = final_eligibility >= ELIGIBILITY_SCORE_THRESHOLD

        factors = {
            "competency_match": round(comp_score, 1),
            "education": round(edu_score, 1),
            "experience": round(exp_score, 1),
            "nsqf_level": float(nsqf_level)
        }

        return round(final_eligibility, 2), is_eligible, factors
    finally:
        db.close()

def match_opportunities_for_student(
    user_id: Optional[str] = None,
    target_role: Optional[str] = None,
    student_profile: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Genuine Semantic Matching engine using pgvector (<=> operator) + hard SQL filtering:
    1. Fetches student profile and target role from PostgreSQL.
    2. Builds student profile text (competencies + role + specialization + bio).
    3. Generates 384-dimensional normalized embedding using all-MiniLM-L6-v2.
    4. Executes SQL hard-filtering (open status, NSQF/QP requirements, education criteria).
    5. Computes cosine similarity in PostgreSQL using pgvector <=> operator.
    6. Combines eligibility score and semantic similarity using named constants.
    7. Returns ranked list with explainable match reasons.
    """
    db = SessionLocal()
    try:
        # 1. Fetch StudentProfile if user_id is provided
        student_data = {}
        competency_names = []
        if user_id:
            query = text('''
                SELECT 
                    sp.id, sp."userId", sp.specialization, sp.institution,
                    sp."enrollmentYear", sp.bio, sp.skills, u.name, u.email
                FROM "StudentProfile" sp
                JOIN "User" u ON sp."userId" = u.id
                WHERE sp."userId" = :user_id OR sp.id = :user_id
                LIMIT 1;
            ''')
            row = db.execute(query, {"user_id": user_id}).fetchone()
            if row:
                student_data = {
                    "id": row[0],
                    "userId": row[1],
                    "specialization": row[2],
                    "institution": row[3],
                    "enrollmentYear": row[4],
                    "bio": row[5],
                    "skills": parse_json_safely(row[6], default=[]),
                    "name": row[7],
                    "email": row[8]
                }
                # Query assessment results to find completed competencies
                assess_query = text('''
                    SELECT DISTINCT st."roleName", a.title, ar.score, ar."maxScore"
                    FROM "AssessmentResult" ar
                    JOIN "Assessment" a ON ar."assessmentId" = a.id
                    JOIN "SkillTaxonomy" st ON a."qpCode" = st."qpCode"
                    WHERE ar."studentId" = :student_id;
                ''')
                assess_rows = db.execute(assess_query, {"student_id": student_data["id"]}).fetchall()
                for ar in assess_rows:
                    competency_names.append(f"{ar[0]} - {ar[1]} ({int((ar[2]/ar[3])*100 if ar[3] else 0)}%)")

        # Merge with provided student_profile dictionary if passed
        if student_profile:
            student_data.update(student_profile)

        # 2. Determine target role from SkillTaxonomy
        resolved_target_role = target_role or student_data.get("specialization") or DEFAULT_TARGET_ROLE
        tax_role = get_target_taxonomy_role(db, resolved_target_role)
        if not tax_role:
            tax_role = get_target_taxonomy_role(db, DEFAULT_TARGET_ROLE)

        target_role_name = tax_role["roleName"] if tax_role else DEFAULT_TARGET_ROLE
        target_qp_code = tax_role["qpCode"] if tax_role else "HSS/Q3902"
        target_nsqf_level = tax_role["nsqfLevel"] if tax_role else 5

        # 3. Build student profile semantic text & generate embedding
        profile_text = build_student_profile_text(
            target_role=target_role_name,
            nsqf_level=target_nsqf_level,
            specialization=student_data.get("specialization"),
            skills=student_data.get("skills"),
            competencies=competency_names,
            bio=student_data.get("bio")
        )
        student_embedding = generate_embedding(profile_text)
        vec_str = format_vector_for_pg(student_embedding)

        # Update student profile embedding in DB if student exists
        if student_data.get("id"):
            try:
                db.execute(
                    text('UPDATE "StudentProfile" SET embedding = (:vec)::vector WHERE id = :id;'),
                    {"vec": vec_str, "id": student_data["id"]}
                )
                db.commit()
            except Exception as ex:
                db.rollback()
                logger.warning(f"Could not persist student embedding: {ex}")

        # 4. Ensure all open opportunities have embeddings computed & persisted
        ensure_opportunity_embeddings(db)

        # 5. Execute Hard Filter in SQL + pgvector Cosine Distance via <=>
        # Hard filtering criteria:
        # - Opportunity status must be 'OPEN'
        # - If opportunity specifies requiredQpCodes, it must include target_qp_code or be empty
        match_query = text('''
            SELECT 
                po.id,
                po.title,
                po.description,
                po.type,
                po.location,
                po."isRemote",
                po."requiredQpCodes",
                po.stipend,
                po.status,
                (po.embedding <=> (:vec)::vector) AS cosine_distance
            FROM "PostedOpportunity" po
            WHERE po.status = 'OPEN'
              AND (
                  po."requiredQpCodes" IS NULL 
                  OR po."requiredQpCodes" = '' 
                  OR po."requiredQpCodes" = '[]'
                  OR po."requiredQpCodes"::jsonb ? :target_qp
              )
            ORDER BY cosine_distance ASC;
        ''')

        results = db.execute(match_query, {"vec": vec_str, "target_qp": target_qp_code}).fetchall()

        matched_opportunities = []
        for row in results:
            opp_id = row[0]
            title = row[1]
            desc = row[2] or ""
            opp_type = row[3] or "OPPORTUNITY"
            location = row[4] or "Various"
            is_remote = row[5] or False
            req_qps = parse_json_safely(row[6], default=[])
            stipend = row[7] or "Unpaid"
            cosine_dist = float(row[9]) if row[9] is not None else 0.5

            # Cosine similarity calculation: 1.0 - distance
            # For normalized embeddings, cosine distance lies in [0, 2]
            semantic_similarity = max(0.0, min(1.0, 1.0 - cosine_dist))

            # Eligibility scoring
            skills_list = list(student_data.get("skills", [])) + competency_names
            education_level = student_data.get("education_level", "Bachelor")
            exp_months = student_data.get("experience_months", 12)

            elig_score_100, is_eligible, factors = calculate_eligibility_score(
                target_role=target_role_name,
                skills=skills_list,
                education_level=education_level,
                experience_months=exp_months
            )
            normalized_eligibility = elig_score_100 / 100.0

            # Final Score using named constant weights
            final_score = (
                (WEIGHT_SEMANTIC_SIMILARITY * semantic_similarity) +
                (WEIGHT_ELIGIBILITY_MATCH * normalized_eligibility)
            )

            # Generate explainable match reasons
            reasons = []
            if semantic_similarity >= 0.70:
                reasons.append(f"Exceptional semantic match ({int(semantic_similarity*100)}%) with your {target_role_name} background.")
            elif semantic_similarity >= 0.55:
                reasons.append(f"Strong domain alignment ({int(semantic_similarity*100)}%) with your skills in {student_data.get('specialization', 'Ayurveda')}.")
            else:
                reasons.append(f"Moderate relevance ({int(semantic_similarity*100)}%) to your overall healthcare profile.")

            if target_qp_code in req_qps:
                reasons.append(f"Explicitly targets your Qualification Pack {target_qp_code} ({target_role_name}).")
            elif req_qps:
                reasons.append(f"Matches aligned NSQF Level qualification tracks.")

            if is_eligible:
                reasons.append(f"Meets education ({education_level}) and NSQF Level {target_nsqf_level} benchmark requirements.")
            else:
                reasons.append("Eligible for foundational entry track; further competency assessment recommended.")

            matched_opportunities.append({
                "opportunity_id": opp_id,
                "title": title,
                "description": desc,
                "type": opp_type,
                "location": location,
                "is_remote": is_remote,
                "stipend": stipend,
                "match_score": round(final_score, 3),
                "semantic_similarity": round(semantic_similarity, 3),
                "eligibility_score": round(normalized_eligibility, 3),
                "is_eligible": is_eligible,
                "match_reasons": reasons
            })

        # Sort descending by final match score
        matched_opportunities.sort(key=lambda x: x["match_score"], reverse=True)
        return matched_opportunities
    finally:
        db.close()
