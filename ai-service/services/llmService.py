# ---------------------------------------------
# TALENTLENS AI - LLM SERVICE
# ---------------------------------------------
#
# Uses a hosted, OpenAI-compatible chat completions API
# (Groq by default) instead of a local Ollama server, so it
# works on cloud hosts such as Hugging Face Spaces or Render.
#
# Required environment variable:
#   LLM_API_KEY      -> your provider API key
#
# Optional environment variables (defaults shown):
#   LLM_BASE_URL     -> https://api.groq.com/openai/v1
#   LLM_MODEL        -> llama-3.1-8b-instant
#   LLM_TIMEOUT      -> 60   (seconds)
#
# To switch provider, only change the env vars. Examples:
#   OpenAI: LLM_BASE_URL=https://api.openai.com/v1   LLM_MODEL=gpt-4o-mini
#   Groq:   LLM_BASE_URL=https://api.groq.com/openai/v1
#
# Check your provider's docs for current model names.

import os

import requests
from dotenv import load_dotenv

# Load variables from a local .env file (ignored if not present)
load_dotenv()


# ---------------------------------------------
# LLM CONFIGURATION
# ---------------------------------------------

LLM_BASE_URL = os.getenv(
    "LLM_BASE_URL",
    "https://api.groq.com/openai/v1"
).rstrip("/")

MODEL_NAME = os.getenv(
    "LLM_MODEL",
    "llama-3.1-8b-instant"
)

REQUEST_TIMEOUT = int(
    os.getenv("LLM_TIMEOUT", "60")
)


# ---------------------------------------------
# GENERATE LLM RESPONSE
# ---------------------------------------------

def generate_llm_response(prompt: str) -> str:

    # Check that the prompt contains something
    if not prompt or not prompt.strip():
        raise ValueError(
            "Prompt cannot be empty."
        )

    # Read the key at call time so the service can start
    # even if the key is missing (e.g. when running tests)
    api_key = os.getenv("LLM_API_KEY")

    if not api_key:
        raise RuntimeError(
            "LLM_API_KEY environment variable is not set."
        )

    # Data that will be sent to the LLM provider
    request_data = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.2
    }

    try:

        # Send request to the hosted LLM API
        response = requests.post(
            f"{LLM_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json=request_data,
            timeout=REQUEST_TIMEOUT
        )

        # Raise an error for 4xx / 5xx responses
        response.raise_for_status()

        result = response.json()

        # Return only the generated text
        return (
            result["choices"][0]["message"]["content"]
            or ""
        )

    except requests.exceptions.HTTPError as error:

        # Include the provider's error message to ease debugging
        details = ""
        if error.response is not None:
            details = error.response.text[:500]

        raise RuntimeError(
            f"LLM API returned an error: {error} {details}"
        )

    except requests.exceptions.RequestException as error:

        raise RuntimeError(
            f"Could not connect to LLM API: {error}"
        )

    except (KeyError, IndexError, ValueError) as error:

        raise RuntimeError(
            f"Unexpected response format from LLM API: {error}"
        )
