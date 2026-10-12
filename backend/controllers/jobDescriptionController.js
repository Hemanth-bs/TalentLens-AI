// =====================================================
// JOB DESCRIPTION CONTROLLER
// =====================================================

const JobDescription = require("../models/JobDescription");
const Match = require("../models/Match");

const {
    indexDocument
} = require("../services/aiService");


// =====================================================
// HELPER: GET HR COMPANY
// =====================================================
// The company always comes from the authenticated HR.
// We never trust company information from req.body.
// =====================================================

const getHRCompany = (req) => {
    return req.user.company
        ? req.user.company.trim()
        : "";
};


// =====================================================
// HELPER: NORMALIZE STRING ARRAY
// =====================================================

const normalizeStringArray = (value) => {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0);
};


// =====================================================
// HELPER: VALIDATE APPLICATION DEADLINE
// =====================================================

const parseApplicationDeadline = (applicationDeadline) => {

    if (
        applicationDeadline === undefined ||
        applicationDeadline === null ||
        applicationDeadline === ""
    ) {
        return null;
    }

    const deadline = new Date(applicationDeadline);

    if (Number.isNaN(deadline.getTime())) {
        return "INVALID_DATE";
    }

    return deadline;
};


// =====================================================
// CREATE JOB DESCRIPTION
// =====================================================

const createJobDescription = async (req, res) => {

    try {

        // ---------------------------------------------
        // GET HR COMPANY
        // ---------------------------------------------

        const company = getHRCompany(req);

        if (!company) {
            return res.status(400).json({
                success: false,
                message: "HR company information is required."
            });
        }


        // ---------------------------------------------
        // READ REQUEST BODY
        // ---------------------------------------------

        const {
            title,
            description,
            responsibilities,
            location,
            workMode,
            employmentType,
            salary,
            contractPeriod,
            minimumExperience,
            education,
            applicationDeadline,
            requiredSkills,
            preferredSkills,
            evaluationCriteria,
            internalNotes,
            jobStatus
        } = req.body;


        // ---------------------------------------------
        // REQUIRED FIELD VALIDATION
        // ---------------------------------------------

        if (!title || !title.trim()) {
            return res.status(400).json({
                success: false,
                message: "Job title is required."
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: "Job description is required."
            });
        }


        // ---------------------------------------------
        // EXPERIENCE VALIDATION
        // ---------------------------------------------

        const experience =
            minimumExperience === undefined ||
            minimumExperience === null ||
            minimumExperience === ""
                ? 0
                : Number(minimumExperience);

        if (
            Number.isNaN(experience) ||
            experience < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Minimum experience must be a valid non-negative number."
            });
        }


        // ---------------------------------------------
        // APPLICATION DEADLINE
        // ---------------------------------------------

        const parsedDeadline =
            parseApplicationDeadline(applicationDeadline);

        if (parsedDeadline === "INVALID_DATE") {
            return res.status(400).json({
                success: false,
                message:
                    "Application deadline must be a valid date."
            });
        }


        // ---------------------------------------------
        // JOB STATUS
        // ---------------------------------------------

        const allowedJobStatuses = [
            "Draft",
            "Open",
            "Closed"
        ];

        const finalJobStatus =
            jobStatus || "Draft";

        if (!allowedJobStatuses.includes(finalJobStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid job status."
            });
        }


        // ---------------------------------------------
        // CREATE JOB
        // ---------------------------------------------

        const job = await JobDescription.create({

            title: title.trim(),

            company: company,

            description: description.trim(),

            responsibilities:
                normalizeStringArray(responsibilities),

            location:
                location
                    ? location.trim()
                    : "",

            workMode:
                workMode || "On-site",

            employmentType:
                employmentType || "Full-time",

            salary:
                salary
                    ? salary.trim()
                    : "",

            contractPeriod:
                contractPeriod
                    ? contractPeriod.trim()
                    : "",

            minimumExperience:
                experience,

            education:
                education
                    ? education.trim()
                    : "",

            applicationDeadline:
                parsedDeadline,

            requiredSkills:
                normalizeStringArray(requiredSkills),

            preferredSkills:
                normalizeStringArray(preferredSkills),

            evaluationCriteria:
                normalizeStringArray(evaluationCriteria),

            internalNotes:
                internalNotes
                    ? internalNotes.trim()
                    : "",

            jobStatus:
                finalJobStatus,

            processingStatus:
                "created"
        });


        // ---------------------------------------------
        // RAG INDEXING
        // ---------------------------------------------

        try {

            await indexDocument(
                job._id.toString(),
                job.description,
                {
                    type: "job",
                    company: job.company,
                    title: job.title
                }
            );

            job.processingStatus = "processed";

            await job.save();

        } catch (ragError) {

            console.error(
                "RAG job indexing error:",
                ragError.message
            );

            job.processingStatus = "failed";

            await job.save();

            return res.status(500).json({
                success: false,
                message:
                    "Job was created, but RAG indexing failed.",
                data: {
                    jobId: job._id,
                    processingStatus:
                        job.processingStatus
                }
            });
        }


        // ---------------------------------------------
        // SUCCESS RESPONSE
        // ---------------------------------------------

        return res.status(201).json({
            success: true,
            message:
                "Job description created and indexed successfully.",
            data: job
        });

    } catch (error) {

        console.error(
            "Create job description error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create job description."
        });
    }
};


