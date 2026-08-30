# ---------------------------------------------
# TALENTLENS AI - REQUEST SCHEMAS
# ---------------------------------------------

from pydantic import BaseModel


# ---------------------------------------------
# MATCH + AI ANALYSIS REQUEST
# ---------------------------------------------

class MatchRequest(BaseModel):

    # Unique ID of the job/document being analyzed.
    #
    # This allows RAG to retrieve information only
    # from the correct job description.
    #
    # Example:
    # job_test_002
    document_id: str

    # Complete extracted resume text
    resume_text: str

    # Complete job description text
    job_description: str


# ---------------------------------------------
# RAG DOCUMENT INDEX REQUEST
# ---------------------------------------------

class RagIndexRequest(BaseModel):

    # Unique ID for the document.
    #
    # Examples:
    # job_123
    # resume_456
    document_id: str

    # Complete text that should be indexed
    text: str

    # Optional information associated with
    # the document.
    #
    # Example:
    # {
    #     "type": "job_description",
    #     "role": "Backend Developer"
    # }
    metadata: dict | None = None


# ---------------------------------------------
# RAG RETRIEVAL REQUEST
# ---------------------------------------------

class RagRetrieveRequest(BaseModel):

    # Question/query used to search the
    # vector database.
    query: str

    # Number of relevant chunks to retrieve.
    top_k: int = 5