# ---------------------------------------------
# TALENTLENS AI - AI MATCHING SERVICE
# ---------------------------------------------

# Import keyword matching
from services.matchingService import (
    calculate_keyword_match
)

# Import semantic matching
from services.semanticMatchingService import (
    calculate_semantic_match
)

# Import skill matching
from services.skillMatchingService import (
    calculate_skill_match
)


# ---------------------------------------------
# CALCULATE COMPLETE AI MATCH
# ---------------------------------------------

def calculate_ai_match(
    resume_text: str,
    job_description: str
):

    # -----------------------------------------
    # 1. KEYWORD MATCHING
    # -----------------------------------------

    keyword_result = calculate_keyword_match(
        resume_text,
        job_description
    )

    keyword_score = float(
        keyword_result["score"]
    )


    # -----------------------------------------
    # 2. SEMANTIC MATCHING
    # -----------------------------------------

    semantic_result = calculate_semantic_match(
        resume_text,
        job_description
    )

    semantic_score = float(
        semantic_result["semantic_score"]
    )


    # -----------------------------------------
    # 3. SKILL MATCHING
    # -----------------------------------------

    skill_result = calculate_skill_match(
        resume_text,
        job_description
    )

    skill_score = float(
        skill_result["skill_score"]
    )


    # -----------------------------------------
    # 4. FINAL AI SCORE
    # -----------------------------------------

    # Skill matching gets the highest weight because
    # it directly compares candidate skills with
    # job-required skills.
    #
    # Semantic matching identifies meaning/context.
    #
    # Keyword matching provides additional
    # exact-word evidence.

    final_score = round(
        (skill_score * 0.50)
        +
        (semantic_score * 0.35)
        +
        (keyword_score * 0.15),
        2
    )


    # -----------------------------------------
    # 5. RETURN COMPLETE MATCH RESULT
    # -----------------------------------------

    return {

        # Overall AI matching score
        "final_score": final_score,

        # Individual scores
        "skill_score": skill_score,
        "semantic_score": semantic_score,
        "keyword_score": keyword_score,

        # Keyword evidence
        "matched_words":
            keyword_result["matched_words"],

        # Skill evidence
        "candidate_skills":
            skill_result["candidate_skills"],

        "required_skills":
            skill_result["required_skills"],

        "matched_skills":
            skill_result["matched_skills"],

        "missing_skills":
            skill_result["missing_skills"],

        # Transferable skills are kept separate
        # and are NOT counted as direct matches.
        "transferable_skills":
            skill_result["transferable_skills"]
    }