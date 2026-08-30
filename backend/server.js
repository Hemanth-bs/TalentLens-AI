// Import Express
const express = require("express");

// Import CORS
const cors = require("cors");

// Import dotenv
require("dotenv").config();

// Import MongoDB connection
const connectDB = require("./config/db");

// Import models
const Resume = require("./models/Resume");
const JobDescription = require("./models/JobDescription");

// Import routes
const resumeRoutes = require("./routes/resumeRoutes");
const jobDescriptionRoutes = require("./routes/jobDescriptionRoutes");

// Create Express application
const app = express();

const matchingRoutes = require("./routes/matchingRoutes");
const rankingRoutes = require("./routes/rankingRoutes");

// Server port
const PORT = process.env.PORT || 5000;


// ---------------------------------------------
// MIDDLEWARE
// ---------------------------------------------

app.use(express.json());

// Allow frontend running on Vite
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ]
    })
);


// ---------------------------------------------
// API ROUTES
// ---------------------------------------------

app.use("/api/resumes", resumeRoutes);

app.use("/api/jobs", jobDescriptionRoutes);

app.use("/api/matches", matchingRoutes);

app.use("/api/rankings", rankingRoutes);


// ---------------------------------------------
// VISUAL BACKEND OUTPUT PAGE
// ---------------------------------------------

