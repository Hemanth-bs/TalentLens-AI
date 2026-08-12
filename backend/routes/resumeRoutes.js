// Import Express
const express = require("express");

// Create an Express router
const router = express.Router();

// Import the resume controller
const {
    createResume,
    getResumes,
    getResumeById,
    updateResume,
    deleteResume
} = require("../controllers/resumeController");

// POST /api/resumes
// Used to create and store a new resume
router.post("/", createResume);

// GET /api/resumes
// Used to retrieve all resumes
router.get("/", getResumes);

// GET /api/resumes/:id
// Used to retrieve one resume by its MongoDB ID
router.get("/:id", getResumeById);

// PUT /api/resumes/:id
// Used to update an existing resume
router.put("/:id", updateResume);

// DELETE /api/resumes/:id
// Used to delete an existing resume
router.delete("/:id", deleteResume);

// Export the router
module.exports = router;