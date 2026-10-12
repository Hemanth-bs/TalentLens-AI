// ---------------------------------------------
// TALENTLENS AI - RESUME UPLOAD ROUTES
// ---------------------------------------------

// Import Express
const express = require("express");

// Create an Express router
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
// IMPORT UPLOAD CONTROLLER
// ---------------------------------------------

const {
    uploadResume
} = require("../controllers/resumeUploadController");


// ---------------------------------------------
// RESUME UPLOAD ROUTE
// ---------------------------------------------

// POST /api/resumes/upload
//
// Only logged-in candidates can upload resumes.
//
// Flow:
//
// JWT authentication
//       ↓
// Candidate role check
//       ↓
// Multer file upload
//       ↓
// Resume processing

router.post(

    "/upload",

    protect,

    requireRole("candidate"),

    upload.single("resume"),

    uploadResume

);


// ---------------------------------------------
// EXPORT ROUTER
// ---------------------------------------------

module.exports = router;