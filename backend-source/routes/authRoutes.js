const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

// Temporary protected route for testing JWT authentication
router.get("/profile", protect, (req, res) => {
    res.json({
        success: true,
        message: "JWT authentication working",
        user: req.user
    });
});

module.exports = router;