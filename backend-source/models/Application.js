const mongoose = require("mongoose");

// ---------------------------------------------
// APPLICATION SCHEMA
// ---------------------------------------------
// Stores one candidate's application for one job.
const applicationSchema = new mongoose.Schema(
    {
        // Candidate who submitted the application.
        candidate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // Job the candidate applied for.
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "JobDescription",
            required: true
        },

        // Candidate profile snapshot/reference.
        candidateProfile: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CandidateProfile",
            default: null
        },

        // Resume reference.
        resume: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resume",
            default: null
        },

        // Current application status.
        status: {
            type: String,
            enum: [
                "Applied",
                "Shortlisted",
                "Rejected",
                "Selected"
            ],
            default: "Applied"
        }
    },
    {
        timestamps: true
    }
);

// ---------------------------------------------
// PREVENT DUPLICATE APPLICATIONS
// ---------------------------------------------
// One candidate can apply only once to a job.
applicationSchema.index(
    {
        candidate: 1,
        job: 1
    },
    {
        unique: true
    }
);

module.exports = mongoose.model(
    "Application",
    applicationSchema
);