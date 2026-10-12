// ---------------------------------------------
// TALENTLENS AI - RESUME UPLOAD CONTROLLER
// ---------------------------------------------

// Import the Resume model
const Resume = require("../models/Resume");

// Import resume text extraction service
const {
    extractResumeText
} = require("../services/resumeParserService");

// Import resume intelligence service
const {
    analyzeResume
} = require("../services/resumeIntelligenceService");

// Import FastAPI AI service
const {
    indexDocument
} = require("../services/aiService");


// ---------------------------------------------
// UPLOAD AND PROCESS RESUME
// ---------------------------------------------

const uploadResume = async (req, res) => {

    try {

        // -----------------------------------------
        // 1. CHECK AUTHENTICATED USER
        // -----------------------------------------

        if (!req.user) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }


        // -----------------------------------------
        // 2. CHECK FILE
        // -----------------------------------------

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Please upload a PDF or DOCX resume"
            });

        }


        // -----------------------------------------
        // 3. EXTRACT RESUME TEXT
        // -----------------------------------------

        const resumeText =
            await extractResumeText(req.file);


        // -----------------------------------------
        // 4. VALIDATE EXTRACTED TEXT
        // -----------------------------------------

        if (
            !resumeText ||
            resumeText.trim().length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Could not extract text from the resume"
            });

        }


        // -----------------------------------------
        // 5. CREATE RESUME IN MONGODB
        // -----------------------------------------

        const resume =
            await Resume.create({

                // Link resume to authenticated candidate
                candidate:
                    req.user._id,

                // Use authenticated user details
                candidateName:
                    req.user.name,

                email:
                    req.user.email,

                // Initial resume data
                skills: [],

                experience: 0,

                education: "",

                projects: [],

                certifications: [],

                resumeText:
                    resumeText.trim(),

                jobDescription: "",

                matchScore: 0,

                status: "uploaded"

            });


        // -----------------------------------------
        // 6. RUN RESUME INTELLIGENCE
        // -----------------------------------------

        try {

            const analysis =
                analyzeResume(
                    resume.resumeText
                );


            // Store extracted skills
            resume.skills =
                analysis.skills || [];


            // Store experience
            resume.experience =
                analysis.experience || 0;


            // Store education
            resume.education =
                analysis.education || "";


            // Store projects
            resume.projects =
                analysis.projects || [];


            // Store certifications
            resume.certifications =
                analysis.certifications || [];


            // Save structured resume intelligence
            await resume.save();


        } catch (intelligenceError) {

            console.error(
                "Resume intelligence error:",
                intelligenceError.message
            );


            resume.status = "failed";

            await resume.save();


            return res.status(500).json({

                success: false,

                message:
                    "Resume uploaded, but resume intelligence processing failed",

                data: {

                    resumeId:
                        resume._id,

                    status:
                        resume.status

                }

            });

        }


        // -----------------------------------------
        // 7. INDEX RESUME INTO RAG
        // -----------------------------------------

        try {

            await indexDocument(

                // Use MongoDB resume ID
                // as ChromaDB document ID
                resume._id.toString(),

                // Index extracted resume text
                resume.resumeText,

                // Metadata
                {
                    type:
                        "resume",

                    candidateId:
                        req.user._id.toString(),

                    candidateName:
                        resume.candidateName,

                    fileName:
                        req.file.originalname
                }

            );


            // -------------------------------------
            // 8. RAG INDEXING SUCCESS
            // -------------------------------------

            resume.status =
                "processed";

            await resume.save();


        } catch (ragError) {

            // -------------------------------------
            // 9. RAG INDEXING FAILURE
            // -------------------------------------

            console.error(
                "RAG resume indexing error:",
                ragError.message
            );


            resume.status =
                "failed";

            await resume.save();


            return res.status(500).json({

                success: false,

                message:
                    "Resume was uploaded and analyzed, but RAG indexing failed",

                data: {

                    resumeId:
                        resume._id,

                    status:
                        resume.status

                }

            });

        }


        // -----------------------------------------
        // 10. RETURN SUCCESS RESPONSE
        // -----------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Resume uploaded, analyzed and indexed successfully",

            data: {

                resumeId:
                    resume._id,

                candidateId:
                    req.user._id,

                fileName:
                    req.file.originalname,

                fileType:
                    req.file.mimetype,

                fileSize:
                    req.file.size,

                extractedTextLength:
                    resume.resumeText.length,

                resumeText:
                    resume.resumeText,

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
            "Resume upload error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to upload resume",

            error:
                error.message

        });

    }

};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    uploadResume
};