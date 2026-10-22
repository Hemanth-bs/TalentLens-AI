# Calculate semantic similarity between resume and job description
# using hosted embeddings (no local ML model).

from services.embeddingService import embed_texts


def calculate_semantic_match(
    resume_text: str,
    job_description: str
):

    # Convert both texts into normalized embedding vectors
    vectors = embed_texts(
        [resume_text, job_description],
        task_type="SEMANTIC_SIMILARITY"
    )

    # Vectors are normalized, so dot product = cosine similarity
    similarity = float(vectors[0] @ vectors[1])

    # Keep the score within 0-100
    score = round(max(0.0, min(1.0, similarity)) * 100, 2)

    return {
        "semantic_score": score
    }
