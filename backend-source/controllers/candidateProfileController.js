// Import the CandidateProfile model.
// This model stores the editable profile of each candidate.
const CandidateProfile = require("../models/CandidateProfile");


// ---------------------------------------------
// GET CANDIDATE PROFILE
// ---------------------------------------------
// Returns the profile belonging to the logged-in candidate.

const getCandidateProfile = async (req, res) => {
    try {

        // Find the profile using the authenticated user's ID.
        const profile = await CandidateProfile.findOne({
            user: req.user._id
        });

        // If the candidate has not created a profile yet,
        // return an empty profile instead of an error.
        if (!profile) {
            return res.status(200).json({
                success: true,
                message: "Candidate profile not created yet.",
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: "Candidate profile fetched successfully.",
            data: profile
        });

    } catch (error) {

        console.error(
            "Get candidate profile error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch candidate profile."
        });
    }
};


// ---------------------------------------------
// CREATE / UPDATE CANDIDATE PROFILE
// ---------------------------------------------
// Creates the profile if it doesn't exist.
// Otherwise updates the existing profile.

const updateCandidateProfile = async (req, res) => {
    try {

        // Only accept fields that belong to the candidate profile.
        // This prevents users from modifying protected User fields
        // such as role, email, or password through this endpoint.
        const {
            phone,
            location,
            bio,
            skills,
            education,
            experience,
            projects,
            certifications,
            linkedin,
            github
        } = req.body;


        // Find existing profile for the logged-in candidate.
        let profile = await CandidateProfile.findOne({
            user: req.user._id
        });


        // -----------------------------------------
        // CREATE PROFILE
        // -----------------------------------------

        if (!profile) {

            profile = await CandidateProfile.create({
                user: req.user._id,
                phone: phone || "",
                location: location || "",
                bio: bio || "",
                skills: Array.isArray(skills) ? skills : [],
                education: education || "",
                experience: experience || 0,
                projects: Array.isArray(projects) ? projects : [],
                certifications:
                    Array.isArray(certifications)
                        ? certifications
                        : [],
                linkedin: linkedin || "",
                github: github || ""
            });

        }

        // -----------------------------------------
        // UPDATE PROFILE
        // -----------------------------------------

        else {

            profile.phone = phone ?? profile.phone;
            profile.location = location ?? profile.location;
            profile.bio = bio ?? profile.bio;

            if (Array.isArray(skills)) {
                profile.skills = skills;
            }

            profile.education =
                education ?? profile.education;

            profile.experience =
                experience ?? profile.experience;

            if (Array.isArray(projects)) {
                profile.projects = projects;
            }

            if (Array.isArray(certifications)) {
                profile.certifications = certifications;
            }

            profile.linkedin =
                linkedin ?? profile.linkedin;

            profile.github =
                github ?? profile.github;

            await profile.save();
        }


        res.status(200).json({
            success: true,
            message: "Candidate profile saved successfully.",
            data: profile
        });

    } catch (error) {

        console.error(
            "Update candidate profile error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to save candidate profile."
        });
    }
};


// ---------------------------------------------
// EXPORT CONTROLLERS
// ---------------------------------------------

module.exports = {
    getCandidateProfile,
    updateCandidateProfile
};