// =====================================================
// GET ALL JOB DESCRIPTIONS
// =====================================================
// HR:
//     Full job information.
//
// Candidate:
//     Candidate-safe information.
//
// Authentication is required at the route level.
// =====================================================

const getJobDescriptions = async (req, res) => {

    try {

        // ---------------------------------------------
        // CANDIDATE VIEW
        // ---------------------------------------------

        if (req.user.role === "candidate") {

            const jobs =
                await JobDescription
                    .find({
                        jobStatus: "Open"
                    })
                    .select(
                        "title company description responsibilities location workMode employmentType salary contractPeriod minimumExperience education applicationDeadline jobStatus createdAt updatedAt"
                    )
                    .sort({
                        createdAt: -1
                    });

            return res.status(200).json({
                success: true,
                message:
                    "Candidate jobs fetched successfully.",
                data: jobs
            });
        }


        // ---------------------------------------------
        // HR VIEW
        // ---------------------------------------------

        if (req.user.role === "hr") {

            const company =
                getHRCompany(req);

            if (!company) {
                return res.status(400).json({
                    success: false,
                    message:
                        "HR company information is required."
                });
            }

            const jobs =
                await JobDescription
                    .find({
                        company: company
                    })
                    .sort({
                        createdAt: -1
                    });

            return res.status(200).json({
                success: true,
                message:
                    "HR job descriptions fetched successfully.",
                data: jobs
            });
        }


        // ---------------------------------------------
        // UNKNOWN ROLE
        // ---------------------------------------------

        return res.status(403).json({
            success: false,
            message: "Access denied."
        });

    } catch (error) {

        console.error(
            "Get job descriptions error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch job descriptions."
        });
    }
};


// =====================================================
// GET CANDIDATE-SAFE JOBS
// =====================================================
// Only OPEN jobs are visible to candidates.
// HR-only evaluation information is excluded.
// =====================================================

const getCandidateJobs = async (req, res) => {

    try {

        const jobs =
            await JobDescription
                .find({
                    jobStatus: "Open"
                })
                .select(
                    "title company description responsibilities location workMode employmentType salary contractPeriod minimumExperience education applicationDeadline jobStatus createdAt updatedAt"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,
            message:
                "Candidate jobs fetched successfully.",
            data: jobs
        });

    } catch (error) {

        console.error(
            "Get candidate jobs error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch available jobs."
        });
    }
};


// =====================================================
// GET JOB DESCRIPTION BY ID
// =====================================================
// HR:
//     Can see complete job.
//
// Candidate:
//     Can see only safe information.
//
// Candidate can only see OPEN jobs.
// =====================================================

const getJobDescriptionById = async (req, res) => {

    try {

        const job =
            await JobDescription.findById(
                req.params.id
            );

        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job description not found."
            });
        }


        // ---------------------------------------------
        // CANDIDATE VIEW
        // ---------------------------------------------

        if (req.user.role === "candidate") {

            if (job.jobStatus !== "Open") {
                return res.status(404).json({
                    success: false,
                    message:
                        "Job is not currently available."
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Job description fetched successfully.",
                data: {

                    _id: job._id,

                    title: job.title,

                    company: job.company,

                    description: job.description,

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
                        job.jobStatus,

                    createdAt:
                        job.createdAt,

                    updatedAt:
                        job.updatedAt
                }
            });
        }


        // ---------------------------------------------
        // HR VIEW
        // ---------------------------------------------

        if (req.user.role === "hr") {

            const company =
                getHRCompany(req);

            if (
                !company ||
                job.company !== company
            ) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not authorized to view this job."
                });
            }

            return res.status(200).json({
                success: true,
                message:
                    "Job description fetched successfully.",
                data: job
            });
        }


        return res.status(403).json({
            success: false,
            message: "Access denied."
        });

    } catch (error) {

        console.error(
            "Get job description error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch job description."
        });
    }
};


// =====================================================
// UPDATE JOB DESCRIPTION
// =====================================================
// HR can update only jobs belonging to their company.
// =====================================================

