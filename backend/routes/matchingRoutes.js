// ---------------------------------------------
// TALENTLENS AI - MATCHING ROUTES
// ---------------------------------------------

// Import Express
const express = require("express");

// Create router
const router = express.Router();

// ---------------------------------------------
// IMPORT AUTHENTICATION MIDDLEWARE
// ---------------------------------------------

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");

// ---------------------------------------------
// IMPORT MATCHING CONTROLLER
// ---------------------------------------------

const {
    matchResumeToJob
} = require("../controllers/matchingController");

// ---------------------------------------------
// MATCHING ROUTE
// ---------------------------------------------

// POST /api/matches
//
// Only authenticated HR users can trigger
// candidate-to-job matching.
//
// JWT
//   ↓
// Authentication
//   ↓
// HR role
//   ↓
// Matching controller

router.post(
    "/",
    protect,
    requireRole("hr"),
    matchResumeToJob
);

// ---------------------------------------------
// EXPORT ROUTER
// ---------------------------------------------

module.exports = router;