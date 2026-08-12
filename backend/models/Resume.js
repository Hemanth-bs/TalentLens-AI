// Import Mongoose
// Mongoose helps us define the structure of our MongoDB documents
const mongoose = require("mongoose");

// Define the structure of a candidate resume
const resumeSchema = new mongoose.Schema(
    {
        // Candidate's full name
        candidateName: {
            type: String,
            required: true,
            trim: true
        },

        // Candidate's email address
        email: {
            type: String,
            required: true,
            trim: true
        },

        // Extracted skills from the resume
        skills: {
            type: [String],
            default: []
        },

        // Total years of experience
        experience: {
            type: Number,
            default: 0
        },

        // Education information
        education: {
            type: String,
            default: ""
        },

        // Original/extracted resume text
        resumeText: {
            type: String,
            default: ""
        },

        // Job description against which the resume will be evaluated
        jobDescription: {
            type: String,
            default: ""
        },

        // AI/RAG-based matching score
        matchScore: {
            type: Number,
            default: 0
        },

        // Current processing status
        status: {
            type: String,
            enum: ["uploaded", "processing", "completed", "failed"],
            default: "uploaded"
        }
    },

    {
        // Automatically adds createdAt and updatedAt
        timestamps: true
    }
);

// Convert the schema into a MongoDB model
const Resume = mongoose.model("Resume", resumeSchema);

// Export the model so other backend files can use it
module.exports = Resume;