// ---------------------------------------------
// TALENTLENS AI - MATCHING CONTROLLER
// ---------------------------------------------

// Import models
const Resume = require("../models/Resume");
const JobDescription = require("../models/JobDescription");

// Import traditional matching service
const {
    matchCandidateToJob
} = require("../services/matchingService");

// Import complete FastAPI AI analysis service
const {
    getAIAnalysis
} = require("../services/aiService");


// ---------------------------------------------
// MATCH RESUME WITH JOB
// --------------------------------------------

const matchResumeToJob = async (req, res) => {

    try {

        // -----------------------------------------
        // 1. GET RESUME AND JOB IDs
        // -----------------------------------------

        const {
            resumeId,
            jobId
        } = req.body;


        // -----------------------------------------
        // 2. VALIDATE REQUEST
        // -----------------------------------------

        if (!resumeId || !jobId) {

            return res.status(400).json({
                success: false,
                message: "resumeId and jobId are required"
            });

        }


        // -----------------------------------------
        // 3. FIND RESUME
        // -----------------------------------------

        const resume = await Resume.findById(resumeId);

        if (!resume) {

            return res.status(404).json({
                success: false,
                message: "Resume not found"
            });

        }


        // -----------------------------------------
        // 4. FIND JOB DESCRIPTION
        // -----------------------------------------

        const job = await JobDescription.findById(jobId);

        if (!job) {

            return res.status(404).json({
                success: false,
                message: "Job description not found"
            });

        }


        // -----------------------------------------
        // 5. TRADITIONAL BACKEND MATCHING
        // -----------------------------------------

        // Existing Node.js matching logic.
        //
        // This checks structured information such as:
        // - required skills
        // - preferred skills
        // - experience
        // - education

        const matchResult =
            matchCandidateToJob(
                resume,
                job
            );


        // -----------------------------------------
        // 6. COMPLETE AI ANALYSIS
        // -----------------------------------------

        // Send the resume and job description
        // to the FastAPI AI service.
        //
        // FastAPI performs:
        // - keyword matching
        // - semantic matching
        // - skill matching
        // - RAG retrieval
        // - LLM analysis

        const aiResult = await getAIAnalysis(
            resume.resumeText,
            job.description,
            job._id.toString()
        );


        // -----------------------------------------
        // 7. VALIDATE AI RESPONSE
        // -----------------------------------------

        if (
            !aiResult ||
            !aiResult.data ||
            !aiResult.data.match
        ) {

            throw new Error(
                "Invalid response received from AI service"
            );

        }


        // -----------------------------------------
        // 8. EXTRACT AI RESULTS
        // -----------------------------------------

        const aiMatch =
            aiResult.data.match;

        const aiAnalysis =
            aiResult.data.analysis;

        const ragChunks =
            aiResult.data.rag_chunks || [];


        // AI's combined score from FastAPI
        const aiMatchScore =
            Number(aiMatch.final_score);


        // -----------------------------------------
        // 9. COMBINE TRADITIONAL + AI SCORES
        // -----------------------------------------

        // Traditional backend matching = 40%
        // Complete AI matching = 60%

        const finalScore =
            Math.round(
                (
                    Number(matchResult.overallScore) * 0.40
                    +
                    aiMatchScore * 0.60
                ) * 100
            ) / 100;


        // -----------------------------------------
        // 10. STORE FINAL SCORE
        // -----------------------------------------

        resume.matchScore =
            finalScore;

        resume.status =
            "processed";

        await resume.save();


        // -----------------------------------------
        // 11. RETURN COMPLETE RESULT
        // -----------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Resume matched with job using AI successfully",

            data: {

                // ---------------------------------
                // BASIC INFORMATION
                // ---------------------------------

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


                // ---------------------------------
                // FINAL SCORE
                // ---------------------------------

                matchScore:
                    finalScore,


                // ---------------------------------
                // TRADITIONAL BACKEND MATCH
                // ---------------------------------

                traditionalMatch: {

                    score:
                        matchResult.overallScore,

                    requiredSkills:
                        matchResult.requiredSkills,

                    preferredSkills:
                        matchResult.preferredSkills,

                    experience:
                        matchResult.experience,

                    education:
                        matchResult.education

                },


                // ---------------------------------
                // AI MATCHING
                // ---------------------------------

                aiMatch: {

                    finalScore:
                        aiMatch.final_score,

                    skillScore:
                        aiMatch.skill_score,

                    semanticScore:
                        aiMatch.semantic_score,

                    keywordScore:
                        aiMatch.keyword_score,

                    matchedWords:
                        aiMatch.matched_words,

                    candidateSkills:
                        aiMatch.candidate_skills,

                    requiredSkills:
                        aiMatch.required_skills,

                    matchedSkills:
                        aiMatch.matched_skills,

                    missingSkills:
                        aiMatch.missing_skills,

                    transferableSkills:
                        aiMatch.transferable_skills

                },


                // ---------------------------------
                // LLM ANALYSIS
                // ---------------------------------

                analysis: {

                    matchedSkills:
                        aiAnalysis.matched_skills,

                    missingSkills:
                        aiAnalysis.missing_skills,

                    transferableSkills:
                        aiAnalysis.transferable_skills,

                    relevantExperience:
                        aiAnalysis.relevant_experience,

                    strengths:
                        aiAnalysis.strengths,

                    areasForImprovement:
                        aiAnalysis.areas_for_improvement,

                    hrRecommendation:
                        aiAnalysis.hr_recommendation,

                    candidateFeedback:
                        aiAnalysis.candidate_feedback

                },


                // ---------------------------------
                // RAG EVIDENCE
                // ---------------------------------

                ragEvidence:
                    ragChunks,


                // ---------------------------------
                // STATUS
                // ---------------------------------

                status:
                    "matched"

            }

        });

    } catch (error) {

        // -----------------------------------------
        // ERROR HANDLING
        // -----------------------------------------

        console.error(
            "AI matching error:",
            error
        );

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