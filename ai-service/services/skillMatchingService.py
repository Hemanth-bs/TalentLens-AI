# ---------------------------------------------
# TALENTLENS AI - SKILL MATCHING SERVICE
# ---------------------------------------------

from services.textProcessor import clean_text


# ---------------------------------------------
# SKILL LIBRARY
# ---------------------------------------------

SKILL_LIBRARY = {
    # Programming languages
    "python",
    "java",
    "c",
    "c++",
    "c#",
    "javascript",
    "typescript",
    "kotlin",
    "swift",
    "go",
    "rust",
    "php",

    # Frontend
    "html",
    "css",
    "react",
    "angular",
    "vue",
    "next.js",

    # Backend
    "node.js",
    "express.js",
    "fastapi",
    "flask",
    "django",
    "spring",
    "spring boot",

    # Databases
    "mysql",
    "postgresql",
    "mongodb",
    "oracle",
    "redis",
    "sqlite",

    # Cloud / DevOps
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "git",
    "github",
    "gitlab",
    "jenkins",

    # APIs / Architecture
    "rest api",
    "rest apis",
    "graphql",
    "microservices",

    # AI / ML
    "machine learning",
    "deep learning",
    "artificial intelligence",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "pandas",
    "numpy",

    # Other common technical skills
    "linux",
    "sql",
    "power bi",
    "tableau"
}


# ---------------------------------------------
# RELATED / TRANSFERABLE SKILLS
# ---------------------------------------------

TRANSFERABLE_SKILLS = {

    "flask": {
        "fastapi",
        "django"
    },

    "fastapi": {
        "flask",
        "django"
    },

    "django": {
        "flask",
        "fastapi"
    },

    "mysql": {
        "postgresql",
        "sqlite",
        "oracle"
    },

    "postgresql": {
        "mysql",
        "sqlite",
        "oracle"
    },

    "mongodb": {
        "mysql",
        "postgresql"
    },

    "react": {
        "next.js"
    },

    "javascript": {
        "typescript",
        "node.js",
        "react"
    },

    "typescript": {
        "javascript"
    },

    "node.js": {
        "javascript",
        "express.js"
    },

    "express.js": {
        "node.js"
    }
}


# ---------------------------------------------
# EXTRACT SKILLS FROM TEXT
# ---------------------------------------------

def extract_skills(text: str):

    if not text or not text.strip():
        return []

    cleaned_text = clean_text(text)

    found_skills = []

    # Check longer skills first
    # so multi-word skills are handled properly.
    sorted_skills = sorted(
        SKILL_LIBRARY,
        key=len,
        reverse=True
    )

    for skill in sorted_skills:

        # Create a regular expression that matches
        # the complete skill instead of a substring.
        #
        # Example:
        # "c" should match "C"
        # but NOT "candidate"
        #
        # "sql" should match "SQL"
        # but NOT "MySQL"

        pattern = rf"(?<![a-z0-9]){skill}(?![a-z0-9])"

        import re

        if re.search(
            pattern,
            cleaned_text
        ):

            found_skills.append(
                skill
            )

    return sorted(
        set(found_skills)
    )

# ---------------------------------------------
# CALCULATE SKILL MATCH
# ---------------------------------------------

def calculate_skill_match(
    resume_text: str,
    job_description: str
):

    # -----------------------------------------
    # EXTRACT CANDIDATE SKILLS
    # -----------------------------------------

    resume_skills = set(
        extract_skills(
            resume_text
        )
    )


    # -----------------------------------------
    # EXTRACT JOB REQUIREMENTS
    # -----------------------------------------

    job_skills = set(
        extract_skills(
            job_description
        )
    )


    # -----------------------------------------
    # DIRECT MATCHES
    # -----------------------------------------

    matched_skills = (
        resume_skills.intersection(
            job_skills
        )
    )


    # -----------------------------------------
    # MISSING SKILLS
    # -----------------------------------------

    missing_skills = (
        job_skills - resume_skills
    )


    # -----------------------------------------
    # TRANSFERABLE SKILLS
    # -----------------------------------------

    transferable_skills = []

    for candidate_skill in resume_skills:

        related_skills = (
            TRANSFERABLE_SKILLS.get(
                candidate_skill,
                set()
            )
        )

        for required_skill in related_skills:

            if required_skill in job_skills:

                transferable_skills.append(
                    {
                        "candidate_skill": candidate_skill,
                        "required_skill": required_skill
                    }
                )


    # -----------------------------------------
    # CALCULATE SKILL SCORE
    # -----------------------------------------

    if len(job_skills) == 0:

        skill_score = 0

    else:

        skill_score = round(
            (
                len(matched_skills)
                /
                len(job_skills)
            ) * 100,
            2
        )


    # -----------------------------------------
    # RETURN RESULT
    # -----------------------------------------

    return {

        "skill_score": skill_score,

        "candidate_skills": sorted(
            resume_skills
        ),

        "required_skills": sorted(
            job_skills
        ),

        "matched_skills": sorted(
            matched_skills
        ),

        "missing_skills": sorted(
            missing_skills
        ),

        "transferable_skills":
            transferable_skills
    }