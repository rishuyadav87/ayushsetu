import os
import sys

# Ensure ai-engine directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.data.db import SessionLocal
from app.services.scoring import match_opportunities_for_student
from sqlalchemy import text

def test_matching():
    db = SessionLocal()
    try:
        # Get student user
        student_user = db.execute(text("SELECT id, name, email FROM \"User\" WHERE email = 'student@ayush.edu'")).fetchone()
        if not student_user:
            print("ERROR: student@ayush.edu not found!")
            return

        student_id = student_user[0]
        print(f"\n================================================================================")
        print(f"TEST 1: Student targeting 'Ayurveda Dietician' (NSQF Level 5, HSS/Q3902)")
        print(f"================================================================================")

        matches_diet = match_opportunities_for_student(user_id=student_id, target_role="Ayurveda Dietician")

        for i, m in enumerate(matches_diet, 1):
            print(f"Rank {i}: {m['title']}")
            print(f"  Final Match Score:       {m['match_score']:.3f}")
            print(f"  Semantic Similarity:     {m['semantic_similarity']:.3f}")
            print(f"  Eligibility Score:       {m['eligibility_score']:.3f}")
            print(f"  Is Eligible:             {m['is_eligible']}")
            print(f"  Explainable Reasons:")
            for r in m['match_reasons']:
                print(f"    - {r}")
            print("-" * 80)

        scores_diet = [m['match_score'] for m in matches_diet]
        assert len(set(scores_diet)) == len(scores_diet), "ERROR: Tie detected in match scores!"
        assert "Dietician" in matches_diet[0]['title'], "ERROR: Top match must be Dietician opportunity!"
        print(f"PASS: Dietician test passed with differentiated scores: {scores_diet}")

        print(f"\n================================================================================")
        print(f"TEST 2: Student targeting 'Panchakarma Technician' (NSQF Level 4, HSS/Q3601)")
        print(f"================================================================================")

        matches_pancha = match_opportunities_for_student(user_id=student_id, target_role="Panchakarma Technician")
        for i, m in enumerate(matches_pancha, 1):
            print(f"Rank {i}: {m['title']}")
            print(f"  Final Match Score:       {m['match_score']:.3f}")
            print(f"  Semantic Similarity:     {m['semantic_similarity']:.3f}")
            print(f"  Eligibility Score:       {m['eligibility_score']:.3f}")
            print(f"  Is Eligible:             {m['is_eligible']}")
            print(f"  Explainable Reasons:")
            for r in m['match_reasons']:
                print(f"    - {r}")
            print("-" * 80)

        scores_pancha = [m['match_score'] for m in matches_pancha]
        assert len(set(scores_pancha)) == len(scores_pancha), "ERROR: Tie detected in match scores!"
        assert "Panchakarma" in matches_pancha[0]['title'], "ERROR: Top match must be Panchakarma opportunity!"
        print(f"PASS: Panchakarma test passed with differentiated scores: {scores_pancha}")

        print(f"\n================================================================================")
        print(f"TEST 3: Student targeting 'Ayurveda Ahar and Poshan Sahayak' (NSQF Level 3, HSS/Q3901)")
        print(f"================================================================================")

        matches_poshan = match_opportunities_for_student(user_id=student_id, target_role="Ayurveda Ahar and Poshan Sahayak")
        for i, m in enumerate(matches_poshan, 1):
            print(f"Rank {i}: {m['title']}")
            print(f"  Final Match Score:       {m['match_score']:.3f}")
            print(f"  Semantic Similarity:     {m['semantic_similarity']:.3f}")
            print(f"  Eligibility Score:       {m['eligibility_score']:.3f}")
            print(f"  Is Eligible:             {m['is_eligible']}")
            print(f"  Explainable Reasons:")
            for r in m['match_reasons']:
                print(f"    - {r}")
            print("-" * 80)

        scores_poshan = [m['match_score'] for m in matches_poshan]
        assert len(set(scores_poshan)) == len(scores_poshan), "ERROR: Tie detected in match scores!"
        assert "Poshan" in matches_poshan[0]['title'] or "Kitchen" in matches_poshan[0]['title'], "ERROR: Top match must be Poshan opportunity!"
        print(f"PASS: Poshan Sahayak test passed with differentiated scores: {scores_poshan}")

        print("\nALL SEMANTIC MATCHING & DIFFERENTIATION TESTS PASSED SUCCESSFULLY!")
    finally:
        db.close()

if __name__ == "__main__":
    test_matching()
