# ---------------------------------------------
# TALENTLENS AI - LLM SERVICE
# ---------------------------------------------

import json
import urllib.request
import urllib.error


# ---------------------------------------------
# OLLAMA CONFIGURATION
# ---------------------------------------------

OLLAMA_URL = "http://localhost:11434/api/generate"

MODEL_NAME = "llama3.2:3b"


# ---------------------------------------------
# GENERATE LLM RESPONSE
# ---------------------------------------------

def generate_llm_response(prompt: str) -> str:

    # Check that the prompt contains something
    if not prompt or not prompt.strip():
        raise ValueError(
            "Prompt cannot be empty."
        )

    # Data that will be sent to Ollama
    request_data = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False
    }

    # Convert Python dictionary into JSON
    json_data = json.dumps(
        request_data
    ).encode("utf-8")

    # Create HTTP request
    request = urllib.request.Request(
        OLLAMA_URL,
        data=json_data,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:

        # Send request to local Ollama server
        with urllib.request.urlopen(
            request,
            timeout=120
        ) as response:

            # Read Ollama response
            response_data = response.read().decode(
                "utf-8"
            )

        # Convert JSON response into Python dictionary
        result = json.loads(
            response_data
        )

        # Return only the generated text
        return result.get(
            "response",
            ""
        )

    except urllib.error.URLError as error:

        raise RuntimeError(
            f"Could not connect to Ollama: {error}"
        )