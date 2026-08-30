// Import Express
const express = require("express");

// Create Express router
const router = express.Router();


// ---------------------------------------------
// IMPORT MIDDLEWARE
// ---------------------------------------------

// Resume upload middleware
const upload = require("../middleware/uploadMiddleware");


// ---------------------------------------------
// IMPORT CONTROLLERS
// ---------------------------------------------

// Resume CRUD controllers
const {
    createResume,
    getResumes,
    getResumeById,
    updateResume,
    deleteResume
} = require("../controllers/resumeController");

// Resume upload controller
const {
    uploadResume
} = require("../controllers/resumeUploadController");

// Resume intelligence controller
const {
    analyzeResumeController
} = require("../controllers/resumeIntelligenceController");


// ---------------------------------------------
// RESUME UPLOAD
// ---------------------------------------------

// POST /api/resumes/upload
//
// Upload a PDF or DOCX resume.
//
// "resume" is the expected multipart/form-data
// field name.
router.post(
    "/upload",
    upload.single("resume"),
    uploadResume
);


// ---------------------------------------------
// RESUME CRUD
// ---------------------------------------------

// POST /api/resumes
// Create a resume manually
router.post(
    "/",
    createResume
);


// GET /api/resumes
// Get all resumes
router.get(
    "/",
    getResumes
);


// GET /api/resumes/:id
// Get one resume
router.get(
    "/:id",
    getResumeById
);


// PUT /api/resumes/:id
// Update one resume
router.put(
    "/:id",
    updateResume
);


// DELETE /api/resumes/:id
// Delete one resume
router.delete(
    "/:id",
    deleteResume
);


// ---------------------------------------------
// RESUME INTELLIGENCE
// ---------------------------------------------

// POST /api/resumes/:id/analyze
//
// Analyze the extracted resume text and generate
// structured candidate information.
router.post(
    "/:id/analyze",
    analyzeResumeController
);


// ---------------------------------------------
// EXPORT ROUTER
// ---------------------------------------------

module.exports = router;