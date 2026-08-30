# ---------------------------------------------
# TALENTLENS AI - FASTAPI SERVICE
# ---------------------------------------------

# Import FastAPI to create our API server
from fastapi import FastAPI


# ---------------------------------------------
# IMPORT REQUEST SCHEMAS
# ---------------------------------------------

from schemas import (
    MatchRequest,
    RagIndexRequest,
    RagRetrieveRequest
)


# ---------------------------------------------
# IMPORT MATCHING FUNCTIONS
# ---------------------------------------------

# Keyword matching
from services.matchingService import (
    calculate_keyword_match
)

# Combined keyword + semantic matching
from services.aiMatchingService import (
    calculate_ai_match
)


# ---------------------------------------------
# IMPORT RAG FUNCTIONS
# ---------------------------------------------

from services.ragService import (
    add_document,
    retrieve_relevant_chunks,
    build_rag_context
)


# ---------------------------------------------
# IMPORT RAG + LLM ANALYSIS
# ---------------------------------------------

from services.analysisService import (
    analyze_resume
)


# ---------------------------------------------
# CREATE FASTAPI APPLICATION
# ---------------------------------------------

app = FastAPI(
    title="TalentLens AI Service",
    description="AI, ML and RAG service for TalentLens AI",
    version="1.0.0"
)


# ---------------------------------------------
# ROOT ROUTE
# ---------------------------------------------

@app.get("/")
def root():

    return {
        "success": True,
        "message": "TalentLens AI Service is running!"
    }


# ---------------------------------------------
# HEALTH CHECK
# ---------------------------------------------

@app.get("/health")
def health():

    return {
        "success": True,
        "service": "FastAPI AI Service",
        "status": "healthy"
    }


# ---------------------------------------------
# EXISTING MATCH API
# ---------------------------------------------

@app.post("/match")
def match_resume(request: MatchRequest):

    # Calculate keyword + semantic AI matching
    result = calculate_ai_match(
        request.resume_text,
        request.job_description
    )

    return {
        "success": True,
        "message": "AI resume matching completed successfully",
        "data": result
    }


# ---------------------------------------------
# FULL AI ANALYSIS API
# ---------------------------------------------

@app.post("/analyze")
def analyze_resume_api(request: MatchRequest):

    # -----------------------------------------
    # STEP 1: CALCULATE MATCH SCORE
    # -----------------------------------------

    match_result = calculate_ai_match(
        request.resume_text,
        request.job_description
    )


    # -----------------------------------------
    # STEP 2: PERFORM RAG + LLM ANALYSIS
    # -----------------------------------------

    analysis_result = analyze_resume(
        resume_text=request.resume_text,
        job_description=request.job_description,
        document_id=request.document_id,
        match_result=match_result
    )


    # -----------------------------------------
    # STEP 3: RETURN COMPLETE RESULT
    # -----------------------------------------

    return {
        "success": True,
        "message": "AI resume analysis completed successfully",

        "data": {

            # Keyword + semantic matching results
            "match": match_result,

            # LLM-generated HR + candidate analysis
            "analysis": analysis_result["analysis"],

            # Evidence retrieved by RAG
            "rag_chunks": analysis_result["rag_chunks"]
        }
    }


# ---------------------------------------------
# RAG - INDEX DOCUMENT
# ---------------------------------------------

@app.post("/rag/index")
def index_document(request: RagIndexRequest):

    # Store the document inside ChromaDB
    result = add_document(
        document_id=request.document_id,
        text=request.text,
        metadata=request.metadata
    )

    return {
        "success": True,
        "message": "Document indexed successfully",
        "data": result
    }


# ---------------------------------------------
# RAG - RETRIEVE RELEVANT CHUNKS
# ---------------------------------------------

@app.post("/rag/retrieve")
def retrieve_chunks(request: RagRetrieveRequest):

    # Search ChromaDB for semantically relevant
    # chunks.
    results = retrieve_relevant_chunks(
        query=request.query,
        top_k=request.top_k
    )

    return {
        "success": True,
        "message": "Relevant chunks retrieved successfully",

        "data": {
            "query": request.query,
            "count": len(results),
            "chunks": results
        }
    }


# ---------------------------------------------
# RAG - BUILD CONTEXT
# ---------------------------------------------

@app.post("/rag/context")
def retrieve_context(request: RagRetrieveRequest):

    # Retrieve relevant chunks and combine them
    # into an LLM-ready context.
    result = build_rag_context(
        query=request.query,
        top_k=request.top_k
    )

    return {
        "success": True,
        "message": "RAG context generated successfully",
        "data": result
    }