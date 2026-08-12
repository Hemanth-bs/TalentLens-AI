// Import the Resume model
const Resume = require("../models/Resume");

// Create a new resume
const createResume = async (req, res) => {
    try {
        // Get resume data sent by the frontend
        const {
            candidateName,
            email,
            skills,
            experience,
            education,
            resumeText,
            jobDescription
        } = req.body;

        // Create a new Resume document
        const resume = await Resume.create({
            candidateName,
            email,
            skills,
            experience,
            education,
            resumeText,
            jobDescription,
            status: "uploaded"
        });

        // Send successful response
        res.status(201).json({
            success: true,
            message: "Resume created successfully",
            data: resume
        });

    } catch (error) {
        // Handle errors
        console.error("Create resume error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to create resume"
        });
    }
};

// Export controller
module.exports = {
    createResume
};