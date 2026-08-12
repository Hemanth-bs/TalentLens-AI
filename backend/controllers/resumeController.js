// Import the Resume model
const Resume = require("../models/Resume");


// ---------------------------------------------
// CREATE RESUME
// ---------------------------------------------

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


// ---------------------------------------------
// GET ALL RESUMES
// ---------------------------------------------

// Get all resumes from MongoDB
const getResumes = async (req, res) => {
    try {
        // Retrieve all resumes
        // Newest resumes appear first
        const resumes = await Resume.find().sort({ createdAt: -1 });

        // Send resumes to the client
        res.status(200).json({
            success: true,
            count: resumes.length,
            data: resumes
        });

    } catch (error) {
        // Handle database errors
        console.error("Get resumes error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve resumes"
        });
    }
};


// ---------------------------------------------
// EXPORT CONTROLLERS
// ---------------------------------------------

// ---------------------------------------------
// GET SINGLE RESUME
// ---------------------------------------------

// Get one resume using its MongoDB ID
const getResumeById = async (req, res) => {
    try {
        // Get the ID from the URL
        const resume = await Resume.findById(req.params.id);

        // Resume doesn't exist
        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        // Send the resume
        res.status(200).json({
            success: true,
            data: resume
        });

    } catch (error) {
        console.error("Get resume error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve resume"
        });
    }
};

// ---------------------------------------------
// UPDATE RESUME
// ---------------------------------------------

// Update an existing resume using its MongoDB ID
const updateResume = async (req, res) => {
    try {
        // Get the resume ID from the URL
        const resumeId = req.params.id;

        // Update the resume with the data sent in the request
        const updatedResume = await Resume.findByIdAndUpdate(
            resumeId,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        // Resume doesn't exist
        if (!updatedResume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        // Send the updated resume
        res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            data: updatedResume
        });

    } catch (error) {
        console.error("Update resume error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to update resume"
        });
    }
};

// ---------------------------------------------
// DELETE RESUME
// ---------------------------------------------

// Delete a resume using its MongoDB ID
const deleteResume = async (req, res) => {
    try {
        // Get the resume ID from the URL
        const resumeId = req.params.id;

        // Find and delete the resume
        const deletedResume = await Resume.findByIdAndDelete(resumeId);

        // Resume doesn't exist
        if (!deletedResume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });
        }

        // Send success response
        res.status(200).json({
            success: true,
            message: "Resume deleted successfully",
            data: deletedResume
        });

    } catch (error) {
        console.error("Delete resume error:", error.message);

        res.status(500).json({
            success: false,
            message: "Failed to delete resume"
        });
    }
};

module.exports = {
    createResume,
    getResumes,
    getResumeById,
    updateResume,
    deleteResume
};