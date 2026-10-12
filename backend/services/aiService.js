// ---------------------------------------------
// TALENTLENS AI - AI SERVICE
// ---------------------------------------------

// FastAPI AI service URL
const AI_SERVICE_URL = "http://127.0.0.1:8000";
// ---------------------------------------------
// GET BASIC AI MATCH
// ---------------------------------------------

const getAIMatch = async (
    resumeText,
    jobDescription
) => {

    const response = await fetch(
        `${AI_SERVICE_URL}/match`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                resume_text: resumeText,
                job_description: jobDescription
            })
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `AI service returned status ${response.status}: ${errorText}`
        );
    }


    const data =
        await response.json();


    return data;
};


// ---------------------------------------------
// GET COMPLETE AI ANALYSIS
// ---------------------------------------------

const getAIAnalysis = async (
    resumeText,
    jobDescription,
    documentId
) => {

    const response = await fetch(
        `${AI_SERVICE_URL}/analyze`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                resume_text:
                    resumeText,

                job_description:
                    jobDescription,

                document_id:
                    documentId
            })
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `AI analysis service returned status ${response.status}: ${errorText}`
        );
    }


    const data =
        await response.json();


    return data;
};


// ---------------------------------------------
// INDEX DOCUMENT INTO RAG
// ---------------------------------------------

const indexDocument = async (
    documentId,
    text,
    metadata = {}
) => {

    const response = await fetch(
        `${AI_SERVICE_URL}/rag/index`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                document_id:
                    documentId,

                text:
                    text,

                metadata:
                    metadata
            })
        }
    );


    if (!response.ok) {

        const errorText =
            await response.text();

        throw new Error(
            `RAG indexing service returned status ${response.status}: ${errorText}`
        );
    }


    const data =
        await response.json();


    return data;
};


// ---------------------------------------------
// EXPORT FUNCTIONS
// ---------------------------------------------

module.exports = {

    // Basic AI matching
    getAIMatch,

    // Complete AI + RAG + LLM analysis
    getAIAnalysis,

    // RAG document indexing
    indexDocument
};