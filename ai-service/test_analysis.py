from services.analysisService import analyze_resume
from services.aiMatchingService import calculate_ai_match


resume = """
Candidate has Python, Flask, MySQL and Git experience.
"""

job_description = """
Backend Developer requiring Python, FastAPI, PostgreSQL, Docker and Git.
"""

document_id = "job_test_002"


# ---------------------------------------------
# CALCULATE MATCH
# ---------------------------------------------

match = calculate_ai_match(
    resume,
    job_description
)


# ---------------------------------------------
# CALCULATE ANALYSIS
# ---------------------------------------------

result = analyze_resume(
    resume_text=resume,
    job_description=job_description,
    document_id=document_id
)

analysis = result["analysis"]


# ---------------------------------------------
# FORMATTED OUTPUT
# ---------------------------------------------

print()
print("=" * 60)
print("           TALENTLENS AI - RESUME ANALYSIS")
print("=" * 60)

print()
print("MATCH SCORE")
print("-" * 60)

print(f"Final Score       : {match['final_score']:.2f}%")
print(f"Skill Score       : {match['skill_score']:.2f}%")
print(f"Keyword Score     : {match['keyword_score']:.2f}%")
print(f"Semantic Score    : {match['semantic_score']:.2f}%")

print()
print("MATCHED SKILLS")
print("-" * 60)

for skill in analysis["matched_skills"]:
    print(f"✓ {skill}")

print()
print("MISSING SKILLS")
print("-" * 60)

for skill in analysis["missing_skills"]:
    print(f"✗ {skill}")

print()
print("TRANSFERABLE SKILLS")
print("-" * 60)

for item in analysis["transferable_skills"]:

    if isinstance(item, dict):

        print(
            f"→ {item['candidate_skill']}"
            f"  →  {item['required_skill']}"
        )

    else:

        print(f"→ {item}")

print()
print("RELEVANT EXPERIENCE")
print("-" * 60)

for item in analysis["relevant_experience"]:
    print(f"• {item}")

print()
print("STRENGTHS")
print("-" * 60)

for item in analysis["strengths"]:
    print(f"• {item}")

print()
print("AREAS FOR IMPROVEMENT")
print("-" * 60)

for item in analysis["areas_for_improvement"]:
    print(f"• {item}")

print()
print("HR RECOMMENDATION")
print("-" * 60)

print(analysis["hr_recommendation"])

print()
print("CANDIDATE FEEDBACK")
print("-" * 60)

print(analysis["candidate_feedback"])

print()
print("RAG EVIDENCE")
print("-" * 60)

for index, chunk in enumerate(
    result["rag_chunks"],
    start=1
):

    print(f"[{index}]")

    print(
        f"Role: "
        f"{chunk['metadata'].get('role', 'N/A')}"
    )

    print(
        f"Document: "
        f"{chunk['metadata'].get('document_id', 'N/A')}"
    )

    print(f"Text: {chunk['text']}")

print()
print("=" * 60)