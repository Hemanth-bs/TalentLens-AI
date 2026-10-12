const mongoose = require("mongoose");

const candidateProfileSchema = new mongoose.Schema(
    {
        // Links this profile to the authenticated candidate.
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        // Basic contact information.
        phone: {
            type: String,
            default: "",
            trim: true
        },

        location: {
            type: String,
            default: "",
            trim: true
        },

        // Short professional introduction.
        bio: {
            type: String,
            default: "",
            trim: true
        },

        // Skills entered directly by the candidate.
        skills: {
            type: [String],
            default: []
        },

        // Education details entered by the candidate.
        education: {
            type: String,
            default: "",
            trim: true
        },

        // Overall professional experience.
        experience: {
            type: Number,
            default: 0,
            min: 0
        },

        // Projects entered by the candidate.
        projects: {
            type: [String],
            default: []
        },

        // Certifications entered by the candidate.
        certifications: {
            type: [String],
            default: []
        },

        // Optional professional links.
        linkedin: {
            type: String,
            default: "",
            trim: true
        },

        github: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "CandidateProfile",
    candidateProfileSchema
);