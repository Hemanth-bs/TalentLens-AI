// ---------------------------------------------
// CANDIDATE RANKING CONTROLLER
// ---------------------------------------------

const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");

const {
    rankCandidates
} = require("../services/rankingService");


// ---------------------------------------------
// RANK ALL CANDIDATES FOR A JOB
// ---------------------------------------------

const rankCandidatesForJob = async (req, res) => {

    try {

        // Get job ID from URL
        const { jobId } = req.params;

        // Find job description
        const job = await JobDescription.findById(jobId);

        if (!job) {

            return res.status(404).json({
                success: false,
                message: "Job description not found"
            });

        }

        // Get all analyzed resumes
        const candidates = await Resume.find({
            status: "completed"
        });

        // Rank candidates
        const rankedCandidates =
            rankCandidates(candidates, job);

        return res.status(200).json({

            success: true,

            message: "Candidates ranked successfully",

            data: {

                jobId: job._id,

                jobTitle: job.title,

                company: job.company,

                totalCandidates:
                    rankedCandidates.length,

                candidates:
                    rankedCandidates

            }

        });

    } catch (error) {

        console.error(
            "Candidate ranking error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message: "Failed to rank candidates"

        });

    }
};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    rankCandidatesForJob
};