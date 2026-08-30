# ---------------------------------------------
# TALENTLENS AI - RAG SERVICE
# ---------------------------------------------

import chromadb
from sentence_transformers import SentenceTransformer


# ---------------------------------------------
# EMBEDDING MODEL
# ---------------------------------------------

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


# ---------------------------------------------
# CHROMA DATABASE
# ---------------------------------------------

chroma_client = chromadb.PersistentClient(
    path="./chroma_db"
)


# Create/get the collection used for TalentLens
collection = chroma_client.get_or_create_collection(
    name="talentlens_documents"
)


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

        chunk = " ".join(
            words[start:end]
        )

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
    store the chunks in ChromaDB.
    """

    if not text or not text.strip():
        raise ValueError(
            "Document text cannot be empty"
        )

    chunks = chunk_text(text)

    if not chunks:
        raise ValueError(
            "No chunks could be generated"
        )

    embeddings = embedding_model.encode(
        chunks
    ).tolist()

    ids = [
        f"{document_id}_chunk_{index}"
        for index in range(len(chunks))
    ]

    metadatas = []

    for index in range(len(chunks)):

        chunk_metadata = {
            "document_id": document_id,
            "chunk_index": index
        }

        if metadata:
            chunk_metadata.update(
                metadata
            )

        metadatas.append(
            chunk_metadata
        )

    collection.upsert(
        ids=ids,
        documents=chunks,
        embeddings=embeddings,
        metadatas=metadatas
    )

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

    query_embedding = embedding_model.encode(
        [query]
    ).tolist()

    # -----------------------------------------
    # BUILD DOCUMENT FILTER
    # -----------------------------------------

    where_filter = None

    if document_id:
        where_filter = {
            "document_id": document_id
        }

    # -----------------------------------------
    # RETRIEVE FROM CHROMADB
    # -----------------------------------------

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        where=where_filter
    )

    documents = results.get(
        "documents",
        [[]]
    )[0]

    metadatas = results.get(
        "metadatas",
        [[]]
    )[0]

    distances = results.get(
        "distances",
        [[]]
    )[0]

    retrieved_chunks = []

    for index, document in enumerate(documents):

        retrieved_chunks.append({

            "text": document,

            "metadata": (
                metadatas[index]
                if index < len(metadatas)
                else {}
            ),

            "distance": (
                distances[index]
                if index < len(distances)
                else None
            )

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

    for index, chunk in enumerate(
        retrieved_chunks,
        start=1
    ):

        context_parts.append(
            f"[Context {index}]\n"
            f"{chunk['text']}"
        )

    context = "\n\n".join(
        context_parts
    )

    return {
        "context": context,
        "chunks": retrieved_chunks
    }