const updateJobDescription = async (req, res) => {

    try {

        const jobId =
            req.params.id;

        const company =
            getHRCompany(req);

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "HR company information is required."
            });
        }


        // ---------------------------------------------
        // READ REQUEST BODY
        // ---------------------------------------------

        const {
            title,
            description,
            responsibilities,
            location,
            workMode,
            employmentType,
            salary,
            contractPeriod,
            minimumExperience,
            education,
            applicationDeadline,
            requiredSkills,
            preferredSkills,
            evaluationCriteria,
            internalNotes,
            jobStatus
        } = req.body;


        // ---------------------------------------------
        // BUILD SAFE UPDATE OBJECT
        // ---------------------------------------------

        const updateData = {};


        // ---------------------------------------------
        // MATCH INVALIDATION
        // ---------------------------------------------
        // These fields can affect candidate-job matching.
        // If any of them are changed, existing match results
        // are marked stale.
        // ---------------------------------------------

        const matchingFieldsChanged =
            title !== undefined ||
            description !== undefined ||
            responsibilities !== undefined ||
            minimumExperience !== undefined ||
            education !== undefined ||
            requiredSkills !== undefined ||
            preferredSkills !== undefined ||
            evaluationCriteria !== undefined;


        // ---------------------------------------------
        // TITLE
        // ---------------------------------------------

        if (title !== undefined) {

            if (!title || !title.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Job title cannot be empty."
                });
            }

            updateData.title =
                title.trim();
        }


        // ---------------------------------------------
        // DESCRIPTION
        // ---------------------------------------------

        if (description !== undefined) {

            if (
                !description ||
                !description.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Job description cannot be empty."
                });
            }

            updateData.description =
                description.trim();
        }


        // ---------------------------------------------
        // RESPONSIBILITIES
        // ---------------------------------------------

        if (responsibilities !== undefined) {

            if (!Array.isArray(responsibilities)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Responsibilities must be an array."
                });
            }

            updateData.responsibilities =
                normalizeStringArray(
                    responsibilities
                );
        }


        // ---------------------------------------------
        // LOCATION
        // ---------------------------------------------

        if (location !== undefined) {

            updateData.location =
                location
                    ? location.trim()
                    : "";
        }


        // ---------------------------------------------
        // WORK MODE
        // ---------------------------------------------

        if (workMode !== undefined) {
            updateData.workMode =
                workMode;
        }


        // ---------------------------------------------
        // EMPLOYMENT TYPE
        // ---------------------------------------------

        if (employmentType !== undefined) {
            updateData.employmentType =
                employmentType;
        }


        // ---------------------------------------------
        // SALARY
        // ---------------------------------------------

        if (salary !== undefined) {

            updateData.salary =
                salary
                    ? salary.trim()
                    : "";
        }


        // ---------------------------------------------
        // CONTRACT PERIOD
        // ---------------------------------------------

        if (contractPeriod !== undefined) {

            updateData.contractPeriod =
                contractPeriod
                    ? contractPeriod.trim()
                    : "";
        }


        // ---------------------------------------------
        // MINIMUM EXPERIENCE
        // ---------------------------------------------

        if (minimumExperience !== undefined) {

            const experience =
                Number(minimumExperience);

            if (
                Number.isNaN(experience) ||
                experience < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Minimum experience must be a valid non-negative number."
                });
            }

            updateData.minimumExperience =
                experience;
        }


        // ---------------------------------------------
        // EDUCATION
        // ---------------------------------------------

        if (education !== undefined) {

            updateData.education =
                education
                    ? education.trim()
                    : "";
        }


        // ---------------------------------------------
        // APPLICATION DEADLINE
        // ---------------------------------------------

        if (applicationDeadline !== undefined) {

            const parsedDeadline =
                parseApplicationDeadline(
                    applicationDeadline
                );

            if (
                parsedDeadline ===
                "INVALID_DATE"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Application deadline must be a valid date."
                });
            }

            updateData.applicationDeadline =
                parsedDeadline;
        }


        // ---------------------------------------------
        // REQUIRED SKILLS
        // ---------------------------------------------

        if (requiredSkills !== undefined) {

            if (!Array.isArray(requiredSkills)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Required skills must be an array."
                });
            }

            updateData.requiredSkills =
                normalizeStringArray(
                    requiredSkills
                );
        }


        // ---------------------------------------------
        // PREFERRED SKILLS
        // ---------------------------------------------

        if (preferredSkills !== undefined) {

            if (!Array.isArray(preferredSkills)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Preferred skills must be an array."
                });
            }

            updateData.preferredSkills =
                normalizeStringArray(
                    preferredSkills
                );
        }


        // ---------------------------------------------
        // EVALUATION CRITERIA
        // ---------------------------------------------

        if (evaluationCriteria !== undefined) {

            if (!Array.isArray(evaluationCriteria)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Evaluation criteria must be an array."
                });
            }

            updateData.evaluationCriteria =
                normalizeStringArray(
                    evaluationCriteria
                );
        }


        // ---------------------------------------------
        // INTERNAL NOTES
        // ---------------------------------------------

        if (internalNotes !== undefined) {

            updateData.internalNotes =
                internalNotes
                    ? internalNotes.trim()
                    : "";
        }


        // ---------------------------------------------
        // JOB STATUS
        // ---------------------------------------------

        if (jobStatus !== undefined) {

            const allowedJobStatuses = [
                "Draft",
                "Open",
                "Closed"
            ];

            if (!allowedJobStatuses.includes(jobStatus)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid job status."
                });
            }

            updateData.jobStatus =
                jobStatus;
        }


        // ---------------------------------------------
        // FIND AND UPDATE OWN JOB
        // ---------------------------------------------

        const updatedJob =
            await JobDescription.findOneAndUpdate(

                {
                    _id: jobId,
                    company: company
                },

                updateData,

                {
                    new: true,
                    runValidators: true
                }
            );


        if (!updatedJob) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found or access denied."
            });
        }


        // ---------------------------------------------
        // MARK EXISTING MATCHES AS STALE
        // ---------------------------------------------
        // The old score was calculated against the
        // previous version of the job.
        //
        // We keep the old Match record for history,
        // but mark it stale so it is not considered
        // the current evaluation.
        // ---------------------------------------------

        if (matchingFieldsChanged) {

            await Match.updateMany(
                {
                    jobId: updatedJob._id
                },
                {
                    $set: {
                        matchStatus: "stale"
                    }
                }
            );
        }


        // ---------------------------------------------
        // RE-INDEX JOB IF DESCRIPTION CHANGED
        // ---------------------------------------------

        if (
            updateData.description !==
            undefined
        ) {

            try {

                await indexDocument(
                    updatedJob._id.toString(),
                    updatedJob.description,
                    {
                        type: "job",
                        company: updatedJob.company,
                        title: updatedJob.title
                    }
                );

                updatedJob.processingStatus =
                    "processed";

                await updatedJob.save();

            } catch (ragError) {

                console.error(
                    "RAG job re-indexing error:",
                    ragError.message
                );

                updatedJob.processingStatus =
                    "failed";

                await updatedJob.save();

                return res.status(500).json({
                    success: false,
                    message:
                        "Job updated, but RAG re-indexing failed.",
                    data: {
                        jobId:
                            updatedJob._id,
                        processingStatus:
                            updatedJob.processingStatus
                    }
                });
            }
        }


        // ---------------------------------------------
        // SUCCESS RESPONSE
        // ---------------------------------------------

        return res.status(200).json({
            success: true,
            message:
                "Job description updated successfully.",
            data: updatedJob
        });

    } catch (error) {

        console.error(
            "Update job description error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update job description."
        });
    }
};


