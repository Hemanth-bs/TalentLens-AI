const express = require("express");

const router = express.Router();

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

const {
    applyForJob,
    getMyApplications,
    getHRApplications,
    getHRCandidateAnalysis,
    getCandidateFeedback,
    getHRCandidateRanking,
    updateApplicationStatus
} = require("../controllers/applicationController");


// ---------------------------------------------
// APPLY FOR A JOB
// ---------------------------------------------
// Only logged-in candidates can apply.

router.post(
    "/",
    protect,
    requireRole("candidate"),
    applyForJob
);


// ---------------------------------------------
// GET MY APPLICATIONS
// ---------------------------------------------
// Candidate can see only their own applications.

router.get(
    "/my",
    protect,
    requireRole("candidate"),
    getMyApplications
);


// ---------------------------------------------
// GET HR APPLICATIONS
// ---------------------------------------------
// HR can see applications submitted for jobs
// belonging to their company.

router.get(
    "/hr",
    protect,
    requireRole("hr"),
    getHRApplications
);


// ---------------------------------------------
// GET HR CANDIDATE ANALYSIS
// ---------------------------------------------
// HR can view persisted matching analysis for
// an application belonging to their company.

router.get(
    "/:applicationId/analysis",
    protect,
    requireRole("hr"),
    getHRCandidateAnalysis
);


// ---------------------------------------------
// GET HR CANDIDATE RANKING
// ---------------------------------------------
// HR can view ranked applicants for a job
// belonging to their company.

router.get(
    "/job/:jobId/ranking",
    protect,
    requireRole("hr"),
    getHRCandidateRanking
);


// ---------------------------------------------
// GET CANDIDATE-SAFE FEEDBACK
// ---------------------------------------------
// Candidates can view feedback only for their
// own application.

router.get(
    "/:applicationId/feedback",
    protect,
    requireRole("candidate"),
    getCandidateFeedback
);


// ---------------------------------------------
// UPDATE APPLICATION STATUS
// ---------------------------------------------
// Only HR users can update application status.
//
// Supported statuses:
// Applied
// Shortlisted
// Rejected
// Selected

router.patch(
    "/:applicationId/status",
    protect,
    requireRole("hr"),
    updateApplicationStatus
);


module.exports = router;