// ---------------------------------------------
// IMPORT MODELS
// ---------------------------------------------

const Application = require("../models/Application");

const JobDescription = require("../models/JobDescription");

const CandidateProfile = require("../models/CandidateProfile");

const Resume = require("../models/Resume");

const Match = require("../models/Match");



// ---------------------------------------------
// APPLY FOR A JOB
// ---------------------------------------------

const applyForJob = async (req, res) => {

    try {

        const {
            jobId
        } = req.body;



        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required."
            });
        }



        const job = await JobDescription.findById(jobId);



        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found."
            });
        }



        const existingApplication = await Application.findOne({
            candidate: req.user._id,
            job: jobId
        });



        if (existingApplication) {
            return res.status(409).json({
                success: false,
                message: "You have already applied for this job."
            });
        }



        const candidateProfile = await CandidateProfile.findOne({
            user: req.user._id
        });



        const candidateResume = await Resume.findOne({
            candidate: req.user._id,
            status: "processed"
        }).sort({
            createdAt: -1
        });



        const application = await Application.create({
            candidate: req.user._id,
            job: jobId,
            candidateProfile: candidateProfile
                ? candidateProfile._id
                : null,
            resume: candidateResume
                ? candidateResume._id
                : null,
            status: "Applied"
        });



        res.status(201).json({
            success: true,
            message: "Application submitted successfully.",
            data: application
        });



    } catch (error) {

        console.error(
            "Apply for job error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to submit application."
        });

    }

};



// ---------------------------------------------
// GET MY APPLICATIONS
// ---------------------------------------------

const getMyApplications = async (req, res) => {

    try {

        const applications = await Application.find({
            candidate: req.user._id
        })
            .populate(
                "job",
                "title company description minimumExperience education"
            )
            .populate(
                "resume",
                "candidateName email skills experience education status"
            )
            .sort({
                createdAt: -1
            });



        res.status(200).json({
            success: true,
            message: "Applications fetched successfully.",
            data: applications
        });



    } catch (error) {

        console.error(
            "Get my applications error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch applications."
        });

    }

};



// ---------------------------------------------
// GET HR APPLICATIONS
// ---------------------------------------------

const getHRApplications = async (req, res) => {

    try {

        const jobs = await JobDescription.find({
            company: req.user.company
        }).select("_id");



        const jobIds = jobs.map(
            (job) => job._id
        );



        const applications = await Application.find({
            job: {
                $in: jobIds
            }
        })
            .populate(
                "candidate",
                "name email"
            )
            .populate(
                "candidateProfile",
                "phone location bio skills education experience projects certifications linkedin github"
            )
            .populate(
                "resume",
                "candidateName email skills experience education resumeText matchScore status"
            )
            .populate(
                "job",
                "title company description minimumExperience education responsibilities"
            )
            .sort({
                createdAt: -1
            });



        res.status(200).json({
            success: true,
            message: "HR applications fetched successfully.",
            data: applications
        });



    } catch (error) {

        console.error(
            "Get HR applications error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch applications."
        });

    }

};



// ---------------------------------------------
// GET HR CANDIDATE ANALYSIS
// ---------------------------------------------