// =====================================================
// UPDATE JOB STATUS
// =====================================================
// Dedicated endpoint for:
// Draft → Open → Closed
// =====================================================

const updateJobStatus = async (req, res) => {

    try {

        const jobId =
            req.params.id;

        const company =
            getHRCompany(req);

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "HR company information is required."
            });
        }


        const {
            jobStatus
        } = req.body;


        const allowedStatuses = [
            "Draft",
            "Open",
            "Closed"
        ];

        if (!allowedStatuses.includes(jobStatus)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid job status."
            });
        }


        const job =
            await JobDescription.findOneAndUpdate(

                {
                    _id: jobId,
                    company: company
                },

                {
                    jobStatus:
                        jobStatus
                },

                {
                    new: true,
                    runValidators: true
                }
            );


        if (!job) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found or access denied."
            });
        }


        return res.status(200).json({
            success: true,
            message:
                "Job status updated successfully.",
            data: {
                jobId:
                    job._id,
                jobStatus:
                    job.jobStatus
            }
        });

    } catch (error) {

        console.error(
            "Update job status error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to update job status."
        });
    }
};


// =====================================================
// DELETE JOB DESCRIPTION
// =====================================================

const deleteJobDescription = async (req, res) => {

    try {

        const company =
            getHRCompany(req);

        if (!company) {
            return res.status(400).json({
                success: false,
                message:
                    "HR company information is required."
            });
        }


        const deletedJob =
            await JobDescription.findOneAndDelete({

                _id:
                    req.params.id,

                company:
                    company
            });


        if (!deletedJob) {
            return res.status(404).json({
                success: false,
                message:
                    "Job not found or access denied."
            });
        }


        return res.status(200).json({
            success: true,
            message:
                "Job description deleted successfully.",
            data:
                deletedJob
        });

    } catch (error) {

        console.error(
            "Delete job description error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete job description."
        });
    }
};


// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {

    createJobDescription,

    getJobDescriptions,

    getCandidateJobs,

    getJobDescriptionById,

    updateJobDescription,

    updateJobStatus,

    deleteJobDescription

};