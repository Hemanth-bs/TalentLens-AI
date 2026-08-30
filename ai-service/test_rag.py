from services.ragService import (
    add_document,
    retrieve_relevant_chunks
)


# ---------------------------------------------
# SAMPLE JOB DESCRIPTION
# ---------------------------------------------

job_description = """
We are looking for a Full Stack Developer.

Required skills include:
React, JavaScript, Node.js, Express.js,
MongoDB, REST APIs and Git.

The candidate should have experience
building scalable web applications,
developing backend APIs and working
with databases.

Knowledge of Python and PostgreSQL
is also desirable.
"""


# ---------------------------------------------
# STORE THE JOB DESCRIPTION
# ---------------------------------------------

result = add_document(
    document_id="test_job_001",
    text=job_description,
    metadata={
        "type": "job_description",
        "role": "Full Stack Developer"
    }
)

print("\nDOCUMENT STORED")
print(result)


# ---------------------------------------------
# TEST RETRIEVAL
# ---------------------------------------------

query = """
Candidate has experience developing
React applications and Node.js REST APIs.
"""

results = retrieve_relevant_chunks(
    query=query,
    top_k=3
)


# ---------------------------------------------
# DISPLAY RESULTS
# ---------------------------------------------

print("\nRETRIEVED CHUNKS")
print("=" * 60)

for index, result in enumerate(
    results,
    start=1
):

    print(f"\nResult {index}")

    print("-" * 60)

    print("Distance:")
    print(result["distance"])

    print("\nMetadata:")
    print(result["metadata"])

    print("\nText:")
    print(result["text"])