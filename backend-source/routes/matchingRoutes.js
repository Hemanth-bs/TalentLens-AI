// Import Express
const express = require("express");

// Create router
const router = express.Router();

// Import matching controller
const {
    matchResumeToJob
} = require("../controllers/matchingController");


// ---------------------------------------------
// MATCHING ROUTE
// ---------------------------------------------

// POST /api/matches
// Matches a resume with a job description
router.post(
    "/",
    matchResumeToJob
);


// Export router
module.exports = router;
