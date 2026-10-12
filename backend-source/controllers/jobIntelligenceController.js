// ---------------------------------------------
// JOB INTELLIGENCE CONTROLLER
// ---------------------------------------------

// Import Job Description model
const JobDescription = require("../models/JobDescription");

// Import Job Intelligence service
const {
    analyzeJobDescription
} = require("../services/jobIntelligenceService");


// ---------------------------------------------
// ANALYZE JOB DESCRIPTION
// ---------------------------------------------

const analyzeJobDescriptionController = async (req, res) => {

    try {

        // Get job ID from URL
        const { id } = req.params;

        // Find the job description in MongoDB
        const jobDescription = await JobDescription.findById(id);

        // Check if job exists
        if (!jobDescription) {

            return res.status(404).json({
                success: false,
                message: "Job description not found"
            });

        }

        // Analyze the job description
        const analysis = analyzeJobDescription(jobDescription);

        // Update structured intelligence data
        jobDescription.status = "processed";

        await jobDescription.save();

        // Return analysis result
        return res.status(200).json({

            success: true,

            message: "Job description analyzed successfully",

            data: {

                jobId: jobDescription._id,

                title: jobDescription.title,

                company: jobDescription.company,

                detectedSkills: analysis.detectedSkills,

                requiredSkills: analysis.requiredSkills,

                preferredSkills: analysis.preferredSkills,

                minimumExperience: analysis.minimumExperience,

                education: analysis.education,

                responsibilities: analysis.responsibilities,

                status: jobDescription.status
            }

        });

    } catch (error) {

        console.error(
            "Job intelligence analysis error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message: "Failed to analyze job description"

        });

    }
};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    analyzeJobDescriptionController
};