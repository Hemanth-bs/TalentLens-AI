// ---------------------------------------------
// TALENTLENS AI - RANKING ROUTES
// ---------------------------------------------

// Import Express
const express = require("express");

const router = express.Router();


// ---------------------------------------------
// IMPORT AUTHENTICATION MIDDLEWARE
// ---------------------------------------------

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");


// ---------------------------------------------
// IMPORT RANKING CONTROLLER
// ---------------------------------------------

const {
    rankCandidatesForJob
} = require("../controllers/rankingController");


// ---------------------------------------------
// CANDIDATE RANKING
// ---------------------------------------------

// GET /api/rankings/:jobId
//
// Ranking is an HR-only operation.
//
// Flow:
//
// JWT authentication
//       ↓
// HR role verification
//       ↓
// Candidate ranking
//
// This prevents unauthenticated users and
// candidates from accessing HR ranking data.

router.get(
    "/:jobId",
    protect,
    requireRole("hr"),
    rankCandidatesForJob
);


// ---------------------------------------------
// EXPORT ROUTER
// ---------------------------------------------

module.exports = router;