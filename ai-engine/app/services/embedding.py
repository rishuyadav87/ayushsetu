import logging
from typing import List, Optional
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

# Global model instance loaded once into memory
_embedding_model: Optional[SentenceTransformer] = None
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384

def load_embedding_model() -> SentenceTransformer:
    """
    Loads 'all-MiniLM-L6-v2' once into memory.
    """
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"Loading embedding model '{MODEL_NAME}' into memory...")
        _embedding_model = SentenceTransformer(MODEL_NAME)
        logger.info(f"Embedding model '{MODEL_NAME}' loaded successfully (dimension: {EMBEDDING_DIM}).")
    return _embedding_model

def get_embedding_model() -> SentenceTransformer:
    """
    Returns the loaded SentenceTransformer instance, loading it if not yet loaded.
    """
    global _embedding_model
    if _embedding_model is None:
        return load_embedding_model()
    return _embedding_model

def generate_embedding(text: str) -> List[float]:
    """
    Generates a 384-dimensional normalized embedding vector for the input text.
    """
    if not text or not text.strip():
        text = "AYUSH healthcare professional"
    model = get_embedding_model()
    embedding = model.encode(text.strip(), normalize_embeddings=True)
    return embedding.tolist()

def build_student_profile_text(
    target_role: str,
    nsqf_level: Optional[int] = None,
    specialization: Optional[str] = None,
    skills: Optional[List[str]] = None,
    competencies: Optional[List[str]] = None,
    bio: Optional[str] = None
) -> str:
    """
    Builds a rich semantic profile text for a student from their target role,
    NSQF level, competencies, skills, and background.
    """
    parts = []
    if target_role:
        level_str = f" (NSQF Level {nsqf_level})" if nsqf_level else ""
        parts.append(f"Target Career Role: {target_role}{level_str}.")
    if specialization:
        parts.append(f"Specialization: {specialization}.")
    if competencies:
        parts.append(f"Assessed Competencies and Capabilities: {', '.join(competencies)}.")
    if skills:
        parts.append(f"Technical and Clinical Skills: {', '.join(skills)}.")
    if bio:
        parts.append(f"Professional Background: {bio}.")
    return " ".join(parts)

def build_opportunity_text(
    title: str,
    description: str,
    opp_type: Optional[str] = None,
    location: Optional[str] = None
) -> str:
    """
    Builds a semantic representation for an opportunity.
    """
    parts = [f"Opportunity Title: {title}."]
    if opp_type:
        parts.append(f"Opportunity Type: {opp_type}.")
    if description:
        parts.append(f"Job Description and Responsibilities: {description}")
    if location:
        parts.append(f"Location: {location}.")
    return " ".join(parts)
