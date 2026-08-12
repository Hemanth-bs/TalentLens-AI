// Import Express
const express = require("express");

// Create an Express router
const router = express.Router();

// Import the resume controller
const { createResume } = require("../controllers/resumeController");

// POST /api/resumes
// Used to create and store a new resume
router.post("/", createResume);

// Export the router
module.exports = router;