app.get("/", async (req, res) => {

    try {

        // Get latest resume
        const latestResume = await Resume
            .findOne()
            .sort({ updatedAt: -1 });

        // Get latest job description
        const latestJob = await JobDescription
            .findOne()
            .sort({ updatedAt: -1 });


        // Resume information
        const resumeSkills = latestResume?.skills || [];
        const resumeProjects = latestResume?.projects || [];
        const resumeCertifications =
            latestResume?.certifications || [];


        // Required job skills
        const requiredSkills =
            latestJob?.requiredSkills || [];

        const preferredSkills =
            latestJob?.preferredSkills || [];


        res.send(`

<!DOCTYPE html>

<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
      content="width=device-width, initial-scale=1.0">

<title>TalentLens AI - Backend</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    font-family: Arial, sans-serif;
    background: #f4f7fb;
    color: #1f2937;
}


.container {
    max-width: 1100px;
    margin: 40px auto;
    padding: 0 20px;
}


.header {
    background: #111827;
    color: white;
    padding: 30px;
    border-radius: 14px;
    margin-bottom: 25px;
}


.header h1 {
    margin: 0 0 8px;
    font-size: 30px;
}


.header p {
    margin: 0;
    color: #cbd5e1;
}


.status {
    display: grid;
    grid-template-columns:
        repeat(auto-fit, minmax(220px, 1fr));
    gap: 15px;
    margin-bottom: 25px;
}


.status-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow:
        0 3px 12px rgba(0,0,0,0.07);
}


.status-card h3 {
    margin-top: 0;
}


.green {
    color: #16a34a;
    font-weight: bold;
}


.yellow {
    color: #d97706;
    font-weight: bold;
}


.gray {
    color: #64748b;
    font-weight: bold;
}


.section {
    background: white;
    padding: 25px;
    border-radius: 14px;
    margin-bottom: 20px;
    box-shadow:
        0 3px 12px rgba(0,0,0,0.07);
}


.section h2 {
    margin-top: 0;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 12px;
}


.grid {
    display: grid;
    grid-template-columns:
        repeat(auto-fit, minmax(250px, 1fr));
    gap: 15px;
}


.item {
    background: #f8fafc;
    padding: 15px;
    border-radius: 10px;
}


.item strong {
    display: block;
    margin-bottom: 7px;
}


.badges {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}


.badge {
    background: #e0e7ff;
    color: #3730a3;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 13px;
}


.success {
    color: #15803d;
    font-weight: bold;
}


.footer {
    text-align: center;
    color: #64748b;
    margin: 30px 0;
}

</style>

</head>


<body>

<div class="container">


<!-- HEADER -->

<div class="header">

    <h1>TalentLens AI</h1>

    <p>Backend Development Output</p>

</div>


<!-- SYSTEM STATUS -->

<div class="status">


    <div class="status-card">

        <h3>🟢 Express Server</h3>

        <p class="green">
            Running on port ${PORT}
        </p>

    </div>


    <div class="status-card">

        <h3>🟢 MongoDB Atlas</h3>

        <p class="green">
            Connected
        </p>

    </div>


    <div class="status-card">

        <h3>🟢 Resume Intelligence</h3>

        <p class="green">
            Completed
        </p>

    </div>


    <div class="status-card">

        <h3>🟡 Job Intelligence</h3>

        <p class="yellow">
            In Progress
        </p>

    </div>


</div>


<!-- RESUME MODULE -->

<div class="section">

<h2>📄 Resume Intelligence Output</h2>


<div class="grid">


    <div class="item">

        <strong>Candidate</strong>

        ${latestResume?.candidateName ||
            "No resume analyzed"}

    </div>


    <div class="item">

        <strong>Experience</strong>

        ${latestResume?.experience || 0} years

    </div>


    <div class="item">

        <strong>Education</strong>

        ${latestResume?.education ||
            "Not available"}

    </div>


    <div class="item">

        <strong>Status</strong>

        <span class="success">

            ${latestResume?.status ||
                "Not analyzed"}

        </span>

    </div>


</div>


<br>


<div class="item">

<strong>
    Skills (${resumeSkills.length})
</strong>


<div class="badges">

${resumeSkills.map(skill =>
    `<span class="badge">${skill}</span>`
).join("")}

</div>

</div>


<br>


<div class="grid">


    <div class="item">

        <strong>
            Projects (${resumeProjects.length})
        </strong>

        ${
            resumeProjects.length
                ? resumeProjects.map(project =>
                    `<div>• ${project}</div>`
                  ).join("")
                : "None"
        }

    </div>


    <div class="item">

        <strong>
            Certifications (${resumeCertifications.length})
        </strong>

        ${
            resumeCertifications.length
                ? resumeCertifications.map(cert =>
                    `<div>• ${cert}</div>`
                  ).join("")
                : "None"
        }

    </div>


</div>

</div>


<!-- JOB MODULE -->

<div class="section">

<h2>💼 Job Description Output</h2>


<div class="grid">


    <div class="item">

        <strong>Job Title</strong>

        ${latestJob?.title ||
            "No job created"}

    </div>


    <div class="item">

        <strong>Company</strong>

        ${latestJob?.company ||
            "Not available"}

    </div>


    <div class="item">

        <strong>Minimum Experience</strong>

        ${
            latestJob
                ? `${latestJob.minimumExperience} years`
                : "Not available"
        }

    </div>


    <div class="item">

        <strong>Status</strong>

        <span class="success">

            ${latestJob?.status ||
                "Not created"}

        </span>

    </div>


</div>


<br>


<div class="item">

<strong>Required Skills</strong>


<div class="badges">

${
    requiredSkills.length
        ? requiredSkills.map(skill =>
            `<span class="badge">${skill}</span>`
          ).join("")
        : "None"
}

</div>

</div>


<br>


<div class="item">

<strong>Preferred Skills</strong>


<div class="badges">

${
    preferredSkills.length
        ? preferredSkills.map(skill =>
            `<span class="badge">${skill}</span>`
          ).join("")
        : "None"
}

</div>

</div>


</div>


<!-- DEVELOPMENT STATUS -->

<div class="section">

<h2>🚀 TalentLens AI Development Status</h2>


<div class="grid">


    <div class="item">

        <strong>✅ Backend Foundation</strong>

        Node.js + Express

    </div>


    <div class="item">

        <strong>✅ Database</strong>

        MongoDB Atlas + Mongoose

    </div>


    <div class="item">

        <strong>✅ Resume Processing</strong>

        PDF + DOCX extraction

    </div>


    <div class="item">

        <strong>✅ Resume Intelligence</strong>

        Structured candidate profile

    </div>


    <div class="item">

        <strong>✅ Job Description</strong>

        Job creation and storage

    </div>


    <div class="item">

        <strong>✅ Job Intelligence</strong>

        Job analysis and structured job profile

    </div>


    <div class="item">

        <strong>✅ Matching Engine</strong>

        Resume ↔ Job matching with weighted scoring

    </div>


    <div class="item">

        <strong>✅ Candidate Ranking</strong>

        Multiple candidates ranked by match score

    </div>


    <div class="item">

        <strong>⏳ FastAPI AI Service</strong>

        Planned for later

    </div>


    <div class="item">

        <strong>⏳ RAG / LLM</strong>

        Planned for later

    </div>


</div>

</div>


<div class="footer">

    TalentLens AI • Backend Development Environment

</div>


</div>


</body>

</html>

        `);

    } catch (error) {

        console.error(
            "Backend dashboard error:",
            error.message
        );

        res.status(500).send(
            "Unable to load backend output."
        );

    }

});


// ---------------------------------------------
// START SERVER
// ---------------------------------------------

const startServer = async () => {

    try {

        await connectDB();

        app.listen(PORT, () => {

            console.log(
                `TalentLens AI Backend running on http://localhost:${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "Failed to start backend:",
            error.message
        );

        process.exit(1);

    }

};


// Start application
startServer();