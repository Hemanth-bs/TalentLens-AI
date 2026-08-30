# ---------------------------------------------
# TALENTLENS AI - KEYWORD MATCHING SERVICE
# ---------------------------------------------

from services.textProcessor import clean_text


# ---------------------------------------------
# COMMON WORDS TO IGNORE
# ---------------------------------------------

STOP_WORDS = {
    "a", "an", "the",
    "and", "or", "but",
    "if", "then", "than",
    "with", "without",
    "for", "from",
    "into", "onto",
    "of", "in", "on",
    "at", "by", "to",
    "as", "is", "are",
    "was", "were",
    "be", "been", "being",
    "this", "that", "these", "those",
    "it", "its",
    "their", "they", "them",
    "we", "you", "your", "our",
    "has", "have", "had",
    "will", "can", "should",
    "would", "could", "must",

    # Resume/JD filler words
    "candidate",
    "experience",
    "experienced",
    "requiring",
    "required",
    "requirement",
    "requirements"
}


# ---------------------------------------------
# NORMALIZE WORDS
# ---------------------------------------------

def normalize_words(text: str):

    cleaned_text = clean_text(text)

    words = cleaned_text.split()

    normalized_words = set()

    for word in words:

        # Remove punctuation around individual words
        word = word.strip(".,;:!?()[]{}")

        if not word:
            continue

        if word in STOP_WORDS:
            continue

        normalized_words.add(word)

    return normalized_words


# ---------------------------------------------
# CALCULATE KEYWORD MATCH
# ---------------------------------------------

def calculate_keyword_match(
    resume_text: str,
    job_description: str
):

    # -----------------------------------------
    # EXTRACT MEANINGFUL WORDS
    # -----------------------------------------

    resume_words = normalize_words(
        resume_text
    )

    job_words = normalize_words(
        job_description
    )


    # -----------------------------------------
    # FIND EXACT MATCHES
    # -----------------------------------------

    matched_words = (
        resume_words.intersection(
            job_words
        )
    )


    # -----------------------------------------
    # CALCULATE SCORE
    # -----------------------------------------

    if len(job_words) == 0:

        score = 0

    else:

        score = round(
            (
                len(matched_words)
                /
                len(job_words)
            ) * 100,
            2
        )


    # -----------------------------------------
    # RETURN RESULT
    # -----------------------------------------

    return {
        "score": score,
        "matched_words": sorted(
            matched_words
        )
    }