# ---------------------------------------------
# TALENTLENS AI - EMBEDDING SERVICE
# ---------------------------------------------
#
# Creates text embeddings using the Gemini API (free tier,
# no credit card needed) instead of a local PyTorch model.
# This keeps the service small enough for free hosting.
#
# Required environment variable:
#   GEMINI_API_KEY   -> create at https://aistudio.google.com/apikey
#
# Optional:
#   EMBEDDING_MODEL  -> gemini-embedding-001
#   EMBEDDING_DIM    -> 768

import os
import time

import numpy as np
import requests
from dotenv import load_dotenv

load_dotenv()


EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIM", "768"))

BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

# The API accepts up to 100 texts per batch request
BATCH_SIZE = 100

# Gemini embeddings accept a limited number of tokens per text.
# ~8000 characters is a safe limit for resumes / job descriptions.
MAX_CHARS = 8000

REQUEST_TIMEOUT = 60


def _normalize(vectors: np.ndarray) -> np.ndarray:
    # Only 3072-dim vectors come pre-normalized, so normalize here
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return vectors / norms


def _post_with_retry(url: str, payload: dict, api_key: str):
    # Retry a few times on rate limits (429) or temporary errors (5xx)
    last_error = None

    for attempt in range(4):
        try:
            response = requests.post(
                url,
                headers={
                    "x-goog-api-key": api_key,
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=REQUEST_TIMEOUT
            )

            if response.status_code in (429, 500, 502, 503, 504):
                last_error = f"{response.status_code}: {response.text[:300]}"
                time.sleep(2 ** attempt)
                continue

            response.raise_for_status()
            return response.json()

        except requests.exceptions.RequestException as error:
            last_error = str(error)
            time.sleep(2 ** attempt)

    raise RuntimeError(f"Embedding API request failed: {last_error}")


def embed_texts(texts: list[str], task_type: str = "SEMANTIC_SIMILARITY"):
    """
    Return a normalized numpy array of shape (len(texts), EMBEDDING_DIM).

    task_type examples:
      SEMANTIC_SIMILARITY, RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY
    """

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set.")

    if not texts:
        return np.zeros((0, EMBEDDING_DIM))

    cleaned = [(t or " ")[:MAX_CHARS] for t in texts]

    all_vectors = []

    for start in range(0, len(cleaned), BATCH_SIZE):

        batch = cleaned[start:start + BATCH_SIZE]

        payload = {
            "requests": [
                {
                    "model": f"models/{EMBEDDING_MODEL}",
                    "content": {"parts": [{"text": text}]},
                    "taskType": task_type,
                    "outputDimensionality": EMBEDDING_DIM
                }
                for text in batch
            ]
        }

        data = _post_with_retry(
            f"{BASE_URL}/models/{EMBEDDING_MODEL}:batchEmbedContents",
            payload,
            api_key
        )

        embeddings = data.get("embeddings", [])

        if len(embeddings) != len(batch):
            raise RuntimeError("Embedding API returned an unexpected number of vectors.")

        all_vectors.extend(item["values"] for item in embeddings)

    return _normalize(np.array(all_vectors, dtype=np.float32))
