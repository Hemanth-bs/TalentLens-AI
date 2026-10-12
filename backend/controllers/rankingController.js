// ---------------------------------------------
// TALENTLENS AI - SECURE RANKING CONTROLLER
// ---------------------------------------------

// Import models
const JobDescription = require("../models/JobDescription");
const Application = require("../models/Application");
const Match = require("../models/Match");


// ---------------------------------------------
// RANK CANDIDATES FOR A JOB
// ---------------------------------------------
//
// GET /api/rankings/:jobId
//
// Security flow:
//
// HR JWT
//   ↓
// Protected route
//   ↓
// Verify HR owns the job
//   ↓
// Find applications for THIS job only
//   ↓
// Find persisted Match records
//   ↓
// Rank applicants by finalScore
//
// This controller deliberately does NOT rank every
// resume in the database.
//
// Only candidates who actually applied to the
// requested job are included.
// ---------------------------------------------

const rankCandidatesForJob = async (req, res) => {
    try {

        // -----------------------------------------
        // GET JOB ID
        // -----------------------------------------

        const { jobId } = req.params;


        // -----------------------------------------
        // FIND JOB
        // -----------------------------------------

        const job = await JobDescription.findById(jobId)
            .select(
                "title company description responsibilities location workMode employmentType salary contractPeriod minimumExperience education applicationDeadline jobStatus"
            )
            .lean();


        // -----------------------------------------
        // JOB NOT FOUND
        // -----------------------------------------

        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found."
            });
        }


        // -----------------------------------------
        // COMPANY AUTHORIZATION
        // -----------------------------------------
        //
        // HR can only rank candidates for jobs
        // belonging to their own company.
        // -----------------------------------------

        if (job.company !== req.user.company) {
            return res.status(403).json({
                success: false,
                message: "Access denied for this company."
            });
        }


        // -----------------------------------------
        // FIND APPLICATIONS FOR THIS JOB
        // -----------------------------------------
        //
        // IMPORTANT:
        //
        // We do NOT search all resumes.
        //
        // Only candidates who actually applied
        // to this particular job are considered.
        // -----------------------------------------

        const applications = await Application.find({
            job: jobId
        })
            .populate(
                "candidate",
                "name email"
            )
            .populate(
                "resume",
                "skills experience education projects certifications matchScore status"
            )
            .lean();


        // -----------------------------------------
        // NO APPLICANTS
        // -----------------------------------------

        if (applications.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No candidates have applied for this job.",
                data: {
                    jobId: job._id,
                    jobTitle: job.title,
                    company: job.company,
                    totalCandidates: 0,
                    candidates: []
                }
            });
        }


        // -----------------------------------------
        // GET APPLICATION IDS
        // -----------------------------------------

        const applicationIds = applications.map(
            (application) => application._id
        );


        // -----------------------------------------
        // FIND PERSISTED MATCH RESULTS
        // -----------------------------------------
        //
        // Match records are linked to applications,
        // resumes and jobs.
        //
        // We only retrieve matches belonging to
        // this job and these applications.
        // -----------------------------------------

        const matches = await Match.find({
            jobId: jobId,
            applicationId: { $in: applicationIds }
        })
            .lean();


        // -----------------------------------------
        // CREATE MATCH LOOKUP
        // -----------------------------------------

        const matchMap = new Map();

        matches.forEach((match) => {
            matchMap.set(
                match.applicationId.toString(),
                match
            );
        });


        // -----------------------------------------
        // BUILD RANKING DATA
        // -----------------------------------------

        const candidates = applications.map(
            (application) => {

                const match = matchMap.get(
                    application._id.toString()
                );

                const candidate = application.candidate || {};
                const resume = application.resume || {};

                return {
                    applicationId: application._id,

                    candidateId: candidate._id || null,

                    candidateName:
                        candidate.name ||
                        "Unknown Candidate",

                    email:
                        candidate.email ||
                        "not-provided@talentlens.ai",

                    applicationStatus:
                        application.status,

                    resumeId:
                        resume._id || null,

                    matchStatus:
                        match?.matchStatus || "stale",

                    matchScore:
                        match?.finalScore ??
                        resume.matchScore ??
                        0,

                    traditionalScore:
                        match?.traditionalScore ?? 0,

                    requiredSkillsScore:
                        match?.requiredSkillsScore ?? 0,

                    preferredSkillsScore:
                        match?.preferredSkillsScore ?? 0,

                    experienceScore:
                        match?.experienceScore ?? 0,

                    educationScore:
                        match?.educationScore ?? 0,

                    aiScore:
                        match?.aiScore ?? 0,

                    keywordScore:
                        match?.keywordScore ?? 0,

                    semanticScore:
                        match?.semanticScore ?? 0,

                    matchedRequiredSkills:
                        match?.matchedRequiredSkills || [],

                    missingRequiredSkills:
                        match?.missingRequiredSkills || [],

                    aiMatchedWords:
                        match?.aiMatchedWords || []
                };
            }
        );


        // -----------------------------------------
        // SORT BY FINAL SCORE
        // -----------------------------------------
        //
        // Highest persisted match score appears first.
        // -----------------------------------------

        candidates.sort(
            (a, b) =>
                Number(b.matchScore) -
                Number(a.matchScore)
        );


        // -----------------------------------------
        // ASSIGN RANK
        // -----------------------------------------

        candidates.forEach(
            (candidate, index) => {
                candidate.rank = index + 1;
            }
        );


        // -----------------------------------------
        // RETURN RESULT
        // -----------------------------------------

        return res.status(200).json({
            success: true,
            message: "Candidates ranked successfully.",
            data: {
                jobId: job._id,
                jobTitle: job.title,
                company: job.company,
                totalCandidates: candidates.length,
                candidates
            }
        });

    } catch (error) {

        // -----------------------------------------
        // ERROR HANDLING
        // -----------------------------------------

        console.error(
            "Ranking controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to rank candidates.",
            error: error.message
        });
    }
};


// ---------------------------------------------
// EXPORT CONTROLLER
// ---------------------------------------------

module.exports = {
    rankCandidatesForJob
};