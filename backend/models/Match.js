// ---------------------------------------------
// TALENTLENS AI - MATCH MODEL
// ---------------------------------------------

// Import Mongoose
// Mongoose is used to define our MongoDB document structure
const mongoose = require("mongoose");


// ---------------------------------------------
// MATCH SCHEMA
// ---------------------------------------------

const matchSchema = new mongoose.Schema(
    {
        // Resume being evaluated
        resumeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            required: true
        },

        // Job against which the resume is evaluated
        jobId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobDescription",
            required: true
        },


        // -----------------------------------------
        // APPLICATION REFERENCE
        // -----------------------------------------

        // Application associated with this match
        //
        // This allows HR candidate analysis and
        // ranking to connect the match directly
        // to the candidate's application.
        //
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            default: null
        },


        // -----------------------------------------
        // TRADITIONAL MATCHING SCORES
        // -----------------------------------------

        // Score from the existing traditional
        // backend matching service
        traditionalScore: {
            type: Number,
            default: 0
        },

        // Required skills matching score
        requiredSkillsScore: {
            type: Number,
            default: 0
        },

        // Preferred skills matching score
        preferredSkillsScore: {
            type: Number,
            default: 0
        },

        // Experience matching score
        experienceScore: {
            type: Number,
            default: 0
        },

        // Education matching score
        educationScore: {
            type: Number,
            default: 0
        },


        // -----------------------------------------
        // AI MATCHING SCORES
        // -----------------------------------------

        // Overall score returned by FastAPI
        aiScore: {
            type: Number,
            default: 0
        },

        // Keyword-based AI score
        keywordScore: {
            type: Number,
            default: 0
        },

        // Semantic similarity score
        semanticScore: {
            type: Number,
            default: 0
        },


        // -----------------------------------------
        // FINAL SCORE
        // -----------------------------------------

        // Combined traditional + AI score
        finalScore: {
            type: Number,
            default: 0
        },


        // -----------------------------------------
        // MATCH DETAILS
        // -----------------------------------------

        // Required skills found in the resume
        matchedRequiredSkills: {
            type: [String],
            default: []
        },

        // Required skills missing from the resume
        missingRequiredSkills: {
            type: [String],
            default: []
        },

        // Words identified by the AI keyword matcher
        aiMatchedWords: {
            type: [String],
            default: []
        },


        // -----------------------------------------
        // MATCH STATUS
        // -----------------------------------------

        // Indicates whether the stored match was
        // calculated against the current job data.
        //
        // current = freshly calculated
        // stale   = job requirements changed after
        //           the match was calculated
        //
        matchStatus: {
            type: String,
            enum: [
                "current",
                "stale"
            ],
            default: "current"
        },


        // -----------------------------------------
        // AI ANALYSIS
        // -----------------------------------------

        // Stores the detailed AI/LLM analysis
        // generated during matching.
        //
        // Expected information includes:
        // - matched skills
        // - missing skills
        // - transferable skills
        // - relevant experience
        // - strengths
        // - areas for improvement
        // - HR recommendation
        // - candidate feedback
        //
        // Mixed is used because the AI service
        // returns a structured object whose exact
        // internal shape may evolve.
        //
        aiAnalysis: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        },


        // -----------------------------------------
        // RAG EVIDENCE
        // -----------------------------------------

        // Evidence chunks retrieved by RAG during
        // AI matching.
        //
        // These are persisted so the HR Rankings
        // analysis page can display the evidence
        // without calling the AI service again.
        //
        ragEvidence: {
            type: [mongoose.Schema.Types.Mixed],
            default: []
        }
    },


    // ---------------------------------------------
    // AUTOMATIC TIMESTAMPS
    // ---------------------------------------------

    {
        // Automatically stores createdAt and updatedAt
        timestamps: true
    }
);


// ---------------------------------------------
// PREVENT DUPLICATE RESUME-JOB MATCHES
// ---------------------------------------------

// A candidate should have only one Match record
// for the same resume and job combination.
matchSchema.index(
    {
        resumeId: 1,
        jobId: 1
    },
    {
        unique: true
    }
);


// ---------------------------------------------
// CREATE MODEL
// ---------------------------------------------

const Match = mongoose.model(
    "Match",
    matchSchema
);


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = Match;