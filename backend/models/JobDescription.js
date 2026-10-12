const mongoose = require("mongoose");


// =====================================================
// JOB DESCRIPTION SCHEMA
// =====================================================
// Stores all information related to a recruitment job.
//
// PUBLIC INFORMATION:
// These fields can be shown to candidates.
//
// HR-ONLY INFORMATION:
// These fields are used internally for AI evaluation
// and are NOT exposed to candidates.
//
// SYSTEM INFORMATION:
// Used internally for job lifecycle and RAG processing.
// =====================================================


const jobDescriptionSchema = new mongoose.Schema(
    {

        // =================================================
        // PUBLIC JOB INFORMATION
        // =================================================

        title: {
            type: String,
            required: true,
            trim: true
        },

        company: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        responsibilities: {
            type: [String],
            default: []
        },

        location: {
            type: String,
            default: "",
            trim: true
        },

        workMode: {
            type: String,
            enum: [
                "On-site",
                "Hybrid",
                "Remote"
            ],
            default: "On-site"
        },

        employmentType: {
            type: String,
            enum: [
                "Full-time",
                "Part-time",
                "Internship",
                "Contract"
            ],
            default: "Full-time"
        },

        salary: {
            type: String,
            default: "",
            trim: true
        },

        contractPeriod: {
            type: String,
            default: "",
            trim: true
        },

        minimumExperience: {
            type: Number,
            default: 0,
            min: 0
        },

        education: {
            type: String,
            default: "",
            trim: true
        },

        applicationDeadline: {
            type: Date,
            default: null
        },


        // =================================================
        // HR-ONLY / AI EVALUATION INFORMATION
        // =================================================
        // Candidates must never receive these fields
        // through candidate-facing APIs.
        // =================================================

        requiredSkills: {
            type: [String],
            default: []
        },

        preferredSkills: {
            type: [String],
            default: []
        },

        evaluationCriteria: {
            type: [String],
            default: []
        },

        internalNotes: {
            type: String,
            default: "",
            trim: true
        },


        // =================================================
        // JOB LIFECYCLE
        // =================================================
        // This represents whether the job is available
        // for applications.
        // =================================================

        jobStatus: {
            type: String,
            enum: [
                "Draft",
                "Open",
                "Closed"
            ],
            default: "Draft"
        },


        // =================================================
        // RAG / PROCESSING STATUS
        // =================================================
        // This is separate from jobStatus.
        //
        // jobStatus:
        //     Draft → Open → Closed
        //
        // processingStatus:
        //     created → processed
        //                    ↓
        //                  failed
        // =================================================

        processingStatus: {
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


// =====================================================
// DATABASE INDEXES
// =====================================================

jobDescriptionSchema.index({
    company: 1
});

jobDescriptionSchema.index({
    jobStatus: 1
});

jobDescriptionSchema.index({
    applicationDeadline: 1
});


// =====================================================
// EXPORT MODEL
// =====================================================

module.exports =
    mongoose.model(
        "JobDescription",
        jobDescriptionSchema
    );