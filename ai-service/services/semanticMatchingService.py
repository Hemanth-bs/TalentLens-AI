# Import the SentenceTransformer model
from sentence_transformers import SentenceTransformer

# Import cosine similarity to compare two vectors
from sklearn.metrics.pairwise import cosine_similarity


# Load a pretrained sentence-embedding model
# It converts text into numerical vectors representing meaning
model = SentenceTransformer("all-MiniLM-L6-v2")


# Calculate semantic similarity between resume and job description
def calculate_semantic_match(
    resume_text: str,
    job_description: str
):

    # Convert both texts into embedding vectors
    resume_embedding = model.encode([resume_text])
    job_embedding = model.encode([job_description])

    # Compare the two vectors using cosine similarity
    similarity = cosine_similarity(
        resume_embedding,
        job_embedding
    )[0][0]

    # Convert similarity from 0-1 into a percentage
    score = round(similarity * 100, 2)

    return {
        "semantic_score": score
    }