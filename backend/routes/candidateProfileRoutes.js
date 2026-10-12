const express = require("express");

const router = express.Router();


// Authentication middleware.
const {
    protect,
    requireRole
} = require("../middleware/authMiddleware");


// Candidate profile controllers.
const {
    getCandidateProfile,
    updateCandidateProfile
} = require("../controllers/candidateProfileController");


// ---------------------------------------------
// GET PROFILE
// ---------------------------------------------
// Candidate only.

router.get(
    "/profile",
    protect,
    requireRole("candidate"),
    getCandidateProfile
);


// ---------------------------------------------
// CREATE / UPDATE PROFILE
// ---------------------------------------------
// Candidate only.

router.put(
    "/profile",
    protect,
    requireRole("candidate"),
    updateCandidateProfile
);


module.exports = router;