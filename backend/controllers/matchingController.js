// ---------------------------------------------
// MATCHING CONTROLLER
// ---------------------------------------------


// ---------------------------------------------
// IMPORT MODELS
// ---------------------------------------------

const Resume = require("../models/Resume");

const JobDescription = require("../models/JobDescription");

const Application = require("../models/Application");

const Match = require("../models/Match");


// ---------------------------------------------
// IMPORT MATCHING SERVICES
// ---------------------------------------------

const {
    matchCandidateToJob
} = require("../services/matchingService");


const {
    getAIAnalysis
} = require("../services/aiService");


// ---------------------------------------------
// MATCH RESUME TO JOB
// ---------------------------------------------
//
// Calculates traditional + AI matching,
// persists the result and connects the Match
// to the candidate's actual Application.
//
// ---------------------------------------------

const matchResumeToJob = async (req, res) => {

    try {

        // -----------------------------------------
        // 1. GET REQUEST DATA
        // -----------------------------------------

        const {
            resumeId,
            jobId
        } = req.body;


        // -----------------------------------------
        // 2. VALIDATE INPUT
        // -----------------------------------------

        if (!resumeId || !jobId) {

            return res.status(400).json({

                success: false,

                message:
                    "resumeId and jobId are required"

            });

        }


        // -----------------------------------------
        // 3. FIND RESUME
        // -----------------------------------------

        const resume =
            await Resume.findById(resumeId);


        if (!resume) {

            return res.status(404).json({

                success: false,

                message:
                    "Resume not found"

            });

        }


        // -----------------------------------------
        // 4. FIND JOB
        // -----------------------------------------

        const job =
            await JobDescription.findById(jobId);


        if (!job) {

            return res.status(404).json({

                success: false,

                message:
                    "Job not found"

            });

        }


        // -----------------------------------------
        // 5. VERIFY HR COMPANY ACCESS
        // -----------------------------------------

        if (
            req.user.company &&
            job.company !== req.user.company
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not authorized to evaluate candidates for this job"

            });

        }


        // -----------------------------------------
        // 6. FIND APPLICATION
        // -----------------------------------------
        //
        // A match should only be generated for an
        // actual application.
        //
        // The application must connect the same:
        // - candidate
        // - job
        // - resume
        //
        // -----------------------------------------

        const application =
            await Application.findOne({

                job:
                    job._id,

                resume:
                    resume._id

            });


        if (!application) {

            return res.status(404).json({

                success: false,

                message:
                    "No application found for this resume and job"

            });

        }


        // -----------------------------------------
        // 7. VERIFY APPLICATION RESUME
        // -----------------------------------------

        if (
            application.resume &&
            application.resume.toString() !==
            resume._id.toString()
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Application and resume do not match"

            });

        }


        // -----------------------------------------
        // 8. TRADITIONAL MATCHING
        // -----------------------------------------

        const traditionalMatch =
            matchCandidateToJob(
                resume,
                job
            );


        // -----------------------------------------
        // 9. AI + RAG ANALYSIS
        // -----------------------------------------

        const aiResult =
            await getAIAnalysis(

                resume.resumeText,

                job.description,

                job._id.toString()

            );


        // -----------------------------------------
        // 10. VALIDATE AI RESPONSE
        // -----------------------------------------

        if (
            !aiResult ||
            !aiResult.data ||
            !aiResult.data.match
        ) {

            return res.status(500).json({

                success: false,

                message:
                    "AI matching service returned an invalid response"

            });

        }


        // -----------------------------------------
        // 11. EXTRACT AI RESULTS
        // -----------------------------------------

        const aiMatch =
            aiResult.data.match;


        const aiAnalysis =
            aiResult.data.analysis;


        // FastAPI returns RAG evidence as
        // data.rag_chunks.

        const ragChunks =
            aiResult.data.rag_chunks || [];


        // -----------------------------------------
        // 12. AI SCORE
        // -----------------------------------------

        const aiMatchScore =
            Number(
                aiMatch.final_score || 0
            );


        // -----------------------------------------
        // 13. FINAL SCORE
        // -----------------------------------------
        //
        // Traditional matching = 40%
        // AI matching = 60%
        //
        // -----------------------------------------

        const finalScore =
            Number(
                (
                    (
                        traditionalMatch.overallScore *
                        0.40
                    ) +
                    (
                        aiMatchScore *
                        0.60
                    )
                ).toFixed(2)
            );


        // -----------------------------------------
        // 14. PREPARE MATCH DATA
        // -----------------------------------------

       const matchData = {

    applicationId:
        application._id,

    resumeId:
        resume._id,

    jobId:
        job._id,

    traditionalScore:
        traditionalMatch.overallScore,

    requiredSkillsScore:
        traditionalMatch
            .requiredSkills
            .score,

    preferredSkillsScore:
        traditionalMatch
            .preferredSkills
            .score,

    experienceScore:
        traditionalMatch
            .experience
            .score,

    educationScore:
        traditionalMatch
            .education
            .score,

    aiScore:
        aiMatchScore,

    keywordScore:
        Number(
            aiMatch.keyword_score || 0
        ),

    semanticScore:
        Number(
            aiMatch.semantic_score || 0
        ),

    finalScore:
        finalScore,

    matchedRequiredSkills:
        traditionalMatch
            .requiredSkills
            .matched,

    missingRequiredSkills:
        traditionalMatch
            .requiredSkills
            .missing,

    aiMatchedWords:
        aiMatch.matched_words || [],

    // -----------------------------------------
    // PERSIST AI ANALYSIS
    // -----------------------------------------

    aiAnalysis:
        aiAnalysis || null,

    // -----------------------------------------
    // PERSIST RAG EVIDENCE
    // -----------------------------------------

    ragEvidence:
        ragChunks || [],

    // A newly calculated match is always current.
    matchStatus:
        "current"
};


        // -----------------------------------------
        // 15. SAVE / UPDATE MATCH
        // -----------------------------------------
        //
        // Existing resume/job Match records are
        // updated with the application reference.
        //
        // A fresh calculation resets stale → current.
        //
        // -----------------------------------------

        const savedMatch =
            await Match.findOneAndUpdate(

                {
                    resumeId:
                        resume._id,

                    jobId:
                        job._id

                },

                matchData,

                {
                    new: true,

                    upsert: true,

                    runValidators: true,

                    setDefaultsOnInsert: true

                }

            );


        // -----------------------------------------
        // 16. UPDATE RESUME MATCH SCORE
        // -----------------------------------------

        resume.matchScore =
            finalScore;

        resume.status =
            "processed";

        await resume.save();


        // -----------------------------------------
        // 17. RETURN RESULT
        // -----------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Resume matched with job using AI successfully",

            data: {

                matchId:
                    savedMatch._id,

                applicationId:
                    application._id,

                resumeId:
                    resume._id,

                jobId:
                    job._id,

                candidateName:
                    resume.candidateName,

                jobTitle:
                    job.title,

                company:
                    job.company,

                matchScore:
                    finalScore,

                traditionalMatch,

                aiMatch,

                analysis:
                    aiAnalysis,

                ragEvidence:
                    ragChunks,

                persisted:
                    true,

                applicationLinked:
                    true,

                status:
                    "matched"

            }

        });


    } catch (error) {

        // -----------------------------------------
        // ERROR HANDLING
        // -----------------------------------------

        console.error(
            "Matching error:",
            error
        );


        // -----------------------------------------
        // AI SERVICE UNAVAILABLE
        // -----------------------------------------
        //
        // When FastAPI is not running, Node's fetch
        // reports ECONNREFUSED against port 8000.
        //
        // Return a specific 503 response so the
        // frontend can show a useful message.
        // -----------------------------------------

        const aiServiceUnavailable =
            error?.code === "ECONNREFUSED" ||
            error?.cause?.code === "ECONNREFUSED";


        if (aiServiceUnavailable) {

            return res.status(503).json({

                success: false,

                message:
                    "AI service is currently unavailable. Please start the AI service and try again."

            });

        }


        // -----------------------------------------
        // AI SERVICE TIMEOUT
        // -----------------------------------------

        const aiServiceTimeout =
            error?.code === "ETIMEDOUT" ||
            error?.cause?.code === "ETIMEDOUT";


        if (aiServiceTimeout) {

            return res.status(503).json({

                success: false,

                message:
                    "AI service is taking too long to respond. Please try again."

            });

        }


        // -----------------------------------------
        // GENERIC MATCHING ERROR
        // -----------------------------------------

        return res.status(500).json({

            success: false,

            message:
                "Failed to match resume with job",

            error:
                error.message

        });

    }

};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    matchResumeToJob
};