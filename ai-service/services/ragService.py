# ---------------------------------------------
# TALENTLENS AI - RAG SERVICE
# ---------------------------------------------
#
# Stores document chunks + embeddings in MongoDB Atlas (free M0)
# so the RAG index survives restarts and redeploys on free hosts.
# Similarity search is done with numpy (fine for small datasets).
#
# Required environment variables:
#   MONGODB_URI       -> same Atlas connection string as the backend
#   GEMINI_API_KEY    -> used by embeddingService
#
# Optional:
#   RAG_DB_NAME       -> talentlens_rag
#   RAG_COLLECTION    -> rag_chunks

import os

import numpy as np
from dotenv import load_dotenv
from pymongo import MongoClient

from services.embeddingService import embed_texts

load_dotenv()


# ---------------------------------------------
# MONGODB (lazy connection)
# ---------------------------------------------

_collection = None

# Safety cap when searching across ALL documents
MAX_SCAN_CHUNKS = 5000


def get_collection():
    global _collection

    if _collection is None:

        uri = os.getenv("MONGODB_URI")

        if not uri:
            raise RuntimeError("MONGODB_URI environment variable is not set.")

        client = MongoClient(uri, serverSelectionTimeoutMS=10000)

        db = client[os.getenv("RAG_DB_NAME", "talentlens_rag")]

        collection = db[os.getenv("RAG_COLLECTION", "rag_chunks")]

        collection.create_index("document_id")

        _collection = collection

    return _collection


# ---------------------------------------------
# TEXT CHUNKING
# ---------------------------------------------

def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 100
):
    """
    Split long text into overlapping chunks.
    """

    if not text:
        return []

    words = text.split()

    chunks = []

    start = 0

    while start < len(words):

        end = start + chunk_size

        chunk = " ".join(words[start:end])

        if chunk.strip():
            chunks.append(chunk.strip())

        start += chunk_size - overlap

    return chunks


# ---------------------------------------------
# ADD DOCUMENT TO VECTOR STORE
# ---------------------------------------------

def add_document(
    document_id: str,
    text: str,
    metadata: dict | None = None
):
    """
    Chunk a document, generate embeddings and
    store the chunks in MongoDB.
    """

    if not text or not text.strip():
        raise ValueError("Document text cannot be empty")

    chunks = chunk_text(text)

    if not chunks:
        raise ValueError("No chunks could be generated")

    embeddings = embed_texts(
        chunks,
        task_type="RETRIEVAL_DOCUMENT"
    )

    documents = []

    for index, chunk in enumerate(chunks):

        chunk_metadata = {
            "document_id": document_id,
            "chunk_index": index
        }

        if metadata:
            chunk_metadata.update(metadata)

        documents.append({
            "_id": f"{document_id}_chunk_{index}",
            "document_id": document_id,
            "text": chunk,
            "metadata": chunk_metadata,
            "embedding": embeddings[index].tolist()
        })

    collection = get_collection()

    # Remove old chunks of this document first (re-indexing
    # a shorter text must not leave stale chunks behind)
    collection.delete_many({"document_id": document_id})

    collection.insert_many(documents)

    return {
        "document_id": document_id,
        "chunks_created": len(chunks)
    }


# ---------------------------------------------
# RETRIEVE RELEVANT DOCUMENT CHUNKS
# ---------------------------------------------

def retrieve_relevant_chunks(
    query: str,
    top_k: int = 5,
    document_id: str | None = None
):
    """
    Convert the query into an embedding and retrieve
    the most semantically relevant document chunks.

    If document_id is provided, retrieval is restricted
    to that specific document.
    """

    if not query or not query.strip():
        return []

    mongo_filter = {}

    if document_id:
        mongo_filter["document_id"] = document_id

    rows = list(
        get_collection()
        .find(mongo_filter)
        .limit(MAX_SCAN_CHUNKS)
    )

    if not rows:
        return []

    query_vector = embed_texts(
        [query],
        task_type="RETRIEVAL_QUERY"
    )[0]

    matrix = np.array(
        [row["embedding"] for row in rows],
        dtype=np.float32
    )

    # Normalized vectors -> dot product = cosine similarity
    similarities = matrix @ query_vector

    best = np.argsort(-similarities)[:top_k]

    retrieved_chunks = []

    for position in best:

        row = rows[int(position)]

        retrieved_chunks.append({
            "text": row["text"],
            "metadata": row.get("metadata", {}),
            # Cosine distance (lower = more similar)
            "distance": float(1.0 - similarities[int(position)])
        })

    return retrieved_chunks


# ---------------------------------------------
# BUILD RAG CONTEXT
# ---------------------------------------------

def build_rag_context(
    query: str,
    top_k: int = 5,
    document_id: str | None = None
):
    """
    Retrieve relevant chunks and combine them into
    a single context that can later be supplied
    to an LLM.

    If document_id is provided, only chunks from
    that document are retrieved.
    """

    retrieved_chunks = retrieve_relevant_chunks(
        query=query,
        top_k=top_k,
        document_id=document_id
    )

    if not retrieved_chunks:
        return {
            "context": "",
            "chunks": []
        }

    context_parts = []

    for index, chunk in enumerate(retrieved_chunks, start=1):

        context_parts.append(
            f"[Context {index}]\n"
            f"{chunk['text']}"
        )

    context = "\n\n".join(context_parts)

    return {
        "context": context,
        "chunks": retrieved_chunks
    }