const getHRCandidateAnalysis = async (req, res) => {

    try {

        const {
            applicationId
        } = req.params;



        if (!applicationId) {
            return res.status(400).json({
                success: false,
                message: "Application ID is required."
            });
        }



        const application =
            await Application.findById(applicationId)
                .populate(
                    "candidate",
                    "name email"
                )
                .populate(
                    "candidateProfile",
                    "phone location bio skills education experience projects certifications linkedin github"
                )
                .populate(
                    "resume",
                    "candidateName email skills experience education projects certifications resumeText matchScore status"
                )
                .populate(
                    "job",
                    "title company description responsibilities location workMode employmentType salary contractPeriod minimumExperience education applicationDeadline jobStatus"
                );



        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }



        if (
            !application.job ||
            application.job.company !== req.user.company
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to view this candidate analysis."
            });
        }



        const match = await Match.findOne({
            applicationId: application._id,
            resumeId: application.resume
                ? application.resume._id
                : null,
            jobId: application.job
                ? application.job._id
                : null
        });



        if (!match) {
            return res.status(404).json({
                success: false,
                message:
                    "Candidate analysis is not available yet. Match the candidate first."
            });
        }



        return res.status(200).json({

            success: true,

            message:
                "HR candidate analysis fetched successfully.",

            data: {

                application: {

                    id:
                        application._id,

                    status:
                        application.status,

                    appliedAt:
                        application.createdAt
                },



                candidate: {

                    id:
                        application.candidate
                            ? application.candidate._id
                            : null,

                    name:
                        application.candidate
                            ? application.candidate.name
                            : null,

                    email:
                        application.candidate
                            ? application.candidate.email
                            : null
                },



                candidateProfile:
                    application.candidateProfile,



                resume:
                    application.resume,



                job: {

                    id:
                        application.job
                            ? application.job._id
                            : null,

                    title:
                        application.job
                            ? application.job.title
                            : null,

                    company:
                        application.job
                            ? application.job.company
                            : null,

                    description:
                        application.job
                            ? application.job.description
                            : null,

                    responsibilities:
                        application.job
                            ? application.job.responsibilities
                            : [],

                    location:
                        application.job
                            ? application.job.location
                            : null,

                    workMode:
                        application.job
                            ? application.job.workMode
                            : null,

                    employmentType:
                        application.job
                            ? application.job.employmentType
                            : null,

                    salary:
                        application.job
                            ? application.job.salary
                            : null,

                    contractPeriod:
                        application.job
                            ? application.job.contractPeriod
                            : null,

                    minimumExperience:
                        application.job
                            ? application.job.minimumExperience
                            : null,

                    education:
                        application.job
                            ? application.job.education
                            : null,

                    applicationDeadline:
                        application.job
                            ? application.job.applicationDeadline
                            : null,

                    jobStatus:
                        application.job
                            ? application.job.jobStatus
                            : null
                },



                match: {

                    id:
                        match._id,

                    applicationId:
                        match.applicationId,

                    resumeId:
                        match.resumeId,

                    jobId:
                        match.jobId,

                    traditionalScore:
                        match.traditionalScore,

                    requiredSkillsScore:
                        match.requiredSkillsScore,

                    preferredSkillsScore:
                        match.preferredSkillsScore,

                    experienceScore:
                        match.experienceScore,

                    educationScore:
                        match.educationScore,

                    aiScore:
                        match.aiScore,

                    keywordScore:
                        match.keywordScore,

                    semanticScore:
                        match.semanticScore,

                    finalScore:
                        match.finalScore,

                    matchedRequiredSkills:
                        match.matchedRequiredSkills,

                    missingRequiredSkills:
                        match.missingRequiredSkills,

                    aiMatchedWords:
                        match.aiMatchedWords
                }

            }

        });



    } catch (error) {

        console.error(
            "Get HR candidate analysis error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch HR candidate analysis."
        });

    }

};




