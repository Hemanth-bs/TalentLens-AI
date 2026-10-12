const express = require("express");

const router = express.Router();

const {
    createJobDescription,
    getJobDescriptions,
    getJobDescriptionById,
    getCandidateJobs
} = require("../controllers/jobDescriptionController");

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

// ---------------------------------------------
// CREATE JOB
// ---------------------------------------------
// Only HR users can create job descriptions.
router.post(
    "/",
    protect,
    requireRole("hr"),
    createJobDescription
);

// ---------------------------------------------
// GET ALL JOBS
// ---------------------------------------------
// Existing general jobs endpoint.
router.get(
    "/",
    getJobDescriptions
);

// ---------------------------------------------
// GET CANDIDATE-SAFE JOBS
// ---------------------------------------------
// Candidates can view available jobs.
// Hidden HR evaluation criteria are excluded
// by getCandidateJobs() in the controller.
router.get(
    "/candidate",
    protect,
    requireRole("candidate"),
    getCandidateJobs
);

// ---------------------------------------------
// GET SPECIFIC JOB
// ---------------------------------------------
router.get(
    "/:id",
    getJobDescriptionById
);

module.exports = router;