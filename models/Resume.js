const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        // Candidate name
        candidateName: {
            type: String,
            required: true,
            trim: true
        },

        // Candidate email
        email: {
            type: String,
            required: true,
            trim: true
        },

        // Skills extracted from the resume
        skills: {
            type: [String],
            default: []
        },

        // Years of professional experience
        experience: {
            type: Number,
            default: 0
        },

        // Highest/relevant education
        education: {
            type: String,
            default: ""
        },

        // Projects mentioned in the resume
        projects: {
            type: [String],
            default: []
        },

        // Certifications mentioned in the resume
        certifications: {
            type: [String],
            default: []
        },

        // Complete extracted resume text
        resumeText: {
            type: String,
            default: ""
        },

        // Job description associated with the resume
        jobDescription: {
            type: String,
            default: ""
        },

        // Resume-job matching score
        matchScore: {
            type: Number,
            default: 0
        },

        // Processing status
        status: {
            type: String,
            enum: [
                "uploaded",
                "processing",
                "completed",
                "failed"
            ],
            default: "uploaded"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Resume", resumeSchema);