const getCandidateFeedback = async (req, res) => {
    try {
        const { applicationId } = req.params;

        if (!applicationId) {
            return res.status(400).json({
                success: false,
                message: "Application ID is required."
            });
        }

        const application = await Application.findOne({
            _id: applicationId,
            candidate: req.user._id
        })
            .populate(
                "job",
                "title company description responsibilities location workMode employmentType salary contractPeriod minimumExperience education applicationDeadline jobStatus"
            )
            .populate(
                "resume",
                "skills experience education status"
            );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        if (!application.resume || !application.job) {
            return res.status(409).json({
                success: false,
                message: "The application does not have a linked resume or job."
            });
        }

        const match = await Match.findOne({
            applicationId: application._id,
            resumeId: application.resume._id,
            jobId: application.job._id
        });

        if (!match) {
            return res.status(404).json({
                success: false,
                message:
                    "Feedback is not available yet. Your application has not been evaluated."
            });
        }

        const matchedSkills = Array.isArray(match.matchedRequiredSkills)
            ? match.matchedRequiredSkills
            : [];

        const missingSkills = Array.isArray(match.missingRequiredSkills)
            ? match.missingRequiredSkills
            : [];

        const aiMatchedWords = Array.isArray(match.aiMatchedWords)
            ? match.aiMatchedWords
            : [];

        const candidateSkills = Array.isArray(application.resume.skills)
            ? application.resume.skills
            : [];

        // Use the match results as the source of truth for skill gaps.
        const skillsToImprove = missingSkills.map((skill) => ({
            skill,
            recommendation: `Build practical experience with ${skill} and add a relevant project to your portfolio.`
        }));

        const feedbackSummary = missingSkills.length > 0
            ? `You matched ${matchedSkills.length} required skill(s). Focus on developing ${missingSkills.length} additional skill(s) to improve your fit for this role.`
            : "You have no missing required skills recorded for this evaluation. Review the job requirements and continue strengthening your practical experience.";

        return res.status(200).json({
            success: true,
            message: "Candidate feedback fetched successfully.",
            data: {
                application: {
                    id: application._id,
                    status: application.status,
                    appliedAt: application.createdAt
                },
                job: {
                    id: application.job._id,
                    title: application.job.title,
                    company: application.job.company,
                    description: application.job.description,
                    responsibilities: application.job.responsibilities,
                    location: application.job.location,
                    workMode: application.job.workMode,
                    employmentType: application.job.employmentType,
                    salary: application.job.salary,
                    contractPeriod: application.job.contractPeriod,
                    minimumExperience: application.job.minimumExperience,
                    education: application.job.education,
                    applicationDeadline: application.job.applicationDeadline
                },
                feedback: {
                    summary: feedbackSummary,
                    candidateSkills,
                    matchedSkills,
                    missingSkills,
                    skillsToImprove,
                    aiMatchedWords
                },
                match: {
                    finalScore: match.finalScore,
                    status: "evaluated"
                }
            }
        });
    } catch (error) {
        console.error(
            "Get candidate feedback error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch candidate feedback."
        });
    }
};




// ---------------------------------------------
// GET HR CANDIDATE RANKING
// ---------------------------------------------

