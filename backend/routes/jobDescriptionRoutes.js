// Import Express
const express = require("express");

// Create router
const router = express.Router();

const {
    analyzeJobDescriptionController
} = require("../controllers/jobIntelligenceController");

// Import controller functions
const {
    createJobDescription,
    getJobDescriptions,
    getJobDescriptionById
} = require("../controllers/jobDescriptionController");


// ---------------------------------------------
// JOB DESCRIPTION ROUTES
// ---------------------------------------------

// Create a new job description
// POST /api/jobs
router.post("/", createJobDescription);


// Get all job descriptions
// GET /api/jobs
router.get("/", getJobDescriptions);

// POST /api/jobs/:id/analyze
// Analyze a stored job description
router.post(
    "/:id/analyze",
    analyzeJobDescriptionController
);


// Get a specific job description
// GET /api/jobs/:id
router.get("/:id", getJobDescriptionById);

// Export router
module.exports = router;