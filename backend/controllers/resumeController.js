// Import the Resume model
const Resume = require("../models/Resume");


// ---------------------------------------------
// CREATE RESUME
// ---------------------------------------------
// Creates a resume for the currently logged-in candidate.
// The candidate ID always comes from the JWT user,
// not from frontend input.
const createResume = async (req, res) => {
    try {
        const {
            candidateName,
            email,
            skills,
            experience,
            education,
            resumeText,
            jobDescription
        } = req.body;

        const resume = await Resume.create({
            candidate: req.user._id,
            candidateName: req.user.name || candidateName,
            email: req.user.email || email,
            skills,
            experience,
            education,
            resumeText,
            jobDescription,
            status: "uploaded"
        });

        res.status(201).json({
            success: true,
            message: "Resume created successfully",
            data: resume
        });

    } catch (error) {
        console.error(
            "Create resume error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to create resume"
        });
    }
};


// ---------------------------------------------
// GET MY RESUMES
// ---------------------------------------------
// Returns only resumes belonging to the
// currently logged-in candidate.
const getResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({
            candidate: req.user._id
        }).sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: resumes.length,
            data: resumes
        });

    } catch (error) {
        console.error(
            "Get resumes error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve resumes"
        });
    }
};


// ---------------------------------------------
// GET SINGLE RESUME
// ---------------------------------------------
// A candidate can retrieve only their own resume.
const getResumeById = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            candidate: req.user._id
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            data: resume
        });

    } catch (error) {
        console.error(
            "Get resume error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to retrieve resume"
        });
    }
};


// ---------------------------------------------
// UPDATE RESUME
// ---------------------------------------------
// Updates only a resume belonging to the
// currently logged-in candidate.
const updateResume = async (req, res) => {
    try {
        const resumeId = req.params.id;

        // Prevent the client from changing ownership.
        const {
            candidate,
            _id,
            createdAt,
            updatedAt,
            ...updateData
        } = req.body;

        const updatedResume =
            await Resume.findOneAndUpdate(
                {
                    _id: resumeId,
                    candidate: req.user._id
                },
                updateData,
                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedResume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message: "Resume updated successfully",
            data: updatedResume
        });

    } catch (error) {
        console.error(
            "Update resume error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to update resume"
        });
    }
};


// ---------------------------------------------
// DELETE RESUME
// ---------------------------------------------
// Deletes only a resume belonging to the
// currently logged-in candidate.
const deleteResume = async (req, res) => {
    try {
        const resumeId = req.params.id;

        const deletedResume =
            await Resume.findOneAndDelete({
                _id: resumeId,
                candidate: req.user._id
            });

        if (!deletedResume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found or access denied"
            });
        }

        res.status(200).json({
            success: true,
            message: "Resume deleted successfully",
            data: deletedResume
        });

    } catch (error) {
        console.error(
            "Delete resume error:",
            error.message
        );

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