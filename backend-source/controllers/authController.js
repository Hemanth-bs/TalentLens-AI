// ---------------------------------------------
// TALENTLENS AI - AUTHENTICATION CONTROLLER
// ---------------------------------------------

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// ---------------------------------------------
// REGISTER USER
// ---------------------------------------------

const registerUser = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            role,
            company
        } = req.body;


        // -----------------------------------------
        // VALIDATE REQUIRED FIELDS
        // -----------------------------------------

        if (!name || !email || !password || !role) {

            return res.status(400).json({
                success: false,
                message: "Name, email, password and role are required"
            });

        }


        // -----------------------------------------
        // VALIDATE ROLE
        // -----------------------------------------

        if (!["hr", "candidate"].includes(role)) {

            return res.status(400).json({
                success: false,
                message: "Role must be either hr or candidate"
            });

        }


        // -----------------------------------------
        // CHECK EXISTING USER
        // -----------------------------------------

        const existingUser =
            await User.findOne({
                email: email.toLowerCase()
            });

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "User with this email already exists"
            });

        }


        // -----------------------------------------
        // HASH PASSWORD
        // -----------------------------------------

        const hashedPassword =
            await bcrypt.hash(password, 10);


        // -----------------------------------------
        // CREATE USER
        // -----------------------------------------

        const user =
            await User.create({

                name,

                email:
                    email.toLowerCase(),

                password:
                    hashedPassword,

                role,

                company:
                    role === "hr"
                        ? (company || "")
                        : ""
            });


        // -----------------------------------------
        // RETURN USER INFORMATION
        // -----------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "User registered successfully",

            data: {

                userId:
                    user._id,

                name:
                    user.name,

                email:
                    user.email,

                role:
                    user.role,

                company:
                    user.company
            }

        });

    } catch (error) {

        console.error(
            "Registration error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to register user"
        });

    }
};


// ---------------------------------------------
// LOGIN USER
// ---------------------------------------------

const loginUser = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // -----------------------------------------
        // VALIDATE REQUEST
        // -----------------------------------------

        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required"
            });

        }


        // -----------------------------------------
        // FIND USER
        // -----------------------------------------

        const user =
            await User.findOne({
                email: email.toLowerCase()
            });

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"
            });

        }


        // -----------------------------------------
        // VERIFY PASSWORD
        // -----------------------------------------

        const passwordValid =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordValid) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password"
            });

        }


        // -----------------------------------------
        // CREATE JWT
        // -----------------------------------------

        const token =
            jwt.sign(

                {
                    userId:
                        user._id.toString(),

                    role:
                        user.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "7d"
                }

            );


        // -----------------------------------------
        // RETURN LOGIN RESULT
        // -----------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Login successful",

            data: {

                token,

                user: {

                    userId:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email,

                    role:
                        user.role,

                    company:
                        user.company
                }

            }

        });

    } catch (error) {

        console.error(
            "Login error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to login"
        });

    }
};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {

    registerUser,

    loginUser

};