const express = require("express");

const router = express.Router();

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

const {
    applyForJob,
    getMyApplications
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

module.exports = router;