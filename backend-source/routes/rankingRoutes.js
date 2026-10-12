// Import Express
const express = require("express");

// Create router
const router = express.Router();

// Import ranking controller
const {
    rankCandidatesForJob
} = require("../controllers/rankingController");


// ---------------------------------------------
// CANDIDATE RANKING ROUTE
// ---------------------------------------------

// GET /api/rankings/:jobId
// Rank all analyzed candidates for a job
router.get(
    "/:jobId",
    rankCandidatesForJob
);


// Export router
module.exports = router;
