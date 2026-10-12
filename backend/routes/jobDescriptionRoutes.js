const express = require("express");

const router =
    express.Router();


// =====================================================
// MIDDLEWARE
// =====================================================

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");


// =====================================================
// CONTROLLERS
// =====================================================

const {

    createJobDescription,

    getJobDescriptions,

    getCandidateJobs,

    getJobDescriptionById,

    updateJobDescription,

    updateJobStatus,

    deleteJobDescription

} = require("../controllers/jobDescriptionController");


// =====================================================
// CREATE JOB
// =====================================================
// HR only.
// =====================================================

router.post(
    "/",
    protect,
    requireRole("hr"),
    createJobDescription
);


// =====================================================
// GET ALL JOBS
// =====================================================
// HR:
//     Own company's complete jobs.
//
// Candidate:
//     Open jobs with safe fields only.
// =====================================================

router.get(
    "/",
    protect,
    getJobDescriptions
);


// =====================================================
// GET CANDIDATE JOBS
// =====================================================
// Candidate only.
// Only Open jobs.
// Hidden evaluation fields excluded.
// =====================================================

router.get(
    "/candidate",
    protect,
    requireRole("candidate"),
    getCandidateJobs
);


// =====================================================
// UPDATE JOB STATUS
// =====================================================
// Draft / Open / Closed
//
// IMPORTANT:
// This must appear before /:id routes.
// =====================================================

router.patch(
    "/:id/status",
    protect,
    requireRole("hr"),
    updateJobStatus
);


// =====================================================
// UPDATE JOB
// =====================================================

router.put(
    "/:id",
    protect,
    requireRole("hr"),
    updateJobDescription
);


// =====================================================
// DELETE JOB
// =====================================================

router.delete(
    "/:id",
    protect,
    requireRole("hr"),
    deleteJobDescription
);


// =====================================================
// GET JOB BY ID
// =====================================================
// HR:
//     Complete job, but only own company.
//
// Candidate:
//     Safe information, only if Open.
// =====================================================

router.get(
    "/:id",
    protect,
    getJobDescriptionById
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;