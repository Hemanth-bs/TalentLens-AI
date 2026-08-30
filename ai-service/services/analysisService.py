# ---------------------------------------------
# TALENTLENS AI - ANALYSIS SERVICE
# ---------------------------------------------

import json

from services.ragService import build_rag_context
from services.llmService import generate_llm_response


# ---------------------------------------------
# VALIDATE LLM ANALYSIS
# ---------------------------------------------

def validate_analysis(
    analysis: dict,
    match_result: dict
):
    """
    Validate the LLM output against the deterministic
    matching results.

    Python matching results are treated as the source
    of truth for skill matching.
    """

    # -----------------------------------------
    # FORCE MATCHED SKILLS
    # -----------------------------------------

    analysis["matched_skills"] = (
        match_result["matched_skills"]
    )


    # -----------------------------------------
    # FORCE MISSING SKILLS
    # -----------------------------------------

    analysis["missing_skills"] = (
        match_result["missing_skills"]
    )


    # -----------------------------------------
    # FORCE TRANSFERABLE SKILLS
    # -----------------------------------------

    analysis["transferable_skills"] = (
        match_result["transferable_skills"]
    )


    # -----------------------------------------
    # AREAS FOR IMPROVEMENT
    # -----------------------------------------

    areas = analysis.get(
        "areas_for_improvement",
        []
    )

    if not isinstance(areas, list):
        areas = []


    for skill in match_result["missing_skills"]:

        skill_found = any(
            skill.lower() in str(area).lower()
            for area in areas
        )

        if not skill_found:

            areas.append(
                f"Develop experience with {skill}"
            )


    analysis["areas_for_improvement"] = areas


    # -----------------------------------------
    # REQUIRED FIELDS
    # -----------------------------------------

    required_fields = [
        "matched_skills",
        "missing_skills",
        "transferable_skills",
        "relevant_experience",
        "strengths",
        "areas_for_improvement",
        "hr_recommendation",
        "candidate_feedback"
    ]


    for field in required_fields:

        if field not in analysis:

            raise ValueError(
                f"Analysis missing required field: {field}"
            )


    return analysis


# ---------------------------------------------
# ANALYZE RESUME AGAINST JOB
# ---------------------------------------------

def analyze_resume(
    resume_text: str,
    job_description: str,
    document_id: str,
    match_result: dict
):

    # -----------------------------------------
    # 1. RETRIEVE RELEVANT RAG CONTEXT
    # -----------------------------------------

    rag_result = build_rag_context(
        query=job_description,
        top_k=3,
        document_id=document_id
    )

    rag_context = rag_result["context"]


    # -----------------------------------------
    # 2. PREPARE MATCHING EVIDENCE
    # -----------------------------------------

    matching_evidence = {
        "final_score":
            match_result["final_score"],

        "skill_score":
            match_result["skill_score"],

        "semantic_score":
            match_result["semantic_score"],

        "keyword_score":
            match_result["keyword_score"],

        "candidate_skills":
            match_result["candidate_skills"],

        "required_skills":
            match_result["required_skills"],

        "matched_skills":
            match_result["matched_skills"],

        "missing_skills":
            match_result["missing_skills"],

        "transferable_skills":
            match_result["transferable_skills"]
    }


    matching_evidence_json = json.dumps(
        matching_evidence,
        indent=2
    )


    # -----------------------------------------
    # 3. BUILD GROUNDED LLM PROMPT
    # -----------------------------------------

    prompt = f"""
You are TalentLens AI, an evidence-grounded HR analysis assistant.

Analyze ONE candidate resume against ONE current job description.

The Python matching engine has already calculated the
matching results.

You are responsible for EXPLAINING those results.

You are NOT responsible for recalculating them.


---------------------------------------------
CANDIDATE RESUME
---------------------------------------------

{resume_text}


---------------------------------------------
CURRENT JOB DESCRIPTION
---------------------------------------------

{job_description}


---------------------------------------------
CALCULATED MATCHING EVIDENCE
---------------------------------------------

{matching_evidence_json}


---------------------------------------------
RETRIEVED RAG KNOWLEDGE
---------------------------------------------

{rag_context}


---------------------------------------------
STRICT GROUNDING RULES
---------------------------------------------

1. CALCULATED MATCHING EVIDENCE is the source of truth.

2. Do NOT change matched_skills.

3. Do NOT change missing_skills.

4. Do NOT change transferable_skills.

5. Never convert a transferable skill into a direct match.

6. Flask -> FastAPI means Flask is transferable,
   NOT that the candidate has FastAPI.

7. MySQL -> PostgreSQL means MySQL is transferable,
   NOT that the candidate has PostgreSQL.

8. Candidate skills must be supported by the resume.

9. Job requirements must come from the current job description.

10. RAG knowledge is supporting context only.

11. RAG knowledge is NOT evidence of candidate experience.

12. Never invent:
    - skills
    - technologies
    - projects
    - certifications
    - education
    - achievements
    - work experience

13. Do not use information from unrelated documents.

14. Discuss ALL missing skills under areas_for_improvement.

15. If evidence is insufficient, say:
    "Not enough evidence."


---------------------------------------------
RETURN FORMAT
---------------------------------------------

Return ONLY valid JSON.

Do NOT use Markdown.

Do NOT use ```json.

Do NOT write anything before or after the JSON.

Use exactly this structure:

{{
    "matched_skills": [],
    "missing_skills": [],
    "transferable_skills": [],
    "relevant_experience": [],
    "strengths": [],
    "areas_for_improvement": [],
    "hr_recommendation": "",
    "candidate_feedback": ""
}}


---------------------------------------------
FIELD RULES
---------------------------------------------

matched_skills:

Use the calculated matched_skills exactly.


missing_skills:

Use the calculated missing_skills exactly.


transferable_skills:

Use the calculated transferable_skills exactly.

Do not treat them as direct matches.


relevant_experience:

Mention only experience explicitly supported
by the candidate resume.


strengths:

Mention strengths supported by the resume
and relevant to the job.


areas_for_improvement:

Discuss ALL calculated missing skills.


hr_recommendation:

Give a cautious recommendation based only on:

- Candidate Resume
- Current Job Description
- Calculated Match Evidence


candidate_feedback:

Give useful feedback based on:

- matched skills
- missing skills
- transferable skills
- candidate resume


---------------------------------------------
FINAL VALIDATION
---------------------------------------------

Before returning JSON, verify:

matched_skills == calculated matched_skills

missing_skills == calculated missing_skills

transferable_skills == calculated transferable_skills

Every candidate skill is supported by the resume.

Every missing skill comes from the job description.

No transferable skill is treated as identical.

RAG knowledge is not treated as candidate evidence.

All missing skills are discussed in areas_for_improvement.

Return ONLY JSON.
"""


    # -----------------------------------------
    # 4. GENERATE LLM ANALYSIS
    # -----------------------------------------

    llm_response = generate_llm_response(
        prompt
    )


    # -----------------------------------------
    # 5. PARSE JSON RESPONSE
    # -----------------------------------------

    try:

        analysis = json.loads(
            llm_response
        )

    except json.JSONDecodeError as error:

        raise ValueError(
            "LLM returned invalid JSON. "
            f"Raw response: {llm_response}"
        ) from error


    # -----------------------------------------
    # 6. VALIDATE LLM OUTPUT
    # -----------------------------------------

    analysis = validate_analysis(
        analysis,
        match_result
    )


    # -----------------------------------------
    # 7. RETURN RESULT
    # -----------------------------------------

    return {
        "analysis": analysis,
        "rag_chunks": rag_result["chunks"]
    }