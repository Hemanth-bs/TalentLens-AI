// ---------------------------------------------
// TALENTLENS AI - RESUME UPLOAD CONTROLLER
// ---------------------------------------------

// Import the Resume model
const Resume = require("../models/Resume");

// Import resume text extraction service
const {
    extractResumeText
} = require("../services/resumeParserService");

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
        // 1. CHECK FILE
        // -----------------------------------------

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Please upload a PDF or DOCX resume"

            });

        }


        // -----------------------------------------
        // 2. EXTRACT RESUME TEXT
        // -----------------------------------------

        const resumeText =
            await extractResumeText(req.file);


        // -----------------------------------------
        // 3. VALIDATE EXTRACTED TEXT
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
        // 4. CREATE RESUME IN MONGODB
        // -----------------------------------------

        const resume =
            await Resume.create({

                candidateName:
                    "Uploaded Candidate",

                email:
                    "not-provided@talentlens.ai",

                skills: [],

                experience: 0,

                education: "",

                resumeText:
                    resumeText.trim(),

                jobDescription: "",

                matchScore: 0,

                status: "uploaded"

            });


        // -----------------------------------------
        // 5. INDEX RESUME INTO RAG
        // -----------------------------------------

        try {

            await indexDocument(

                // Use MongoDB resume ID as the
                // ChromaDB document ID
                resume._id.toString(),

                // Index extracted resume text
                resume.resumeText,

                {
                    type:
                        "resume",

                    candidateName:
                        resume.candidateName,

                    fileName:
                        req.file.originalname
                }

            );


            // -------------------------------------
            // 6. RAG INDEXING SUCCESS
            // -------------------------------------

            resume.status =
                "processed";

            await resume.save();


        } catch (ragError) {

            // -------------------------------------
            // 7. RAG INDEXING FAILURE
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
                    "Resume was uploaded, but RAG indexing failed",

                data: {

                    resumeId:
                        resume._id,

                    status:
                        resume.status

                }

            });

        }


        // -----------------------------------------
        // 8. RETURN SUCCESS RESPONSE
        // -----------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Resume uploaded, processed and indexed successfully",

            data: {

                resumeId:
                    resume._id,

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

                status:
                    resume.status

            }

        });


    } catch (error) {

        // -----------------------------------------
        // ERROR HANDLING
        // -----------------------------------------

        console.error(
            "Resume upload error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to upload and process resume"

        });

    }

};


// ---------------------------------------------
// EXPORT CONTROLLER
// ---------------------------------------------

module.exports = {
    uploadResume
};