import { useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5000";

function App() {
  // ---------------------------------------------
  // RESUME STATE
  // ---------------------------------------------

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [resumeId, setResumeId] = useState(null);
  const [resume, setResume] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);

  // ---------------------------------------------
  // UI STATE
  // ---------------------------------------------

  const [activeSection, setActiveSection] = useState("Dashboard");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ---------------------------------------------
  // OPEN FILE SELECTOR
  // ---------------------------------------------

  const handleUploadResume = () => {
    document.getElementById("resume-upload-input").click();
  };

  // ---------------------------------------------
  // RESUME UPLOAD
  // ---------------------------------------------

  const handleFileSelected = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();

      // Backend expects "resume"
      formData.append("resume", file);

      const response = await fetch(
        `${API_BASE}/api/resumes/upload`,
        {
          method: "POST",
          body: formData
        }
      );

      const result = await response.json();

      console.log("Resume upload response:", result);

      if (!response.ok) {
        throw new Error(
          result.message || "Resume upload failed"
        );
      }

      // ---------------------------------------------
      // SAVE RESUME ID
      // ---------------------------------------------

      const uploadedResumeId =
        result?.data?.resumeId ||
        result?.data?._id ||
        result?.resumeId ||
        result?._id;

      if (uploadedResumeId) {
        setResumeId(uploadedResumeId);
      }

      // Save returned resume information if available
      if (result?.data) {
        setResume(result.data);
      }

      setMessage(
        "Resume uploaded successfully! You can now analyze it."
      );

    } catch (error) {

      console.error(
        "Resume upload error:",
        error
      );

      setError(
        error.message || "Failed to upload resume"
      );

    } finally {

      setUploading(false);

      // Allow same file to be selected again
      event.target.value = "";
    }
  };

  // ---------------------------------------------
  // ANALYZE RESUME
  // ---------------------------------------------

  const handleAnalyzeResume = async () => {

    if (!resumeId) {
      setError(
        "Please upload a resume first."
      );
      return;
    }

    setAnalyzing(true);
    setMessage("");
    setError("");

    try {

      const response = await fetch(
        `${API_BASE}/api/resumes/${resumeId}/analyze`,
        {
          method: "POST"
        }
      );

      const result = await response.json();

      console.log(
        "Resume analysis response:",
        result
      );

      if (!response.ok) {
        throw new Error(
          result.message ||
          "Resume analysis failed"
        );
      }

      // ---------------------------------------------
      // SAVE ANALYZED RESUME
      // ---------------------------------------------

      if (result?.data) {
        setResume(result.data);
      }

      setMessage(
        "Resume analyzed successfully!"
      );

      // Automatically move to Resumes section
      setActiveSection("Resumes");

    } catch (error) {

      console.error(
        "Resume analysis error:",
        error
      );

      setError(
        error.message ||
        "Failed to analyze resume"
      );

    } finally {

      setAnalyzing(false);
    }
  };

  // ---------------------------------------------
  // NAVIGATION
  // ---------------------------------------------

  const handleNavigation = (section) => {
    setActiveSection(section);

    setMessage("");
    setError("");
  };

  // ---------------------------------------------
  // FEATURE BUTTONS
  // ---------------------------------------------

  const handleCreateJob = () => {
    setActiveSection("Jobs");

    setMessage(
      "Job management will be connected next."
    );
  };

  const handleMatching = () => {
    setActiveSection("AI Matching");

    setMessage(
      "AI Matching will be connected after the Job module."
    );
  };

  const handleRanking = () => {
    setActiveSection("Rankings");

    setMessage(
      "Candidate Ranking will be connected after Matching."
    );
  };

  // ---------------------------------------------
  // RENDER
  // ---------------------------------------------

  return (
    <div className="app">

      {/* --------------------------------------------- */}
      {/* SIDEBAR */}
      {/* --------------------------------------------- */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-icon">
            T
          </div>

          <div>
            <h2>TalentLens</h2>
            <span>AI Recruitment</span>
          </div>

        </div>


        <nav className="navigation">

          <p className="nav-title">
            MAIN MENU
          </p>


          <button
            className={`nav-item ${
              activeSection === "Dashboard"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("Dashboard")
            }
          >
            <span>⌂</span>
            Dashboard
          </button>


          <button
            className={`nav-item ${
              activeSection === "Resumes"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("Resumes")
            }
          >
            <span>◉</span>
            Resumes
          </button>


          <button
            className={`nav-item ${
              activeSection === "Jobs"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("Jobs")
            }
          >
            <span>▣</span>
            Jobs
          </button>


          <button
            className={`nav-item ${
              activeSection === "AI Matching"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("AI Matching")
            }
          >
            <span>✦</span>
            AI Matching
          </button>


          <button
            className={`nav-item ${
              activeSection === "Rankings"
                ? "active"
                : ""
            }`}
            onClick={() =>
              handleNavigation("Rankings")
            }
          >
            <span>↗</span>
            Rankings
          </button>


          <p className="nav-title">
            MANAGEMENT
          </p>


          <button
            className="nav-item"
            onClick={() =>
              handleNavigation("Candidates")
            }
          >
            <span>♙</span>
            Candidates
          </button>


          <button
            className="nav-item"
            onClick={() =>
              handleNavigation("Settings")
            }
          >
            <span>⚙</span>
            Settings
          </button>

        </nav>


        <div className="ai-status">

          <div className="status-dot"></div>

          <div>
            <strong>AI Service Online</strong>
            <span>All systems operational</span>
          </div>

        </div>

      </aside>


      {/* --------------------------------------------- */}
      {/* MAIN */}
      {/* --------------------------------------------- */}

      <main className="main-content">


        {/* TOP BAR */}

        <header className="topbar">

          <div>

            <p className="breadcrumb">
              Workspace / {activeSection}
            </p>

            <h1>
              Good morning, Recruiter 👋
            </h1>

          </div>


          <div className="top-actions">

            <button className="icon-button">
              🔔
            </button>


            <div className="profile">

              <div className="profile-avatar">
                HR
              </div>

              <div>

                <strong>
                  Recruiter
                </strong>

                <span>
                  Talent Acquisition
                </span>

              </div>

            </div>

          </div>

        </header>


        {/* --------------------------------------------- */}
        {/* GLOBAL MESSAGE */}
        {/* --------------------------------------------- */}

        {message && (

          <div
            style={{
              margin: "0 0 18px",
              padding: "13px 18px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #a7f3d0",
              fontWeight: "600"
            }}
          >
            ✓ {message}
          </div>

        )}


        {error && (

          <div
            style={{
              margin: "0 0 18px",
              padding: "13px 18px",
              borderRadius: "10px",
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              fontWeight: "600"
            }}
          >
            ⚠ {error}
          </div>

        )}


        {/* --------------------------------------------- */}
        {/* HERO */}
        {/* --------------------------------------------- */}

        <section className="hero-section">

          <div className="hero-content">

            <div className="hero-badge">
              ✦ AI-POWERED RECRUITMENT
            </div>


            <h2>
              Find the right talent,
              <br />
              <span>
                faster and smarter.
              </span>
            </h2>


            <p>
              Analyze resumes, understand job requirements
              and discover the strongest candidates using
              intelligent AI matching.
            </p>


            <div className="hero-buttons">

              <button
                className="primary-button"
                onClick={handleUploadResume}
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : "+ Upload Resume"}
              </button>


              <input
                id="resume-upload-input"
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleFileSelected}
              />


              <button
                className="secondary-button"
                onClick={handleCreateJob}
              >
                Create Job
              </button>

            </div>


            {selectedFile && (

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  opacity: 0.8
                }}
              >
                Selected: {selectedFile.name}
              </div>

            )}


            {/* ANALYZE BUTTON */}

            {resumeId && (

              <button
                className="primary-button"
                onClick={handleAnalyzeResume}
                disabled={analyzing}
                style={{
                  marginTop: "14px"
                }}
              >
                {analyzing
                  ? "Analyzing Resume..."
                  : "✦ Analyze Resume"}
              </button>

            )}

          </div>


          {/* AI VISUALIZATION */}

          <div className="hero-visual">

            <div className="orb orb-one"></div>

            <div className="orb orb-two"></div>


            <div className="ai-card">

              <div className="ai-card-header">

                <span>
                  AI MATCH ENGINE
                </span>

                <span className="live">
                  ● LIVE
                </span>

              </div>


              <div className="match-circle">

                <div>

                  <strong>
                    {resume?.matchScore
                      ? `${resume.matchScore}%`
                      : "94%"}
                  </strong>

                  <span>
                    Match
                  </span>

                </div>

              </div>


              <div className="match-lines">

                <div>

                  <span>
                    Skills
                  </span>

                  <strong>
                    {resume?.skills?.length
                      ? "Analyzed"
                      : "98%"}
                  </strong>

                </div>


                <div>

                  <span>
                    Experience
                  </span>

                  <strong>
                    {resume?.experience
                      ? `${resume.experience} yrs`
                      : "92%"}
                  </strong>

                </div>


                <div>

                  <span>
                    Education
                  </span>

                  <strong>
                    {resume?.education
                      ? "Verified"
                      : "95%"}
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* --------------------------------------------- */}
        {/* RESUME RESULT */}
        {/* --------------------------------------------- */}

        {resume && (

          <section className="section">

            <div className="section-heading">

              <div>

                <span>
                  RESUME INTELLIGENCE
                </span>

                <h2>
                  {resume.candidateName ||
                    "Candidate Profile"}
                </h2>

              </div>

              <span
                style={{
                  padding: "7px 12px",
                  borderRadius: "20px",
                  background: "#dcfce7",
                  color: "#15803d",
                  fontWeight: "700",
                  fontSize: "12px"
                }}
              >
                {resume.status || "completed"}
              </span>

            </div>


            <div className="feature-grid">

              {/* SKILLS */}

              <div className="feature-card purple-card">

                <div className="feature-icon">
                  ◉
                </div>

                <div className="feature-content">

                  <h3>
                    Skills
                  </h3>

                  <p>
                    {resume.skills?.length || 0}
                    {" "}skills identified.
                  </p>

                  {resume.skills?.length > 0 && (

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "10px"
                      }}
                    >

                      {resume.skills.map(
                        (skill, index) => (

                          <span
                            key={index}
                            style={{
                              padding: "5px 9px",
                              borderRadius: "14px",
                              background: "rgba(124,58,237,0.1)",
                              fontSize: "12px"
                            }}
                          >
                            {skill}
                          </span>

                        )
                      )}

                    </div>

                  )}

                </div>

              </div>


              {/* EXPERIENCE */}

              <div className="feature-card blue-card">

                <div className="feature-icon">
                  ↗
                </div>

                <div className="feature-content">

                  <h3>
                    Experience
                  </h3>

                  <p>
                    {resume.experience || 0}
                    {" "}years of experience detected.
                  </p>

                </div>

              </div>


              {/* EDUCATION */}

              <div className="feature-card green-card">

                <div className="feature-icon">
                  ✦
                </div>

                <div className="feature-content">

                  <h3>
                    Education
                  </h3>

                  <p>
                    {resume.education ||
                      "Not available"}
                  </p>

                </div>

              </div>


              {/* PROJECTS */}

              <div className="feature-card orange-card">

                <div className="feature-icon">
                  ▣
                </div>

                <div className="feature-content">

                  <h3>
                    Projects
                  </h3>

                  <p>
                    {resume.projects?.length || 0}
                    {" "}projects identified.
                  </p>

                  {resume.projects?.length > 0 && (

                    <div style={{ marginTop: "8px" }}>

                      {resume.projects.map(
                        (project, index) => (
                          <div
                            key={index}
                            style={{
                              fontSize: "13px",
                              marginBottom: "4px"
                            }}
                          >
                            • {project}
                          </div>
                        )
                      )}

                    </div>

                  )}

                </div>

              </div>

            </div>

          </section>

        )}


        {/* --------------------------------------------- */}
        {/* STATISTICS */}
        {/* --------------------------------------------- */}

        <section className="stats-grid">

          <div className="stat-card">

            <div className="stat-icon purple">
              ◉
            </div>

            <div>

              <span>
                Total Resumes
              </span>

              <strong>
                248
              </strong>

              <small>
                ↑ 12.5% this month
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon blue">
              ▣
            </div>

            <div>

              <span>
                Active Jobs
              </span>

              <strong>
                18
              </strong>

              <small>
                ↑ 4 new this week
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon green">
              ✦
            </div>

            <div>

              <span>
                AI Matches
              </span>

              <strong>
                1,426
              </strong>

              <small>
                ↑ 18.2% this month
              </small>

            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon orange">
              ↗
            </div>

            <div>

              <span>
                Shortlisted
              </span>

              <strong>
                86
              </strong>

              <small>
                ↑ 8.4% this month
              </small>

            </div>

          </div>

        </section>


        {/* --------------------------------------------- */}
        {/* WORKSPACE */}
        {/* --------------------------------------------- */}

        <section className="section">

          <div className="section-heading">

            <div>

              <span>
                WORKSPACE
              </span>

              <h2>
                Recruitment Intelligence
              </h2>

            </div>


            <button
              className="view-button"
              onClick={() =>
                handleNavigation("Dashboard")
              }
            >
              View all →
            </button>

          </div>


          <div className="feature-grid">


            {/* RESUME SCREENING */}

            <div className="feature-card purple-card">

              <div className="feature-icon">
                ◉
              </div>

              <div className="feature-content">

                <h3>
                  Resume Screening
                </h3>

                <p>
                  Extract candidate skills, experience
                  and education automatically from resumes.
                </p>

                <button
                  onClick={
                    resumeId
                      ? handleAnalyzeResume
                      : handleUploadResume
                  }
                  disabled={analyzing}
                >
                  {analyzing
                    ? "Analyzing..."
                    : resumeId
                      ? "Analyze Resume →"
                      : "Screen Resumes →"}
                </button>

              </div>

            </div>


            {/* JOB INTELLIGENCE */}

            <div className="feature-card blue-card">

              <div className="feature-icon">
                ▣
              </div>

              <div className="feature-content">

                <h3>
                  Job Intelligence
                </h3>

                <p>
                  Analyze job descriptions and identify
                  required and preferred candidate skills.
                </p>

                <button
                  onClick={handleCreateJob}
                >
                  Manage Jobs →
                </button>

              </div>

            </div>


            {/* AI MATCHING */}

            <div className="feature-card green-card">

              <div className="feature-icon">
                ✦
              </div>

              <div className="feature-content">

                <h3>
                  AI Matching
                </h3>

                <p>
                  Combine keyword and semantic intelligence
                  to calculate accurate candidate-job matches.
                </p>

                <button
                  onClick={handleMatching}
                >
                  Start Matching →
                </button>

              </div>

            </div>


            {/* RANKING */}

            <div className="feature-card orange-card">

              <div className="feature-icon">
                ↗
              </div>

              <div className="feature-content">

                <h3>
                  Candidate Ranking
                </h3>

                <p>
                  Automatically rank candidates and identify
                  the strongest applicants for every job.
                </p>

                <button
                  onClick={handleRanking}
                >
                  View Rankings →
                </button>

              </div>

            </div>

          </div>

        </section>


        {/* --------------------------------------------- */}
        {/* CURRENT RESUME DETAILS */}
        {/* --------------------------------------------- */}

        {resume && (

          <section className="bottom-grid">

            <div className="panel">

              <div className="panel-heading">

                <div>

                  <span>
                    ANALYZED RESUME
                  </span>

                  <h2>
                    Candidate Details
                  </h2>

                </div>

              </div>


              <div className="candidate-row">

                <div className="candidate-avatar">
                  {(
                    resume.candidateName ||
                    "UC"
                  )
                    .split(" ")
                    .map(word => word[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>


                <div className="candidate-info">

                  <strong>
                    {resume.candidateName ||
                      "Uploaded Candidate"}
                  </strong>

                  <span>
                    {resume.education ||
                      "Education not available"}
                  </span>

                </div>


                <div className="candidate-score">

                  <strong>
                    {resume.experience || 0}
                  </strong>

                  <span>
                    Years
                  </span>

                </div>

              </div>


              {resume.certifications?.length > 0 && (

                <div
                  style={{
                    marginTop: "15px"
                  }}
                >

                  <strong>
                    Certifications
                  </strong>

                  {resume.certifications.map(
                    (cert, index) => (

                      <div
                        key={index}
                        style={{
                          marginTop: "6px",
                          fontSize: "13px"
                        }}
                      >
                        ✓ {cert}
                      </div>

                    )
                  )}

                </div>

              )}

            </div>


            {/* AI OVERVIEW */}

            <div className="panel ai-overview">

              <div className="panel-heading">

                <div>

                  <span>
                    AI ENGINE
                  </span>

                  <h2>
                    Analysis Overview
                  </h2>

                </div>

              </div>


              <div className="progress-item">

                <div>

                  <span>
                    Skills Identified
                  </span>

                  <strong>
                    {resume.skills?.length || 0}
                  </strong>

                </div>

                <div className="progress">

                  <div
                    style={{
                      width: resume.skills?.length
                        ? "100%"
                        : "0%"
                    }}
                  ></div>

                </div>

              </div>


              <div className="progress-item">

                <div>

                  <span>
                    Experience Analysis
                  </span>

                  <strong>
                    {resume.experience
                      ? `${resume.experience} yrs`
                      : "0"}
                  </strong>

                </div>

                <div className="progress">

                  <div
                    style={{
                      width:
                        resume.experience
                          ? "100%"
                          : "0%"
                    }}
                  ></div>

                </div>

              </div>


              <div className="progress-item">

                <div>

                  <span>
                    Analysis Status
                  </span>

                  <strong>
                    {resume.status ||
                      "completed"}
                  </strong>

                </div>

                <div className="progress">

                  <div
                    style={{
                      width:
                        resume.status === "completed"
                          ? "100%"
                          : "0%"
                    }}
                  ></div>

                </div>

              </div>

            </div>

          </section>

        )}


      </main>

    </div>
  );
}

export default App;