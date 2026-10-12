// Import Mongoose
const mongoose = require("mongoose");

// ---------------------------------------------
// JOB DESCRIPTION SCHEMA
// ---------------------------------------------

const jobDescriptionSchema = new mongoose.Schema(
    {
        // Job title
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Company offering the position
        company: {
            type: String,
            trim: true,
            default: ""
        },

        // Complete original job description
        description: {
            type: String,
            required: true,
            trim: true
        },

        // Skills that are explicitly required
        requiredSkills: {
            type: [String],
            default: []
        },

        // Skills that are preferred but not mandatory
        preferredSkills: {
            type: [String],
            default: []
        },

        // Minimum years of experience
        minimumExperience: {
            type: Number,
            default: 0
        },

        // Required/preferred educational qualification
        education: {
            type: String,
            default: ""
        },

        // Main responsibilities mentioned in the JD
        responsibilities: {
            type: [String],
            default: []
        },

        // Processing status
        status: {
            type: String,
            enum: [
                "created",
                "processed",
                "failed"
            ],
            default: "created"
        }
    },
    {
        timestamps: true
    }
);

// Create and export the model
module.exports = mongoose.model(
    "JobDescription",
    jobDescriptionSchema
);