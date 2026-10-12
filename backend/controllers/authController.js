const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

// ---------------------------------------------
// REGISTER USER
// ---------------------------------------------

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, company } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required"
            });
        }

        if (!["hr", "candidate"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be either hr or candidate"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            company: role === "hr" ? (company || "") : "",
            authProvider: "local"
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                company: user.company
            }
        });
    } catch (error) {
        console.error("Registration error:", error.message);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to register user"
        });
    }
};

// ---------------------------------------------
// LOGIN USER WITH EMAIL AND PASSWORD
// ---------------------------------------------

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user || !user.password) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const passwordValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                token,
                user: {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    company: user.company
                }
            }
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Failed to login"
        });
    }
};

// ---------------------------------------------
// LOGIN WITH GOOGLE â€” CANDIDATES ONLY
// ---------------------------------------------

const googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential) {
            return res.status(400).json({
                success: false,
                message: "Google credential is required"
            });
        }

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("GOOGLE_CLIENT_ID is not configured");

            return res.status(500).json({
                success: false,
                message: "Google login is not configured"
            });
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();

        if (
            !payload ||
            !payload.sub ||
            !payload.email ||
            payload.email_verified !== true
        ) {
            return res.status(401).json({
                success: false,
                message: "Google account verification failed"
            });
        }

        const email = payload.email.trim().toLowerCase();
        const googleId = payload.sub;

        let user = await User.findOne({ googleId });

        if (user && user.role !== "candidate") {
            return res.status(403).json({
                success: false,
                message: "Google login is only available for candidates"
            });
        }

        if (!user) {
            const existingUser = await User.findOne({ email });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "An account already exists with this email. Please sign in using your existing login method."
                });
            }

            user = await User.create({
                name: payload.name || email.split("@")[0],
                email,
                googleId,
                authProvider: "google",
                role: "candidate",
                company: ""
            });
        }

        const token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        return res.status(200).json({
            success: true,
            message: "Google login successful",
            data: {
                token,
                user: {
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    company: user.company
                }
            }
        });
    } catch (error) {
        console.error("Google login error:", {
            name: error.name,
            message: error.message,
            code: error.code
        });

        return res.status(401).json({
            success: false,
            message: "Google authentication failed"
        });
    }
};

// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    registerUser,
    loginUser,
    googleLogin
};
