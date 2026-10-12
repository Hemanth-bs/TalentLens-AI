// Import Resume model
const Resume = require("../models/Resume");

// Import resume intelligence service
const {
    analyzeResume
} = require("../services/resumeIntelligenceService");


// ---------------------------------------------
// ANALYZE RESUME
// ---------------------------------------------

const analyzeResumeController = async (req, res) => {

    try {

        // -----------------------------------------
        // 1. FIND RESUME
        // -----------------------------------------

        const resume =
            await Resume.findById(
                req.params.id
            );


        // -----------------------------------------
        // 2. CHECK RESUME
        // -----------------------------------------

        if (!resume) {

            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });

        }


        // -----------------------------------------
        // 3. CHECK EXTRACTED TEXT
        // -----------------------------------------

        if (
            !resume.resumeText ||
            !resume.resumeText.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Resume does not contain extracted text"
            });

        }


        // -----------------------------------------
        // 4. ANALYZE RESUME
        // -----------------------------------------

        const analysis =
            analyzeResume(
                resume.resumeText
            );


        // -----------------------------------------
        // 5. STORE STRUCTURED INFORMATION
        // -----------------------------------------

        resume.skills =
            analysis.skills || [];

        resume.experience =
            analysis.experience || 0;

        resume.education =
            analysis.education || "";

        resume.projects =
            analysis.projects || [];

        resume.certifications =
            analysis.certifications || [];


        // -----------------------------------------
        // 6. USE VALID RESUME STATUS
        // -----------------------------------------
        //
        // Resume.js only allows:
        // uploaded
        // processed
        // failed
        //
        // Therefore we use "processed".
        //

        resume.status =
            "processed";


        // -----------------------------------------
        // 7. SAVE RESUME
        // -----------------------------------------

        await resume.save();


        // -----------------------------------------
        // 8. RETURN RESULT
        // -----------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Resume analyzed successfully",

            data: {

                resumeId:
                    resume._id,

                candidateName:
                    resume.candidateName,

                skills:
                    resume.skills,

                experience:
                    resume.experience,

                education:
                    resume.education,

                projects:
                    resume.projects,

                certifications:
                    resume.certifications,

                status:
                    resume.status
            }

        });


    } catch (error) {

        console.error(
            "Resume intelligence error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to analyze resume",

            error:
                error.message
        });

    }

};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    analyzeResumeController
};