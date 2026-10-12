// ---------------------------------------------
// TALENTLENS AI - RESUME ROUTES
// ---------------------------------------------

// Import Express
const express = require("express");

// Create Express router
const router = express.Router();


// ---------------------------------------------
// IMPORT AUTHENTICATION MIDDLEWARE
// ---------------------------------------------

const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");


// ---------------------------------------------
// IMPORT UPLOAD MIDDLEWARE
// ---------------------------------------------

const upload =
    require("../middleware/uploadMiddleware");


// ---------------------------------------------
// IMPORT RESUME CRUD CONTROLLERS
// ---------------------------------------------

const {
    createResume,
    getResumes,
    getResumeById,
    updateResume,
    deleteResume
} = require("../controllers/resumeController");


// ---------------------------------------------
// IMPORT RESUME UPLOAD CONTROLLER
// ---------------------------------------------

const {
    uploadResume
} = require("../controllers/resumeUploadController");


// ---------------------------------------------
// IMPORT RESUME INTELLIGENCE CONTROLLER
// ---------------------------------------------

const {
    analyzeResumeController
} = require("../controllers/resumeIntelligenceController");


// ---------------------------------------------
// RESUME UPLOAD
// ---------------------------------------------

// POST /api/resumes/upload
//
// Only authenticated candidates can upload
// their resumes.
//
// Flow:
//
// JWT
//   ↓
// Candidate role
//   ↓
// Multer file upload
//   ↓
// Resume processing
//   ↓
// RAG indexing

router.post(

    "/upload",

    protect,

    requireRole("candidate"),

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

    protect,

    requireRole("candidate"),

    createResume

);


// GET /api/resumes
// Get resumes

router.get(

    "/",

    protect,

    getResumes

);


// GET /api/resumes/:id
// Get one resume

router.get(

    "/:id",

    protect,

    getResumeById

);


// PUT /api/resumes/:id
// Update one resume

router.put(

    "/:id",

    protect,

    requireRole("candidate"),

    updateResume

);


// DELETE /api/resumes/:id
// Delete one resume

router.delete(

    "/:id",

    protect,

    requireRole("candidate"),

    deleteResume

);


// ---------------------------------------------
// RESUME INTELLIGENCE
// ---------------------------------------------

// POST /api/resumes/:id/analyze
//
// Analyze the extracted resume text.

router.post(

    "/:id/analyze",

    protect,

    requireRole("candidate"),

    analyzeResumeController

);


// ---------------------------------------------
// EXPORT ROUTER
// ---------------------------------------------

module.exports = router;