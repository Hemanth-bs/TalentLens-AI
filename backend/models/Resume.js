// Import Mongoose
// Mongoose helps us define the structure of our MongoDB documents
const mongoose = require("mongoose");


// ---------------------------------------------
// RESUME SCHEMA
// ---------------------------------------------

const resumeSchema = new mongoose.Schema(
    {
        // -----------------------------------------
        // CANDIDATE REFERENCE
        // -----------------------------------------
        // Links this resume to the authenticated
        // candidate who uploaded it.
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // -----------------------------------------
        // CANDIDATE NAME
        // -----------------------------------------
        candidateName: {
            type: String,
            required: true,
            trim: true
        },

        // -----------------------------------------
        // CANDIDATE EMAIL
        // -----------------------------------------
        email: {
            type: String,
            required: true,
            trim: true
        },

        // -----------------------------------------
        // EXTRACTED SKILLS
        // -----------------------------------------
        skills: {
            type: [String],
            default: []
        },

        // -----------------------------------------
        // EXPERIENCE
        // -----------------------------------------
        experience: {
            type: Number,
            default: 0
        },

        // -----------------------------------------
        // EDUCATION
        // -----------------------------------------
        education: {
            type: String,
            default: ""
        },

        // -----------------------------------------
        // ORIGINAL RESUME TEXT
        // -----------------------------------------
        resumeText: {
            type: String,
            default: ""
        },

        // -----------------------------------------
        // JOB DESCRIPTION
        // -----------------------------------------
        jobDescription: {
            type: String,
            default: ""
        },

        // -----------------------------------------
        // AI MATCHING SCORE
        // -----------------------------------------
        matchScore: {
            type: Number,
            default: 0
        },

        // -----------------------------------------
        // CURRENT PROCESSING STATUS
        // -----------------------------------------
        status: {
            type: String,
            enum: [
                "uploaded",
                "processed",
                "failed"
            ],
            default: "uploaded"
        }
    },

    // ---------------------------------------------
    // AUTOMATIC TIMESTAMPS
    // ---------------------------------------------
    {
        timestamps: true
    }
);


// ---------------------------------------------
// CREATE MODEL
// ---------------------------------------------

const Resume = mongoose.model(
    "Resume",
    resumeSchema
);


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = Resume;