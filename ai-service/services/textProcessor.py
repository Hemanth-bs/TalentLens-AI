# Regular expressions help us clean unwanted characters and spaces
import re


# Clean resume or job-description text before AI processing
def clean_text(text: str) -> str:

    # Convert the input to lowercase
    text = text.lower()

    # Replace multiple spaces/newlines with a single space
    text = re.sub(r"\s+", " ", text)

    # Remove unnecessary special characters
    text = re.sub(r"[^a-z0-9+#.\- ]", "", text)

    # Remove leading and trailing spaces
    return text.strip()