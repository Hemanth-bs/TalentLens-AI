
const express = require("express");
const router = express.Router();

const {
    registerUser,
    loginUser,
    googleLogin
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", googleLogin);

// Protected route for testing JWT authentication
router.get("/profile", protect, (req, res) => {
    res.json({
        success: true,
        message: "JWT authentication working",
        user: req.user
    });
});

module.exports = router;
