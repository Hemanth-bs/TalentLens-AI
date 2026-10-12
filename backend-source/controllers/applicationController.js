const Application = require("../models/Application");
const JobDescription = require("../models/JobDescription");
const CandidateProfile = require("../models/CandidateProfile");

// ---------------------------------------------
// APPLY FOR A JOB
// ---------------------------------------------
// Creates an application for the logged-in candidate.
// A candidate can apply only once for the same job.
const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.body;

        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required."
            });
        }

        // ---------------------------------------------
        // CHECK JOB
        // ---------------------------------------------
        const job = await JobDescription.findById(jobId);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found."
            });
        }

        // ---------------------------------------------
        // CHECK DUPLICATE APPLICATION
        // ---------------------------------------------
        const existingApplication = await Application.findOne({
            candidate: req.user._id,
            job: jobId
        });

        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job."
            });
        }

        // ---------------------------------------------
        // GET CANDIDATE PROFILE
        // ---------------------------------------------
        const candidateProfile = await CandidateProfile.findOne({
            user: req.user._id
        });

        // ---------------------------------------------
        // CREATE APPLICATION
        // ---------------------------------------------
        const application = await Application.create({
            candidate: req.user._id,
            job: jobId,
            candidateProfile: candidateProfile
                ? candidateProfile._id
                : null,
            resume: null,
            status: "Applied"
        });

        res.status(201).json({
            success: true,
            message: "Application submitted successfully.",
            data: application
        });

    } catch (error) {
        console.error(
            "Apply for job error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to submit application."
        });
    }
};


// ---------------------------------------------
// GET MY APPLICATIONS
// ---------------------------------------------
// Returns applications belonging only to
// the logged-in candidate.
const getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({
            candidate: req.user._id
        })
            .populate(
                "job",
                "title company description minimumExperience education"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Applications fetched successfully.",
            data: applications
        });

    } catch (error) {
        console.error(
            "Get my applications error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch applications."
        });
    }
};


// ---------------------------------------------
// GET HR APPLICATIONS
// ---------------------------------------------
// Returns applications submitted for jobs
// belonging to the logged-in HR user's company.
const getHRApplications = async (req, res) => {
    try {
        // ---------------------------------------------
        // FIND HR COMPANY JOBS
        // ---------------------------------------------
        const jobs = await JobDescription.find({
            company: req.user.company
        }).select("_id");

        const jobIds = jobs.map(
            (job) => job._id
        );

        // ---------------------------------------------
        // FIND APPLICATIONS
        // ---------------------------------------------
        const applications = await Application.find({
            job: { $in: jobIds }
        })
            .populate(
                "candidate",
                "name email"
            )
            .populate(
                "candidateProfile",
                "phone location bio skills education experience projects certifications linkedin github"
            )
            .populate(
                "job",
                "title company description minimumExperience education responsibilities"
            )
            .sort({ createdAt: -1 });

        // ---------------------------------------------
        // SEND APPLICATIONS
        // ---------------------------------------------
        res.status(200).json({
            success: true,
            message: "HR applications fetched successfully.",
            data: applications
        });

    } catch (error) {
        console.error(
            "Get HR applications error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch HR applications."
        });
    }
};


// ---------------------------------------------
// EXPORT CONTROLLERS
// ---------------------------------------------
module.exports = {
    applyForJob,
    getMyApplications,
    getHRApplications
};