const getHRCandidateRanking = async (req, res) => {

    try {

        const {
            jobId
        } = req.params;



        if (!jobId) {
            return res.status(400).json({
                success: false,
                message: "Job ID is required."
            });
        }



        const job = await JobDescription.findById(jobId).select(
            "title company description responsibilities location workMode employmentType salary contractPeriod minimumExperience education applicationDeadline jobStatus"
        );



        if (!job) {
            return res.status(404).json({
                success: false,
                message: "Job not found."
            });
        }



        if (job.company !== req.user.company) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this job ranking."
            });
        }



        const applications = await Application.find({
            job: job._id
        })
            .populate(
                "candidate",
                "name email"
            )
            .populate(
                "candidateProfile",
                "phone location bio skills education experience projects certifications linkedin github"
            )
            .populate(
                "resume",
                "candidateName email skills experience education status matchScore"
            )
            .sort({
                createdAt: 1
            });



        const applicationIds = applications.map(
            (application) => application._id
        );



        const matches = await Match.find({
            applicationId: {
                $in: applicationIds
            },
            jobId: job._id
        });



        const matchMap = new Map(
            matches.map(
                (match) => [
                    match.applicationId.toString(),
                    match
                ]
            )
        );



        const ranking = applications

            .map((application) => {

                const match = matchMap.get(
                    application._id.toString()
                );



                return {

                    application: {

                        id:
                            application._id,

                        status:
                            application.status,

                        appliedAt:
                            application.createdAt
                    },



                    candidate: {

                        id:
                            application.candidate
                                ? application.candidate._id
                                : null,

                        name:
                            application.candidate
                                ? application.candidate.name
                                : null,

                        email:
                            application.candidate
                                ? application.candidate.email
                                : null
                    },



                    candidateProfile:
                        application.candidateProfile,



                    resume:
                        application.resume,



                    match: match

                        ? {

                            id:
                                match._id,

                            traditionalScore:
                                match.traditionalScore,

                            requiredSkillsScore:
                                match.requiredSkillsScore,

                            preferredSkillsScore:
                                match.preferredSkillsScore,

                            experienceScore:
                                match.experienceScore,

                            educationScore:
                                match.educationScore,

                            aiScore:
                                match.aiScore,

                            keywordScore:
                                match.keywordScore,

                            semanticScore:
                                match.semanticScore,

                            finalScore:
                                match.finalScore,

                            // IMPORTANT:
                            // Expose the actual persisted
                            // Match status.
                            //
                            // "current" = match is based on
                            // current job/resume data.
                            //
                            // "stale" = relevant data changed
                            // after the match was generated.

                            matchStatus:
                                match.matchStatus,

                            matchedRequiredSkills:
                                match.matchedRequiredSkills,

                            missingRequiredSkills:
                                match.missingRequiredSkills,

                            aiMatchedWords:
                                match.aiMatchedWords

                        }

                        : null

                };

            })



            // ---------------------------------------------
            // SORT BY FINAL SCORE
            // ---------------------------------------------

            .sort((a, b) => {

                const scoreA = a.match
                    ? Number(a.match.finalScore || 0)
                    : 0;

                const scoreB = b.match
                    ? Number(b.match.finalScore || 0)
                    : 0;

                return scoreB - scoreA;

            })



            // ---------------------------------------------
            // ASSIGN RANK
            // ---------------------------------------------

            .map((candidate, index) => ({

                rank: index + 1,

                ...candidate

            }));



        return res.status(200).json({

            success: true,

            message:
                "Candidate ranking fetched successfully.",

            data: {

                job: {

                    id:
                        job._id,

                    title:
                        job.title,

                    company:
                        job.company,

                    description:
                        job.description,

                    responsibilities:
                        job.responsibilities,

                    location:
                        job.location,

                    workMode:
                        job.workMode,

                    employmentType:
                        job.employmentType,

                    salary:
                        job.salary,

                    contractPeriod:
                        job.contractPeriod,

                    minimumExperience:
                        job.minimumExperience,

                    education:
                        job.education,

                    applicationDeadline:
                        job.applicationDeadline,

                    jobStatus:
                        job.jobStatus

                },



                totalApplicants:
                    ranking.length,



                rankedCandidates:
                    ranking

            }

        });



    } catch (error) {

        console.error(
            "Get HR candidate ranking error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch candidate ranking."

        });

    }

};



// ---------------------------------------------
// UPDATE APPLICATION STATUS
// ---------------------------------------------

const updateApplicationStatus = async (req, res) => {

    try {

        const {
            applicationId
        } = req.params;



        const {
            status
        } = req.body;



        const allowedStatuses = [
            "Applied",
            "Shortlisted",
            "Rejected",
            "Selected"
        ];



        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Application status is required."
            });
        }



        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application status."
            });
        }



        const application = await Application.findById(
            applicationId
        ).populate(
            "job",
            "title company"
        );



        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }



        if (
            !application.job ||
            application.job.company !== req.user.company
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update this application."
            });
        }



        application.status = status;



        await application.save();



        return res.status(200).json({

            success: true,

            message:
                "Application status updated successfully.",

            data: application

        });



    } catch (error) {

        console.error(
            "Update application status error:",
            error.message
        );

        return res.status(500).json({

            success: false,

            message:
                "Failed to update application status."

        });

    }

};



// ---------------------------------------------
// EXPORT CONTROLLERS
// ---------------------------------------------

module.exports = {

    applyForJob,

    getMyApplications,

    getHRApplications,

    getHRCandidateAnalysis,

    getCandidateFeedback,

    getHRCandidateRanking,

    updateApplicationStatus

};