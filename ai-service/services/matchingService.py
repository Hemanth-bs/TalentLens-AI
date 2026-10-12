from services.textProcessor import clean_text

STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "if", "then", "than",
    "with", "without", "for", "from", "into", "onto", "of", "in",
    "on", "at", "by", "to", "as", "is", "are", "was", "were",
    "be", "been", "being", "this", "that", "these", "those", "it",
    "its", "their", "they", "them", "we", "you", "your", "our",
    "has", "have", "had", "will", "can", "should", "would", "could",
    "must", "candidate", "experience", "experienced", "requiring",
    "required", "requirement", "requirements"
}

WORD_NORMALIZATION = {
    "apis": "api"
}


def normalize_words(text):
    cleaned_text = clean_text(text)
    words = cleaned_text.split()
    normalized_words = set()

    for word in words:
        word = word.strip(".,;:!?()[]{}")
        if not word:
            continue

        if word in STOP_WORDS:
            continue

        word = WORD_NORMALIZATION.get(word, word)
        normalized_words.add(word)

    return normalized_words


def calculate_keyword_match(resume_text, job_description):
    resume_words = normalize_words(resume_text)
    job_words = normalize_words(job_description)

    matched_words = resume_words.intersection(job_words)
    score = round((len(matched_words) / len(job_words)) * 100, 2) if job_words else 0

    return {
        "score": score,
        "matched_words": sorted(matched_words)
    }
