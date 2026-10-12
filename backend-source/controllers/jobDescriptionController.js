// ---------------------------------------------
// TALENTLENS AI - JOB DESCRIPTION CONTROLLER
// ---------------------------------------------

// Import Job Description model
const JobDescription = require("../models/JobDescription");

// Import FastAPI AI service
const {
    indexDocument
} = require("../services/aiService");


// ---------------------------------------------
// CREATE JOB DESCRIPTION
// ---------------------------------------------

const createJobDescription = async (req, res) => {

    try {

        const {
            title,
            company,
            description,
            requiredSkills,
            preferredSkills,
            minimumExperience,
            education,
            responsibilities
        } = req.body;


        // -----------------------------------------
        // VALIDATE REQUIRED FIELDS
        // -----------------------------------------

        if (!title || !description) {

            return res.status(400).json({
                success: false,
                message: "Job title and description are required"
            });

        }


        // -----------------------------------------
        // CREATE JOB IN MONGODB
        // -----------------------------------------

        const jobDescription =
            await JobDescription.create({

                title,

                company:
                    company || "",

                description,

                requiredSkills:
                    requiredSkills || [],

                preferredSkills:
                    preferredSkills || [],

                minimumExperience:
                    minimumExperience || 0,

                education:
                    education || "",

                responsibilities:
                    responsibilities || [],

                status: "created"
            });


        // -----------------------------------------
        // INDEX JOB INTO RAG
        // -----------------------------------------

        try {

            await indexDocument(

                jobDescription._id.toString(),

                jobDescription.description,

                {
                    type:
                        "job_description",

                    role:
                        jobDescription.title,

                    company:
                        jobDescription.company
                }

            );


            // -----------------------------------------
            // RAG INDEXING SUCCESS
            // -----------------------------------------

            jobDescription.status =
                "processed";

            await jobDescription.save();


        } catch (ragError) {

            // -----------------------------------------
            // RAG INDEXING FAILED
            // -----------------------------------------

            console.error(
                "RAG job indexing error:",
                ragError.message
            );


            jobDescription.status =
                "failed";

            await jobDescription.save();


            return res.status(500).json({

                success: false,

                message:
                    "Job description was created, but RAG indexing failed",

                data: {
                    jobId:
                        jobDescription._id,

                    status:
                        jobDescription.status
                }

            });

        }


        // -----------------------------------------
        // RETURN SUCCESS RESPONSE
        // -----------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Job description created and indexed successfully",

            data:
                jobDescription
        });


    } catch (error) {

        console.error(
            "Job description creation error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to create job description"
        });

    }
};


// ---------------------------------------------
// GET ALL JOB DESCRIPTIONS
// ---------------------------------------------

const getJobDescriptions = async (req, res) => {

    try {

        const jobDescriptions =
            await JobDescription
                .find()
                .sort({
                    createdAt: -1
                });


        return res.status(200).json({

            success: true,

            count:
                jobDescriptions.length,

            data:
                jobDescriptions
        });


    } catch (error) {

        console.error(
            "Job description fetch error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch job descriptions"
        });

    }
};


// ---------------------------------------------
// GET JOB DESCRIPTION BY ID
// ---------------------------------------------

const getJobDescriptionById = async (req, res) => {

    try {

        const jobDescription =
            await JobDescription.findById(
                req.params.id
            );


        if (!jobDescription) {

            return res.status(404).json({

                success: false,

                message:
                    "Job description not found"
            });

        }


        return res.status(200).json({

            success: true,

            data:
                jobDescription
        });


    } catch (error) {

        console.error(
            "Job description fetch error:",
            error.message
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch job description"
        });

    }
};


// ---------------------------------------------
// GET JOBS FOR CANDIDATES
// ---------------------------------------------
// Returns only information candidates are allowed to see.
// Internal HR evaluation fields are intentionally excluded.
const getCandidateJobs = async (req, res) => {
    try {
        const jobs = await JobDescription.find()
            .select(
                "title company description minimumExperience education responsibilities createdAt updatedAt"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "Candidate jobs fetched successfully.",
            data: jobs
        });
    } catch (error) {
        console.error(
            "Get candidate jobs error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message: "Failed to fetch available jobs."
        });
    }
};


// ---------------------------------------------
// EXPORT CONTROLLERS
// ---------------------------------------------

module.exports = {

    createJobDescription,
    
    getJobDescriptions,
    
    getJobDescriptionById,
    
    getCandidateJobs

};