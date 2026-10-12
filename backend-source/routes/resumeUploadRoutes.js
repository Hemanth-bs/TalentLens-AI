// Import Express
const express = require("express");

// Create an Express router
const router = express.Router();

// Import upload middleware
const upload = require("../middleware/uploadMiddleware");

// Import upload controller
const { uploadResume } = require("../controllers/resumeUploadController");


// ---------------------------------------------
// RESUME UPLOAD ROUTE
// ---------------------------------------------

// POST /api/resumes/upload
// Receives a single resume file
//
// "resume" is the field name expected by Multer
router.post(
    "/upload",
    upload.single("resume"),
    uploadResume
);


// Export the router
module.exports = router;