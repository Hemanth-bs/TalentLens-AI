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
        // TRADITIONAL MATCHING SCORES
        // -----------------------------------------

        // Score from our existing matching service
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
        }
    },

    {
        // Automatically stores createdAt and updatedAt
        timestamps: true
    }
);


// ---------------------------------------------
// PREVENT DUPLICATE RESUME-JOB MATCHES
// ---------------------------------------------

// A candidate should have only one current match
// record for the same job.
matchSchema.index(
    { resumeId: 1, jobId: 1 },
    { unique: true }
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