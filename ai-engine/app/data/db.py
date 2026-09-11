import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Get DATABASE_URL from environment or default to local docker postgres
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ayush:ayush_secret@localhost:5432/ayush_setu")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_taxonomy():
    """
    Reads the SkillTaxonomy from the PostgreSQL database and returns it in a 
    dictionary format compatible with the AI engine services:
    {
        "Role Name (Level X)": {
            "Competency 1": 5.0,
            "Competency 2": 5.0,
            ...
        }
    }
    """
    db = SessionLocal()
    taxonomy_dict = {}
    try:
        # Read from the actual table
        result = db.execute(text('SELECT "roleName", "nsqfLevel", "competencyUnits" FROM "SkillTaxonomy"'))
        rows = result.fetchall()
        for row in rows:
            role_name = row[0]
            nsqf_level = row[1]
            competencies_json = row[2]
            
            # Formatted role key
            role_key = f"{role_name} (Level {nsqf_level})"
            
            # Assigning a default weight of 5.0 to each required competency for backwards compatibility
            # In a more advanced version, weights could be stored in the DB too.
            competency_dict = {}
            if isinstance(competencies_json, str):
                competencies = json.loads(competencies_json)
            else:
                competencies = competencies_json
                
            for comp in competencies:
                comp_name = comp.get("name", "Unknown Competency")
                competency_dict[comp_name] = 5.0
                
            taxonomy_dict[role_key] = competency_dict
            
    except Exception as e:
        print(f"Error reading taxonomy from DB: {e}")
    finally:
        db.close()
        
    return taxonomy_dict
