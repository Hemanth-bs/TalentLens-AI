import { Fragment, useEffect, useState } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const jobInputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #d0d5dd",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#101828",
  fontSize: "13px",
  outline: "none"
};

const jobTextareaStyle = {
  ...jobInputStyle,
  resize: "vertical",
  lineHeight: 1.5
};


function formatAiAnalysisLabel(key) {
  return String(key)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function renderAiAnalysis(analysis) {
  if (!analysis) return null;

  if (typeof analysis === "string") {
    return <p style={{ margin: 0, lineHeight: 1.7, color: "#475569" }}>{analysis}</p>;
  }

  if (typeof analysis !== "object") {
    return <p style={{ margin: 0, lineHeight: 1.7, color: "#475569" }}>{String(analysis)}</p>;
  }

  const renderValue = (value) => {
    if (Array.isArray(value)) {
      if (!value.length) return <span>None identified.</span>;
      return (
        <ul style={{ margin: "8px 0 0 20px", padding: 0, color: "#475569", lineHeight: 1.7 }}>
          {value.map((item, index) => (
            <li key={index}>
              {typeof item === "object" && item !== null
                ? Object.entries(item).map(([key, val], itemIndex) => (
                    <span key={key}>
                      {itemIndex > 0 ? " · " : ""}
                      <strong>{formatAiAnalysisLabel(key)}:</strong> {Array.isArray(val) ? val.join(", ") : String(val)}
                    </span>
                  ))
                : String(item)}
            </li>
          ))}
        </ul>
      );
    }

    if (value && typeof value === "object") {
      return (
        <div style={{ marginTop: "8px", display: "grid", gap: "6px", color: "#475569", lineHeight: 1.7 }}>
          {Object.entries(value).map(([key, val]) => (
            <div key={key}>
              <strong>{formatAiAnalysisLabel(key)}:</strong> {Array.isArray(val) ? val.join(", ") : String(val)}
            </div>
          ))}
        </div>
      );
    }

    return <p style={{ margin: "8px 0 0", lineHeight: 1.7, color: "#475569" }}>{String(value ?? "None identified.")}</p>;
  };

  const preferredOrder = [
    "matched_skills",
    "missing_skills",
    "transferable_skills",
    "relevant_experience",
    "strengths",
    "areas_for_improvement",
    "hr_recommendation",
    "candidate_feedback"
  ];

  const keys = [
    ...preferredOrder.filter((key) => Object.prototype.hasOwnProperty.call(analysis, key)),
    ...Object.keys(analysis).filter((key) => !preferredOrder.includes(key))
  ];

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      {keys.map((key) => (
        <div key={key}>
          <strong>{formatAiAnalysisLabel(key)}</strong>
          {renderValue(analysis[key])}
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  // ---------------------------------------------
  // AUTHENTICATION STATE
  // ---------------------------------------------

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
  try {
    return Boolean(
      localStorage.getItem("talentlens_token") &&
      localStorage.getItem("talentlens_user")
    );
  } catch {
    return false;
  }
});

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("talentlens_user")) || null;
    } catch {
      return null;
    }
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState(() => user?.role || "");

  // ---------------------------------------------
  // CANDIDATE PROFILE STATE
  // ---------------------------------------------

  const emptyCandidateProfile = {
    phone: "",
    location: "",
    bio: "",
    skills: [],
    education: "",
    experience: 0,
    projects: [],
    certifications: [],
    linkedin: "",
    github: ""
  };

  const [candidateProfile, setCandidateProfile] = useState(emptyCandidateProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [projectsInput, setProjectsInput] = useState("");
  const [certificationsInput, setCertificationsInput] = useState("");

  // ---------------------------------------------
  // CANDIDATE JOBS STATE
  // ---------------------------------------------

  const [candidateJobs, setCandidateJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");

  // ---------------------------------------------
  // HR JOBS STATE
  // ---------------------------------------------

  const [hrJobs, setHrJobs] = useState([]);
  const [hrJobsLoading, setHrJobsLoading] = useState(false);
  const [hrJobsError, setHrJobsError] = useState("");

  // ---------------------------------------------
  // HR CREATE JOB STATE
  // ---------------------------------------------

  const emptyJobForm = {
    title: "",
    description: "",
    responsibilities: "",
    location: "",
    workMode: "On-site",
    employmentType: "Full-time",
    salary: "",
    contractPeriod: "",
    minimumExperience: "",
    education: "",
    applicationDeadline: "",
    requiredSkills: "",
    preferredSkills: "",
    evaluationCriteria: "",
    internalNotes: "",
    jobStatus: "Draft"
  };

  const [jobForm, setJobForm] = useState(emptyJobForm);
  const [showJobForm, setShowJobForm] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [createJobError, setCreateJobError] = useState("");
  const [editingJobId, setEditingJobId] = useState(null);
  const [updatingJob, setUpdatingJob] = useState(false);

  // ---------------------------------------------
  // HR JOB UPDATE
  // ---------------------------------------------

  const handleUpdateJobSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("talentlens_token");

    if (!token) {
      setCreateJobError("Your session has expired. Please log in again.");
      return;
    }

    if (!editingJobId) {
      setCreateJobError("The job being edited could not be identified.");
      return;
    }

    if (!jobForm.title.trim()) {
      setCreateJobError("Job title is required.");
      return;
    }

    if (!jobForm.description.trim()) {
      setCreateJobError("Job description is required.");
      return;
    }

    if (
      jobForm.minimumExperience === "" ||
      Number.isNaN(Number(jobForm.minimumExperience)) ||
      Number(jobForm.minimumExperience) < 0
    ) {
      setCreateJobError(
        "Minimum experience must be a valid non-negative number."
      );
      return;
    }

    if (!jobForm.applicationDeadline) {
      setCreateJobError("Application deadline is required.");
      return;
    }

    if (!jobForm.jobStatus) {
      setCreateJobError("Job status is required.");
      return;
    }

    setUpdatingJob(true);
    setCreateJobError("");
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/jobs/${editingJobId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: jobForm.title.trim(),
            description: jobForm.description.trim(),
            responsibilities: splitJobFormList(
              jobForm.responsibilities
            ),
            location: jobForm.location.trim(),
            workMode: jobForm.workMode,
            employmentType: jobForm.employmentType,
            salary: jobForm.salary.trim(),
            contractPeriod: jobForm.contractPeriod.trim(),
            minimumExperience: Number(jobForm.minimumExperience),
            education: jobForm.education.trim(),
            applicationDeadline: jobForm.applicationDeadline,
            requiredSkills: splitJobFormList(
              jobForm.requiredSkills
            ),
            preferredSkills: splitJobFormList(
              jobForm.preferredSkills
            ),
            evaluationCriteria: splitJobFormList(
              jobForm.evaluationCriteria
            ),
            internalNotes: jobForm.internalNotes.trim(),
            jobStatus: jobForm.jobStatus
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to update job."
        );
      }

      setMessage(
        result?.message || "Job updated successfully."
      );

      resetJobForm();

      // Refresh the real HR job list from MongoDB.
      await loadHRJobs();
    } catch (error) {
      console.error("Update job error:", error);

      // Keep the form open and preserve all entered values.
      setCreateJobError(
        error.message || "Failed to update job."
      );
    } finally {
      setUpdatingJob(false);
    }
  };

  // ---------------------------------------------
  // CANDIDATE APPLICATIONS STATE
  // ---------------------------------------------

  const [candidateApplications, setCandidateApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState("");

  // ---------------------------------------------
  // FULL HR WORKFLOW STATE
  // ---------------------------------------------

  const [hrApplications, setHrApplications] = useState([]);
  const [hrApplicationsLoading, setHrApplicationsLoading] = useState(false);
  const [hrApplicationsError, setHrApplicationsError] = useState("");

  const [matchingJobId, setMatchingJobId] = useState("");
  const [matchingApplicationId, setMatchingApplicationId] = useState("");
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);

  const [rankingJobId, setRankingJobId] = useState("");
  const [rankingLoading, setRankingLoading] = useState(false);
  const [rankingError, setRankingError] = useState("");
  const [rankingData, setRankingData] = useState(null);

  const [analysisApplicationId, setAnalysisApplicationId] = useState("");
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [analysisData, setAnalysisData] = useState(null);
  const [candidateJobFilterId, setCandidateJobFilterId] = useState("");

  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const [deletingJobId, setDeletingJobId] = useState("");

  const [candidateFeedback, setCandidateFeedback] = useState({});
  const [feedbackLoadingId, setFeedbackLoadingId] = useState("");
  const [candidateResumes, setCandidateResumes] = useState([]);
  const [candidateResumesLoading, setCandidateResumesLoading] = useState(false);
  const [candidateResumesError, setCandidateResumesError] = useState("");

  // ---------------------------------------------
  // RESUME STATE
  // ---------------------------------------------

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [resumeId, setResumeId] = useState(null);
  const [resume, setResume] = useState(null);
  const [showLatestProcessedResume, setShowLatestProcessedResume] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);

  // ---------------------------------------------
  // HR APPLICATIONS
  // ---------------------------------------------

  const loadHRApplications = async () => {
    const token = localStorage.getItem("talentlens_token");
    if (!token || user?.role !== "hr") return;

    setHrApplicationsLoading(true);
    setHrApplicationsError("");

    try {
      const response = await fetch(`${API_BASE}/api/applications/hr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to load HR applications.");
      }
      setHrApplications(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      console.error("HR applications load error:", error);
      setHrApplicationsError(error.message || "Failed to load HR applications.");
    } finally {
      setHrApplicationsLoading(false);
    }
  };

  // ---------------------------------------------
  // HR JOB STATUS
  // ---------------------------------------------

  const handleJobStatusChange = async (jobId, jobStatus) => {
    const token = localStorage.getItem("talentlens_token");
    if (!token || !jobId) return;

    setStatusUpdatingId(jobId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ jobStatus })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to update job status.");
      }
      setMessage(result?.message || "Job status updated successfully.");
      await loadHRJobs();
      await loadCandidateJobs();
    } catch (error) {
      console.error("Job status update error:", error);
      setError(error.message || "Failed to update job status.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  // ---------------------------------------------
  // HR DELETE JOB
  // ---------------------------------------------

  const handleDeleteJob = async (job) => {
    if (!job?._id) return;
    const confirmed = window.confirm(
      `Delete "${job.title || "this job"}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    const token = localStorage.getItem("talentlens_token");
    setDeletingJobId(job._id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/jobs/${job._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete job.");
      }
      setMessage(result?.message || "Job deleted successfully.");
      await loadHRJobs();
    } catch (error) {
      console.error("Delete job error:", error);
      setError(error.message || "Failed to delete job.");
    } finally {
      setDeletingJobId("");
    }
  };

  // ---------------------------------------------
  // AI MATCHING
  // ---------------------------------------------

  const handleRunMatching = async () => {
    const token = localStorage.getItem("talentlens_token");
    const application = hrApplications.find(
      (item) => String(item?._id) === String(matchingApplicationId)
    );

    if (!matchingJobId || !matchingApplicationId) {
      setError("Select both a job and an applicant before starting AI matching.");
      return;
    }

    const resumeId = application?.resume?._id || application?.resume;
    if (!resumeId) {
      setError("This applicant does not have a processed resume linked to the application.");
      return;
    }

    setMatchingLoading(true);
    setMatchResult(null);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/matches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeId,
          jobId: matchingJobId
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "AI matching failed.");
      }
      setMatchResult(result?.data || null);
      setMessage(result?.message || "Candidate matched successfully.");
      await loadHRApplications();
    } catch (error) {
      console.error("AI matching error:", error);
      setError(error.message || "AI matching failed.");
    } finally {
      setMatchingLoading(false);
    }
  };

  // ---------------------------------------------
  // HR RANKING
  // ---------------------------------------------

  const loadRanking = async (jobId = rankingJobId) => {
    const token = localStorage.getItem("talentlens_token");
    if (!jobId) {
      setRankingError("Select a job to view ranking.");
      return;
    }

    setRankingLoading(true);
    setRankingError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/applications/job/${jobId}/ranking`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to load ranking.");
      }
      setRankingData(result?.data || null);
    } catch (error) {
      console.error("Ranking load error:", error);
      setRankingError(error.message || "Failed to load ranking.");
      setRankingData(null);
    } finally {
      setRankingLoading(false);
    }
  };

  // ---------------------------------------------
  // HR CANDIDATE ANALYSIS
  // ---------------------------------------------

  const loadCandidateAnalysis = async (applicationId = analysisApplicationId) => {
    const token = localStorage.getItem("talentlens_token");
    if (!applicationId) {
      setAnalysisError("Select an application to view analysis.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/applications/${applicationId}/analysis`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Candidate analysis is not available yet. Match the candidate first.");
      }
      setAnalysisData(result?.data || null);
    } catch (error) {
      console.error("Candidate analysis load error:", error);
      setAnalysisError(error.message || "Failed to load candidate analysis.");
      setAnalysisData(null);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ---------------------------------------------
  // HR APPLICATION STATUS
  // ---------------------------------------------

  const handleApplicationStatusChange = async (applicationId, status) => {
    const token = localStorage.getItem("talentlens_token");
    setStatusUpdatingId(applicationId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/applications/${applicationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status })
        }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to update application status.");
      }
      setMessage(result?.message || "Application status updated successfully.");
      await loadHRApplications();
      await loadCandidateApplications();
      if (rankingData?.job?.id) await loadRanking(rankingData.job.id);
    } catch (error) {
      console.error("Application status update error:", error);
      setError(error.message || "Failed to update application status.");
    } finally {
      setStatusUpdatingId("");
    }
  };

  // ---------------------------------------------
  // CANDIDATE FEEDBACK
  // ---------------------------------------------

  const loadCandidateFeedback = async (applicationId) => {
    const token = localStorage.getItem("talentlens_token");
    if (!applicationId) return;

    setFeedbackLoadingId(applicationId);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/applications/${applicationId}/feedback`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Feedback is not available yet.");
      }
      setCandidateFeedback((current) => ({
        ...current,
        [applicationId]: result?.data || null
      }));
    } catch (error) {
      console.error("Candidate feedback error:", error);
      setError(error.message || "Feedback is not available yet.");
    } finally {
      setFeedbackLoadingId("");
    }
  };

  // ---------------------------------------------
  // CANDIDATE RESUME LIST / E2E
  // ---------------------------------------------

  const loadCandidateResumes = async () => {
    const token = localStorage.getItem("talentlens_token");
    if (!token || user?.role !== "candidate") return;

    setCandidateResumesLoading(true);
    setCandidateResumesError("");

    try {
      const response = await fetch(`${API_BASE}/api/resumes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Failed to load resumes.");
      }
      const resumes = Array.isArray(result?.data) ? result.data : [];
      setCandidateResumes(resumes);
      if (resumes.length > 0 && !resumeId) {
        setResumeId(resumes[0]._id);
        setResume(resumes[0]);
      }
    } catch (error) {
      console.error("Resume list error:", error);
      setCandidateResumesError(error.message || "Failed to load resumes.");
    } finally {
      setCandidateResumesLoading(false);
    }
  };

  // ---------------------------------------------
  // UI STATE
  // ---------------------------------------------

  const [activeSection, setActiveSection] = useState(() => {
  try {
    return sessionStorage.getItem("talentlens_section") || "Dashboard";
  } catch {
    return "Dashboard";
  }
});

useEffect(() => {
  try {
    sessionStorage.setItem("talentlens_section", activeSection);
  } catch {
    // ignore storage errors
  }
}, [activeSection]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [applicationConfirmJob, setApplicationConfirmJob] = useState(null);
  const [applicationNotice, setApplicationNotice] = useState(null);

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
          headers: {
            Authorization: `Bearer ${localStorage.getItem("talentlens_token")}`
          },
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

      if (result?.data) {
        setResume(result.data);
      }

      setShowLatestProcessedResume(true);

      setMessage(
        "Resume uploaded, analyzed and indexed successfully!"
      );
      await loadCandidateResumes();

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
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("talentlens_token")}`
          }
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

      if (result?.data) {
        setResume(result.data);
      }

      setMessage(
        "Resume analyzed successfully!"
      );
      await loadCandidateResumes();

      setActiveSection("Resume");

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
  // HR LOGIN
  // ---------------------------------------------

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      const loggedInUser = result?.data?.user;

      if (!loggedInUser?.role || loggedInUser.role !== selectedRole) {
        throw new Error(
          `This account is not authorized for the ${selectedRole === "candidate" ? "Candidate" : "HR"} portal.`
        );
      }

      localStorage.setItem("talentlens_token", result.data.token);
      localStorage.setItem("talentlens_user", JSON.stringify(loggedInUser));

      setUser(loggedInUser);
      setIsLoggedIn(true);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error.message || "Login failed");
    } finally {
      setLoggingIn(false);
    }
  };

  // ---------------------------------------------
  // GOOGLE SIGN-IN (CANDIDATES ONLY)
  // ---------------------------------------------

  const handleGoogleLogin = async (credentialResponse) => {
    if (selectedRole !== "candidate") {
      setLoginError("Google sign-in is available only for candidates.");
      return;
    }

    if (!credentialResponse?.credential) {
      setLoginError("Google sign-in did not return a valid credential. Please try again.");
      return;
    }

    setLoggingIn(true);
    setLoginError("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.message || "Google sign-in failed.");
      }

      const loggedInUser = result?.data?.user;
      const token = result?.data?.token;

      if (!token || loggedInUser?.role !== "candidate") {
        throw new Error("Google sign-in is available only for candidate accounts.");
      }

      localStorage.setItem("talentlens_token", token);
      localStorage.setItem("talentlens_user", JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsLoggedIn(true);
      setLoginEmail("");
      setLoginPassword("");
      setLoginError("");
    } catch (error) {
      console.error("Google sign-in error:", error);
      setLoginError(error.message || "Google sign-in failed.");
    } finally {
      setLoggingIn(false);
    }
  };

  // ---------------------------------------------
  // CANDIDATE PROFILE API
  // ---------------------------------------------

  const loadCandidateProfile = async () => {
    const token = localStorage.getItem("talentlens_token");
    if (!token || user?.role !== "candidate") return;

    setProfileLoading(true);
    setProfileError("");

    try {
      const response = await fetch(`${API_BASE}/api/candidates/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load profile");
      }

      if (result?.data) {
        setCandidateProfile({
          ...emptyCandidateProfile,
          ...result.data
        });
      }
    } catch (error) {
      console.error("Candidate profile load error:", error);
      setProfileError(error.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  // ---------------------------------------------
  // CANDIDATE JOBS API
  // ---------------------------------------------

  const loadCandidateJobs = async () => {
    const token = localStorage.getItem("talentlens_token");
    if (!token || user?.role !== "candidate") return;

    setJobsLoading(true);
    setJobsError("");

    try {
      const response = await fetch(`${API_BASE}/api/jobs/candidate`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load available jobs"
        );
      }

      setCandidateJobs(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error("Candidate jobs load error:", error);
      setJobsError(
        error.message || "Failed to load available jobs"
      );
    } finally {
      setJobsLoading(false);
    }
  };

  // ---------------------------------------------
  // HR JOBS API
  // ---------------------------------------------
  // Loads jobs belonging to the authenticated HR company.

  const loadHRJobs = async () => {
    const token = localStorage.getItem("talentlens_token");

    if (!token || user?.role !== "hr") {
      return;
    }

    setHrJobsLoading(true);
    setHrJobsError("");

    try {
      const response = await fetch(`${API_BASE}/api/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load jobs"
        );
      }

      setHrJobs(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error("HR jobs load error:", error);

      setHrJobsError(
        error.message || "Failed to load jobs"
      );
    } finally {
      setHrJobsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user?.role === "candidate") {
      loadCandidateProfile();
    }
  }, [isLoggedIn, user?.role]);

  useEffect(() => {
    if (
      isLoggedIn &&
      user?.role === "candidate" &&
      (activeSection === "Find Jobs" || activeSection === "Dashboard")
    ) {
      loadCandidateJobs();
    }
  }, [isLoggedIn, user?.role, activeSection]);

  // ---------------------------------------------
  // HR JOBS LOAD EFFECT
  // ---------------------------------------------

  useEffect(() => {
    if (
      isLoggedIn &&
      user?.role === "hr" &&
      activeSection === "Jobs"
    ) {
      loadHRJobs();
    }
  }, [isLoggedIn, user?.role, activeSection]);

  useEffect(() => {
    if (isLoggedIn && user?.role === "hr" && ["Dashboard", "Candidates", "AI Matching", "Rankings"].includes(activeSection)) {
      loadHRApplications();
      if (hrJobs.length === 0) loadHRJobs();
    }
  }, [isLoggedIn, user?.role, activeSection]);

  useEffect(() => {
    if (isLoggedIn && user?.role === "candidate" && activeSection === "Resume") {
      loadCandidateResumes();
    }
  }, [isLoggedIn, user?.role, activeSection]);

  // ---------------------------------------------
  // APPLY FOR A JOB
  // ---------------------------------------------
  // Sends the selected job ID to the backend.

  const handleApplyForJob = async (jobId) => {
    const token = localStorage.getItem("talentlens_token");

    if (!token) {
      setError("Please log in again.");
      return;
    }

    if (!jobId) {
      setError("Job ID is missing.");
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/applications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            jobId: jobId
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to submit application"
        );
      }

      setMessage(
        result.message ||
        "Application submitted successfully."
      );
      setApplicationNotice({
        type: "success",
        message: result.message || "Application submitted successfully."
      });

      await loadCandidateApplications();

    } catch (error) {
      console.error(
        "Apply for job error:",
        error
      );

      const alreadySubmitted = error.message?.toLowerCase().includes("already applied");
      const noticeMessage = alreadySubmitted
        ? "Application already submitted for this job."
        : error.message || "Failed to submit application";

      setError(noticeMessage);
      if (alreadySubmitted) {
        setApplicationNotice({
          type: "info",
          message: "Application already submitted for this job."
        });
      }
    }
  };

  // ---------------------------------------------
  // LOAD CANDIDATE APPLICATIONS
  // ---------------------------------------------

  const loadCandidateApplications = async () => {
    const token = localStorage.getItem("talentlens_token");

    if (!token || user?.role !== "candidate") return;

    setApplicationsLoading(true);
    setApplicationsError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/applications/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load applications"
        );
      }

      setCandidateApplications(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (error) {
      console.error(
        "Candidate applications load error:",
        error
      );

      setApplicationsError(
        error.message || "Failed to load applications"
      );
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (
      isLoggedIn &&
      user?.role === "candidate" &&
      (activeSection === "My Applications" || activeSection === "Dashboard")
    ) {
      loadCandidateApplications();
    }
  }, [isLoggedIn, user?.role, activeSection]);

  const handleCandidateProfileChange = (field, value) => {
    setCandidateProfile((current) => ({
      ...current,
      [field]: value
    }));
  };

  const addProfileItem = (field, value, clearInput) => {
    const cleanValue = value.trim();

    if (!cleanValue) return;

    setCandidateProfile((current) => ({
      ...current,
      [field]: [
        ...(current[field] || []),
        cleanValue
      ]
    }));

    clearInput("");
  };

  const removeProfileItem = (field, index) => {
    setCandidateProfile((current) => ({
      ...current,
      [field]: current[field].filter(
        (_, itemIndex) => itemIndex !== index
      )
    }));
  };

  const handleSaveCandidateProfile = async (event) => {
    event.preventDefault();

    setProfileSaving(true);
    setProfileMessage("");
    setProfileError("");

    try {
      const token = localStorage.getItem("talentlens_token");

      const response = await fetch(
        `${API_BASE}/api/candidates/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(candidateProfile)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to save profile"
        );
      }

      if (result?.data) {
        setCandidateProfile({
          ...emptyCandidateProfile,
          ...result.data
        });
      }

      setProfileMessage(
        "Profile saved successfully."
      );
    } catch (error) {
      console.error(
        "Candidate profile save error:",
        error
      );

      setProfileError(
        error.message || "Failed to save profile"
      );
    } finally {
      setProfileSaving(false);
    }
  };

  // ---------------------------------------------
  // HR LOGOUT
  // ---------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("talentlens_token");
    localStorage.removeItem("talentlens_user");
    sessionStorage.removeItem("talentlens_section");

    setUser(null);
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setSelectedRole("");

    setCandidateProfile(emptyCandidateProfile);
    setProfileMessage("");
    setProfileError("");
  };

  useEffect(() => {
  const token = localStorage.getItem("talentlens_token");
  if (!isLoggedIn || !token) return;

  let cancelled = false;

  const verifySession = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Log out ONLY if the server says the token is invalid or expired.
      if (!cancelled && (response.status === 401 || response.status === 403)) {
        handleLogout();
      }
    } catch {
      // Network error or a sleeping Render server: stay logged in.
    }
  };

  verifySession();

  return () => {
    cancelled = true;
  };
}, []);

  // ---------------------------------------------
  // NAVIGATION
  // ---------------------------------------------

  const handleNavigation = (section) => {
    setActiveSection(section);

    // Normal Candidates navigation shows all applications.
    // Ranking -> Analysis navigation sets a specific job filter directly.
    setCandidateJobFilterId("");

    setMessage("");
    setError("");
  };

  // ---------------------------------------------
  // HR JOB CREATION
  // ---------------------------------------------

  const handleCreateJob = () => {
    setActiveSection("Jobs");
    setEditingJobId(null);
    setJobForm(emptyJobForm);
    setShowJobForm(true);
    setCreateJobError("");
    setMessage("");
    setError("");
  };

  const handleJobFormChange = (event) => {
    const { name, value } = event.target;

    setJobForm((current) => ({
      ...current,
      [name]: value
    }));

    if (createJobError) {
      setCreateJobError("");
    }
  };

  const resetJobForm = () => {
    setJobForm(emptyJobForm);
    setShowJobForm(false);
    setCreateJobError("");
    setEditingJobId(null);
    setCreatingJob(false);
    setUpdatingJob(false);
  };

  const formatDateForJobForm = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toISOString().slice(0, 10);
  };

  const joinJobFormList = (value) =>
    Array.isArray(value) ? value.join("\n") : "";

  const handleEditJob = (job) => {
    if (!job?._id) {
      setError("Job ID is missing.");
      return;
    }

    setActiveSection("Jobs");
    setEditingJobId(job._id);
    setCreateJobError("");
    setMessage("");
    setError("");

    setJobForm({
      title: job.title || "",
      description: job.description || "",
      responsibilities: joinJobFormList(job.responsibilities),
      location: job.location || "",
      workMode: job.workMode || "On-site",
      employmentType: job.employmentType || "Full-time",
      salary: job.salary || "",
      contractPeriod: job.contractPeriod || "",
      minimumExperience:
        job.minimumExperience === undefined ||
        job.minimumExperience === null
          ? ""
          : String(job.minimumExperience),
      education: job.education || "",
      applicationDeadline: formatDateForJobForm(
        job.applicationDeadline
      ),
      requiredSkills: joinJobFormList(job.requiredSkills),
      preferredSkills: joinJobFormList(job.preferredSkills),
      evaluationCriteria: joinJobFormList(job.evaluationCriteria),
      internalNotes: job.internalNotes || "",
      jobStatus: job.jobStatus || "Draft"
    });

    setShowJobForm(true);
  };

  const splitJobFormList = (value) =>
    value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);

  const handleCreateJobSubmit = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("talentlens_token");

    if (!token) {
      setCreateJobError("Your session has expired. Please log in again.");
      return;
    }

    if (!jobForm.title.trim()) {
      setCreateJobError("Job title is required.");
      return;
    }

    if (!jobForm.description.trim()) {
      setCreateJobError("Job description is required.");
      return;
    }

    if (
      jobForm.minimumExperience === "" ||
      Number.isNaN(Number(jobForm.minimumExperience)) ||
      Number(jobForm.minimumExperience) < 0
    ) {
      setCreateJobError(
        "Minimum experience must be a valid non-negative number."
      );
      return;
    }

    if (!jobForm.applicationDeadline) {
      setCreateJobError("Application deadline is required.");
      return;
    }

    if (!jobForm.jobStatus) {
      setCreateJobError("Job status is required.");
      return;
    }

    setCreatingJob(true);
    setCreateJobError("");
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: jobForm.title.trim(),
          description: jobForm.description.trim(),
          responsibilities: splitJobFormList(jobForm.responsibilities),
          location: jobForm.location.trim(),
          workMode: jobForm.workMode,
          employmentType: jobForm.employmentType,
          salary: jobForm.salary.trim(),
          contractPeriod: jobForm.contractPeriod.trim(),
          minimumExperience: Number(jobForm.minimumExperience),
          education: jobForm.education.trim(),
          applicationDeadline: jobForm.applicationDeadline,
          requiredSkills: splitJobFormList(jobForm.requiredSkills),
          preferredSkills: splitJobFormList(jobForm.preferredSkills),
          evaluationCriteria: splitJobFormList(
            jobForm.evaluationCriteria
          ),
          internalNotes: jobForm.internalNotes.trim(),
          jobStatus: jobForm.jobStatus
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to create job."
        );
      }

      setMessage(
        result?.message || "Job created successfully."
      );

      resetJobForm();

      // Refresh the real HR job list from MongoDB.
      await loadHRJobs();
    } catch (error) {
      console.error("Create job error:", error);

      // Keep the form open and preserve all entered values.
      setCreateJobError(
        error.message || "Failed to create job."
      );
    } finally {
      setCreatingJob(false);
    }
  };

  // ---------------------------------------------
  // FEATURE BUTTONS
  // ---------------------------------------------

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
  // COMMON ROLE SELECTION + LOGIN SCREEN
  // ---------------------------------------------

  if (!isLoggedIn && !selectedRole) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background:
            "linear-gradient(135deg, #f8fafc, #eef2ff)"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "700px",
            background: "#ffffff",
            borderRadius: "24px",
            padding: "42px",
            boxShadow:
              "0 20px 50px rgba(15, 23, 42, 0.12)",
            border: "1px solid #e5e7eb"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "30px"
            }}
          >
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111827",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "21px"
              }}
            >
              T
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "26px",
                  color: "#111827"
                }}
              >
                TalentLens
              </h1>

              <p
                style={{
                  margin: "3px 0 0",
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                AI Recruitment
              </p>
            </div>
          </div>

          <div
            style={{
              textAlign: "center",
              marginBottom: "28px"
            }}
          >
            <p
              style={{
                margin: "0 0 7px",
                fontSize: "12px",
                fontWeight: "700",
                color: "#7c3aed",
                letterSpacing: "0.08em"
              }}
            >
              WELCOME
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "30px",
                color: "#111827"
              }}
            >
              Choose your portal
            </h2>

            <p
              style={{
                margin: "9px 0 0",
                color: "#6b7280",
                lineHeight: 1.5
              }}
            >
              Continue as an HR professional or candidate.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(0, 1fr))",
              gap: "18px"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSelectedRole("hr");
                setLoginError("");
              }}
              style={{
                textAlign: "left",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #dbeafe",
                background: "#f8fbff",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "12px"
                }}
              >
                HR
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                  color: "#111827",
                  fontSize: "19px"
                }}
              >
                HR Portal
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  lineHeight: 1.5,
                  fontSize: "13px"
                }}
              >
                Manage jobs, review candidates and use AI-powered matching.
              </p>

              <div
                style={{
                  marginTop: "18px",
                  color: "#4f46e5",
                  fontWeight: "700",
                  fontSize: "13px"
                }}
              >
                Continue as HR →
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedRole("candidate");
                setLoginError("");
              }}
              style={{
                textAlign: "left",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #d1fae5",
                background: "#f7fffb",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  fontSize: "30px",
                  marginBottom: "12px"
                }}
              >
                CV
              </div>

              <h3
                style={{
                  margin: "0 0 7px",
                  color: "#111827",
                  fontSize: "19px"
                }}
              >
                Candidate Portal
              </h3>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  lineHeight: 1.5,
                  fontSize: "13px"
                }}
              >
                Find jobs, submit your profile and track your applications.
              </p>

              <div
                style={{
                  marginTop: "18px",
                  color: "#047857",
                  fontWeight: "700",
                  fontSize: "13px"
                }}
              >
                Continue as Candidate →
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    const isCandidate = selectedRole === "candidate";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background:
            "linear-gradient(135deg, #f8fafc, #eef2ff)"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "430px",
            background: "#ffffff",
            borderRadius: "20px",
            padding: "36px",
            boxShadow:
              "0 20px 50px rgba(15, 23, 42, 0.12)",
            border: "1px solid #e5e7eb"
          }}
        >
          <button
            type="button"
            onClick={() => {
              setSelectedRole("");
              setLoginError("");
            }}
            style={{
              border: "none",
              background: "transparent",
              color: "#6b7280",
              padding: 0,
              cursor: "pointer",
              fontSize: "13px",
              marginBottom: "22px"
            }}
          >
            ← Choose another portal
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "28px"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#111827",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "20px"
              }}
            >
              T
            </div>

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: "24px",
                  color: "#111827"
                }}
              >
                TalentLens
              </h1>

              <p
                style={{
                  margin: "3px 0 0",
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                AI Recruitment
              </p>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: "12px",
                fontWeight: "700",
                color: isCandidate
                  ? "#047857"
                  : "#7c3aed",
                letterSpacing: "0.08em"
              }}
            >
              {isCandidate
                ? "CANDIDATE PORTAL"
                : "HR PORTAL"}
            </p>

            <h2
              style={{
                margin: 0,
                fontSize: "30px",
                color: "#111827"
              }}
            >
              Welcome back
            </h2>

            <p
              style={{
                margin: "8px 0 0",
                color: "#6b7280",
                lineHeight: 1.5
              }}
            >
              {isCandidate
                ? "Sign in to find jobs and track your applications."
                : "Sign in to manage jobs and evaluate candidates."}
            </p>
          </div>

          {loginError && (
            <div
              style={{
                marginBottom: "18px",
                padding: "12px 14px",
                borderRadius: "10px",
                background: "#fef2f2",
                color: "#b91c1c",
                border: "1px solid #fecaca",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              {loginError}
            </div>
          )}

          {!isCandidate && (
            <form onSubmit={handleLogin}>
              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#374151"
                }}
              >
                HR Email
              </label>

              <input
                type="email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                placeholder="Enter HR email"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  marginBottom: "16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  fontSize: "14px"
                }}
              />

              <label
                style={{
                  display: "block",
                  marginBottom: "7px",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "#374151"
                }}
              >
                Password
              </label>

              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Enter password"
                required
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "13px 14px",
                  marginBottom: "20px",
                  border: "1px solid #d1d5db",
                  borderRadius: "10px",
                  fontSize: "14px"
                }}
              />

              <button
                type="submit"
                disabled={loggingIn}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: "10px",
                  padding: "14px",
                  background: "#111827",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: loggingIn ? "not-allowed" : "pointer",
                  opacity: loggingIn ? 0.7 : 1
                }}
              >
                {loggingIn ? "Signing in..." : "Sign in as HR"}
              </button>
            </form>
          )}

          {isCandidate && (
            <div style={{ marginTop: "8px" }}>
              <p style={{ margin: "0 0 18px", color: "#64748b", fontSize: "14px", lineHeight: 1.6 }}>
                Sign in securely with your Google account to access your candidate dashboard, find jobs, and track your applications.
              </p>

              <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => setLoginError("Google sign-in was cancelled or failed. Please try again.")}
                  text="continue_with"
                  shape="rectangular"
                  width="350"
                  useOneTap={false}
                />
              </div>

              <p style={{ margin: "14px 0 0", color: "#6b7280", fontSize: "12px", textAlign: "center", lineHeight: 1.5 }}>
                Candidate accounts only · No candidate password required
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // CANDIDATE PORTAL
  // ---------------------------------------------

  if (isLoggedIn && user?.role === "candidate") {
    const fieldStyle = {
      width: "100%",
      boxSizing: "border-box",
      padding: "12px 14px",
      border: "1px solid #d1d5db",
      borderRadius: "10px",
      fontSize: "14px",
      background: "#fff"
    };

    const labelStyle = {
      display: "block",
      marginBottom: "7px",
      fontSize: "13px",
      fontWeight: "700",
      color: "#374151"
    };

    return (
      <div
        className="candidate-portal"
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          color: "#111827"
        }}
      >
        <header className="candidate-topbar"
          style={{
            background: "#111827",
            color: "#fff",
            padding: "18px 28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px"
          }}
        >
          <div>
            <strong style={{ fontSize: "22px" }}>
              TalentLens
            </strong>

            <span
              style={{
                display: "block",
                fontSize: "12px",
                color: "#cbd5e1",
                marginTop: "3px"
              }}
            >
              Candidate Portal
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px"
            }}
          >
            <span>
              {user?.name || "Candidate"}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                border: "1px solid #475569",
                background: "transparent",
                color: "#fff",
                borderRadius: "8px",
                padding: "8px 12px",
                cursor: "pointer"
              }}
            >
              Logout
            </button>
          </div>
        </header>

        <main
          className="candidate-main"
          style={{
            maxWidth: "none",
            margin: "0 auto",
            padding: "38px clamp(24px, 5vw, 76px) 64px"
          }}
        >
          <div style={{ marginBottom: "28px" }}>
            <p
              style={{
                margin: 0,
                color: "#2563eb",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "0.08em"
              }}
            >
              CANDIDATE WORKSPACE
            </p>

            <h1
              style={{
                margin: "8px 0 6px",
                fontSize: "32px"
              }}
            >
              Welcome, {user?.name || "Candidate"} 👋
            </h1>

            <p
              style={{
                margin: 0,
                color: "#64748b"
              }}
            >
              Build your profile once and let TalentLens use it for intelligent job matching.
            </p>
          </div>

          <nav
            className="candidate-nav"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "30px"
            }}
          >
            {[
              "Dashboard",
              "Find Jobs",
              "My Applications",
              "Resume",
              "Profile",
              "Settings"
            ].map((section) => (
              <button
                key={section}
                type="button"
                onClick={() =>
                  handleNavigation(section)
                }
                style={{
                  border: "1px solid",
                  borderColor:
                    activeSection === section
                      ? "#2563eb"
                      : "#e5e7eb",
                  background:
                    activeSection === section
                      ? "#eff6ff"
                      : "#ffffff",
                  color:
                    activeSection === section
                      ? "#1d4ed8"
                      : "#475569",
                  borderRadius: "9px",
                  padding: "9px 13px",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                {section}
              </button>
            ))}
          </nav>

          {activeSection === "Find Jobs" ? (
            <section>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>
                  Find Jobs
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b"
                  }}
                >
                  Explore available opportunities. Internal HR evaluation criteria are not shown here.
                </p>
              </div>

              {jobsLoading && (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "22px",
                    color: "#64748b"
                  }}
                >
                  Loading available jobs...
                </div>
              )}

              {jobsError && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    fontWeight: "600"
                  }}
                >
                  ⚠ {jobsError}
                </div>
              )}

              {!jobsLoading &&
                !jobsError &&
                candidateJobs.length === 0 && (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "28px",
                      color: "#64748b"
                    }}
                  >
                    No jobs are currently available.
                  </div>
                )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "18px"
                }}
              >
                {candidateJobs.map((job) => (
                  <article
                    key={job._id}
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "22px",
                      boxShadow:
                        "0 5px 16px rgba(15, 23, 42, 0.05)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "flex-start"
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "20px"
                          }}
                        >
                          {job.title || "Untitled Job"}
                        </h3>

                        <p
                          style={{
                            margin: "5px 0 0",
                            color: "#2563eb",
                            fontWeight: "700"
                          }}
                        >
                          {job.company || "Company"}
                        </p>
                      </div>

                      <span
                        style={{
                          padding: "6px 9px",
                          borderRadius: "16px",
                          background: "#ecfdf5",
                          color: "#047857",
                          fontSize: "12px",
                          fontWeight: "700",
                          whiteSpace: "nowrap"
                        }}
                      >
                        Open
                      </span>
                    </div>

                    <p
                      style={{
                        color: "#475569",
                        lineHeight: 1.6,
                        margin: "16px 0"
                      }}
                    >
                      {job.description ||
                        "No job description provided."}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gap: "9px",
                        fontSize: "13px",
                        color: "#475569",
                        marginBottom: "16px"
                      }}
                    >
                      <div>
                        <strong>Education:</strong>{" "}
                        {job.education || "Not specified"}
                      </div>

                      <div>
                        <strong>Experience:</strong>{" "}
                        {job.minimumExperience ?? 0} years minimum
                      </div>
                    </div>

                    {Array.isArray(job.responsibilities) &&
                      job.responsibilities.length > 0 && (
                        <div style={{ marginBottom: "18px" }}>
                          <strong
                            style={{ fontSize: "13px" }}
                          >
                            Responsibilities
                          </strong>

                          <ul
                            style={{
                              margin: "8px 0 0",
                              paddingLeft: "20px",
                              color: "#64748b",
                              fontSize: "13px",
                              lineHeight: 1.6
                            }}
                          >
                            {job.responsibilities.map(
                              (item, index) => (
                                <li key={index}>
                                  {item}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                    <button
                      type="button"
                      onClick={() => {
                        setMessage("");
                        setError("");
                        setApplicationConfirmJob(job);
                      }}
                      style={{
                        width: "100%",
                        border: "none",
                        borderRadius: "10px",
                        padding: "12px",
                        background: "#111827",
                        color: "#fff",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Apply Now
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ) : activeSection === "Profile" ? (
            <section
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "18px",
                padding: "28px"
              }}
            >
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ margin: 0 }}>
                  My Profile
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b"
                  }}
                >
                  Add information that helps TalentLens understand your professional background.
                </p>
              </div>

              {profileLoading && (
                <div
                  style={{
                    marginBottom: "16px",
                    color: "#64748b"
                  }}
                >
                  Loading profile...
                </div>
              )}

              {profileMessage && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#ecfdf5",
                    color: "#047857",
                    border: "1px solid #a7f3d0",
                    fontWeight: "600"
                  }}
                >
                  ✓ {profileMessage}
                </div>
              )}

              {profileError && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    fontWeight: "600"
                  }}
                >
                  ⚠ {profileError}
                </div>
              )}

              <form
                onSubmit={handleSaveCandidateProfile}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(240px, 1fr))",
                    gap: "18px"
                  }}
                >
                  <div>
                    <label style={labelStyle}>
                      Phone
                    </label>

                    <input
                      value={candidateProfile.phone}
                      onChange={(e) =>
                        handleCandidateProfileChange(
                          "phone",
                          e.target.value
                        )
                      }
                      style={fieldStyle}
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Location
                    </label>

                    <input
                      value={candidateProfile.location}
                      onChange={(e) =>
                        handleCandidateProfileChange(
                          "location",
                          e.target.value
                        )
                      }
                      style={fieldStyle}
                      placeholder="City, State"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Education
                    </label>

                    <input
                      value={candidateProfile.education}
                      onChange={(e) =>
                        handleCandidateProfileChange(
                          "education",
                          e.target.value
                        )
                      }
                      style={fieldStyle}
                      placeholder="B.E. Computer Science"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      Experience (years)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={candidateProfile.experience}
                      onChange={(e) =>
                        handleCandidateProfileChange(
                          "experience",
                          Number(e.target.value)
                        )
                      }
                      style={fieldStyle}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      LinkedIn
                    </label>

                    <input
                      value={candidateProfile.linkedin}
                      onChange={(e) =>
                        handleCandidateProfileChange(
                          "linkedin",
                          e.target.value
                        )
                      }
                      style={fieldStyle}
                      placeholder="LinkedIn URL"
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      GitHub
                    </label>

                    <input
                      value={candidateProfile.github}
                      onChange={(e) =>
                        handleCandidateProfileChange(
                          "github",
                          e.target.value
                        )
                      }
                      style={fieldStyle}
                      placeholder="GitHub URL"
                    />
                  </div>
                </div>

                <div style={{ marginTop: "18px" }}>
                  <label style={labelStyle}>
                    Professional Bio
                  </label>

                  <textarea
                    value={candidateProfile.bio}
                    onChange={(e) =>
                      handleCandidateProfileChange(
                        "bio",
                        e.target.value
                      )
                    }
                    rows="4"
                    style={{
                      ...fieldStyle,
                      resize: "vertical"
                    }}
                    placeholder="Briefly describe your professional background."
                  />
                </div>

                <div style={{ marginTop: "22px" }}>
                  <label style={labelStyle}>
                    Skills
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px"
                    }}
                  >
                    <input
                      value={skillsInput}
                      onChange={(e) =>
                        setSkillsInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();

                          addProfileItem(
                            "skills",
                            skillsInput,
                            setSkillsInput
                          );
                        }
                      }}
                      style={{
                        ...fieldStyle,
                        flex: 1
                      }}
                      placeholder="Type a skill and press Enter"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        addProfileItem(
                          "skills",
                          skillsInput,
                          setSkillsInput
                        )
                      }
                      style={{
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "0 18px",
                        cursor: "pointer"
                      }}
                    >
                      Add
                    </button>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "10px"
                    }}
                  >
                    {candidateProfile.skills.map(
                      (item, index) => (
                        <span
                          key={`${item}-${index}`}
                          style={{
                            padding: "7px 10px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            borderRadius: "18px",
                            fontSize: "13px"
                          }}
                        >
                          {item}{" "}

                          <button
                            type="button"
                            onClick={() =>
                              removeProfileItem(
                                "skills",
                                index
                              )
                            }
                            style={{
                              border: 0,
                              background:
                                "transparent",
                              color: "#1d4ed8",
                              cursor: "pointer"
                            }}
                          >
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div style={{ marginTop: "22px" }}>
                  <label style={labelStyle}>
                    Projects
                  </label>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px"
                    }}
                  >
                    <input
                      value={projectsInput}
                      onChange={(e) =>
                        setProjectsInput(e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();

                          addProfileItem(
                            "projects",
                            projectsInput,
                            setProjectsInput
                          );
                        }
                      }}
                      style={{
                        ...fieldStyle,
                        flex: 1
                      }}
                      placeholder="Project name or description"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        addProfileItem(
                          "projects",
                          projectsInput,
                          setProjectsInput
                        )
                      }
                      style={{
                        border: "none",
                        background: "#2563eb",
                        color: "#fff",
                        borderRadius: "10px",
                        padding: "0 18px",
                        cursor: "pointer"
                      }}
                    >
                      Add
                    </button>
                  </div>

                  <div
                    style={{ marginTop: "10px" }}
                  >
                    {candidateProfile.projects.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                            padding: "9px 12px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            marginBottom: "6px",
                            fontSize: "13px"
                          }}
                        >
                          <span>
                            • {item}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              removeProfileItem(
                                "projects",
                                index
                              )
                            }
                            style={{
                              border: 0,
                              background:
                                "transparent",
                              cursor: "pointer"
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={
                    profileSaving ||
                    profileLoading
                  }
                  style={{
                    marginTop: "28px",
                    border: "none",
                    borderRadius: "10px",
                    padding: "13px 22px",
                    background: "#111827",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: profileSaving
                      ? "not-allowed"
                      : "pointer",
                    opacity: profileSaving
                      ? 0.7
                      : 1
                  }}
                >
                  {profileSaving
                    ? "Saving Profile..."
                    : "Save Profile"}
                </button>
              </form>
            </section>
          ) : activeSection === "My Applications" ? (
            <section>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>
                  My Applications
                </h2>

                <p
                  style={{
                    margin: "6px 0 0",
                    color: "#64748b"
                  }}
                >
                  Track the jobs you have applied for and monitor your application status.
                </p>
              </div>

              {applicationsLoading && (
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "22px",
                    color: "#64748b"
                  }}
                >
                  Loading your applications...
                </div>
              )}

              {applicationsError && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    border: "1px solid #fecaca",
                    fontWeight: "600"
                  }}
                >
                  ⚠ {applicationsError}
                </div>
              )}

              {!applicationsLoading &&
                !applicationsError &&
                candidateApplications.length === 0 && (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "28px",
                      color: "#64748b"
                    }}
                  >
                    You have not applied for any jobs yet.
                  </div>
                )}

              <div
                style={{
                  display: "grid",
                  gap: "16px"
                }}
              >
                {candidateApplications.map(
                  (application) => {
                    const job =
                      application.job || {};

                    const status =
                      application.status ||
                      "Applied";

                    return (
                      <article
                        className="candidate-application-card"
                        key={application._id}
                        style={{
                          background: "#fff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "16px",
                          padding: "22px",
                          boxShadow:
                            "0 5px 16px rgba(15, 23, 42, 0.05)"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: "16px",
                            flexWrap: "wrap"
                          }}
                        >
                          <div>
                            <h3
                              style={{
                                margin: 0,
                                fontSize: "20px"
                              }}
                            >
                              {job.title || "Job"}
                            </h3>

                            <p
                              style={{
                                margin:
                                  "5px 0 0",
                                color: "#2563eb",
                                fontWeight: "700"
                              }}
                            >
                              {job.company ||
                                "Company"}
                            </p>
                          </div>

                          <span
                            style={{
                              padding:
                                "7px 12px",
                              borderRadius:
                                "18px",
                              background:
                                status ===
                                "Rejected"
                                  ? "#fef2f2"
                                  : status ===
                                    "Selected"
                                    ? "#ecfdf5"
                                    : status ===
                                      "Shortlisted"
                                      ? "#eff6ff"
                                      : "#f3f4f6",
                              color:
                                status ===
                                "Rejected"
                                  ? "#b91c1c"
                                  : status ===
                                    "Selected"
                                    ? "#047857"
                                    : status ===
                                      "Shortlisted"
                                      ? "#1d4ed8"
                                      : "#475569",
                              fontSize: "12px",
                              fontWeight: "800",
                              whiteSpace:
                                "nowrap"
                            }}
                          >
                            {status}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(180px, 1fr))",
                            gap: "10px",
                            marginTop: "18px",
                            paddingTop: "16px",
                            borderTop:
                              "1px solid #f1f5f9",
                            fontSize: "13px",
                            color: "#475569"
                          }}
                        >
                          <div>
                            <strong>
                              Education:
                            </strong>{" "}
                            {job.education ||
                              "Not specified"}
                          </div>

                          <div>
                            <strong>
                              Experience:
                            </strong>{" "}
                            {job.minimumExperience ??
                              0}{" "}
                            years minimum
                          </div>

                          <div>
                            <strong>
                              Applied:
                            </strong>{" "}
                            {application.createdAt
                              ? new Date(
                                  application.createdAt
                                ).toLocaleDateString()
                              : "Recently"}
                          </div>
                        </div>

                        <div style={{ marginTop: "16px" }}>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => loadCandidateFeedback(application._id)}
                            disabled={feedbackLoadingId === application._id}
                          >
                            {feedbackLoadingId === application._id ? "Loading Feedback..." : "View AI Feedback"}
                          </button>

                          {candidateFeedback[application._id] && (
                            <div
                              style={{
                                marginTop: "14px",
                                padding: "18px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                borderRadius: "12px",
                                display: "grid",
                                gap: "16px"
                              }}
                            >
                              <div>
                                <strong style={{ fontSize: "16px", color: "#0f172a" }}>
                                  Candidate-safe AI Feedback
                                </strong>
                                <p style={{ margin: "8px 0 0", color: "#475569", fontSize: "14px" }}>
                                  Final match score: {candidateFeedback[application._id]?.match?.finalScore ?? "Not available"}
                                </p>
                              </div>

                              <div>
                                <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                                  Feedback Summary
                                </strong>
                                <p style={{ margin: "6px 0 0", color: "#475569", lineHeight: 1.7, fontSize: "13px" }}>
                                  {candidateFeedback[application._id]?.feedback?.summary ||
                                    "A detailed feedback summary is not available for this evaluation."}
                                </p>
                              </div>

                              <div>
                                <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                                  Matched Skills
                                </strong>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginTop: "8px" }}>
                                  {(candidateFeedback[application._id]?.feedback?.matchedSkills || []).length > 0 ? (
                                    candidateFeedback[application._id].feedback.matchedSkills.map((skill, index) => (
                                      <span
                                        key={`${skill}-${index}`}
                                        style={{
                                          padding: "6px 10px",
                                          borderRadius: "20px",
                                          background: "#dcfce7",
                                          color: "#166534",
                                          fontSize: "12px"
                                        }}
                                      >
                                        {skill}
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ color: "#64748b", fontSize: "13px" }}>
                                      No matched skills recorded.
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div>
                                <strong style={{ fontSize: "13px", color: "#0f172a" }}>
                                  Skills to Improve
                                </strong>
                                <div style={{ display: "grid", gap: "10px", marginTop: "8px" }}>
                                  {(candidateFeedback[application._id]?.feedback?.skillsToImprove || []).length > 0 ? (
                                    candidateFeedback[application._id].feedback.skillsToImprove.map((item, index) => (
                                      <div
                                        key={`${item.skill || "skill"}-${index}`}
                                        style={{
                                          padding: "12px",
                                          borderRadius: "10px",
                                          background: "#fff7ed",
                                          border: "1px solid #fed7aa"
                                        }}
                                      >
                                        <strong style={{ fontSize: "13px", color: "#9a3412" }}>
                                          {typeof item === "string" ? item : item.skill || "Skill development"}
                                        </strong>
                                        {typeof item === "object" && item?.recommendation && (
                                          <p style={{ margin: "5px 0 0", color: "#475569", fontSize: "13px", lineHeight: 1.6 }}>
                                            {item.recommendation}
                                          </p>
                                        )}
                                      </div>
                                    ))
                                  ) : (candidateFeedback[application._id]?.feedback?.missingSkills || []).length > 0 ? (
                                    candidateFeedback[application._id].feedback.missingSkills.map((skill, index) => (
                                      <div
                                        key={`${skill}-${index}`}
                                        style={{
                                          padding: "10px 12px",
                                          borderRadius: "10px",
                                          background: "#fff7ed",
                                          color: "#9a3412",
                                          fontSize: "13px"
                                        }}
                                      >
                                        <strong>{skill}</strong>
                                        <p style={{ margin: "5px 0 0", color: "#475569" }}>
                                          Focus on developing practical experience with this skill.
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p style={{ margin: 0, color: "#475569", fontSize: "13px", lineHeight: 1.6 }}>
                                      No missing required skills were recorded for this evaluation. Continue strengthening your practical experience.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            </section>
          ) : activeSection === "Resume" ? (
            <section>
              <div style={{ marginBottom: "20px" }}>
                <h2 style={{ margin: 0 }}>Resume Intelligence</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  Upload, process and review your latest resume.
                </p>
              </div>

              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "22px" }}>
                <input
                  id="resume-upload-input"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelected}
                  style={{ display: "none" }}
                />
                <button type="button" className="primary-button" onClick={handleUploadResume} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Resume"}
                </button>
                {selectedFile && <p style={{ color: "#64748b" }}>Selected: {selectedFile.name}</p>}
                <p style={{ margin: "10px 0 0", color: "#64748b", fontSize: "13px" }}>
                  Resume intelligence runs automatically after upload.
                </p>
              </div>

              {candidateResumesLoading && (
                <p style={{ color: "#64748b" }}>Loading resume...</p>
              )}

              {candidateResumesError && (
                <div style={{ marginTop: "14px", color: "#b91c1c" }}>
                  ⚠ {candidateResumesError}
                </div>
              )}

              {showLatestProcessedResume && resume && (
                <article
                  style={{
                    marginTop: "18px",
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "20px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap"
                    }}
                  >
                    <h3 style={{ margin: 0 }}>Latest Processed Resume</h3>
                    <span style={{ fontWeight: "800" }}>
                      {resume.status || "processed"}
                    </span>
                  </div>

                  <p>
                    <strong>Experience:</strong> {resume.experience ?? 0} years
                  </p>

                  <p>
                    <strong>Education:</strong> {resume.education || "Not available"}
                  </p>

                  <div style={{ marginTop: "16px" }}>
                    <strong>Skills</strong>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "8px"
                      }}
                    >
                      {(Array.isArray(resume.skills) ? resume.skills : []).map(
                        (skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            style={{
                              padding: "5px 9px",
                              borderRadius: "14px",
                              background: "#f3f4f6",
                              fontSize: "12px"
                            }}
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                    {(!Array.isArray(resume.skills) || resume.skills.length === 0) && (
                      <p style={{ color: "#64748b" }}>No skills detected.</p>
                    )}
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <strong>Projects</strong>
                    {Array.isArray(resume.projects) && resume.projects.length > 0 ? (
                      <ul
                        style={{
                          margin: "8px 0 0",
                          paddingLeft: "20px",
                          color: "#475569",
                          lineHeight: 1.7
                        }}
                      >
                        {resume.projects.map((project, index) => (
                          <li key={`${project}-${index}`} style={{ marginBottom: "6px" }}>
                            {typeof project === "string"
                              ? project
                              : project?.title || project?.name || JSON.stringify(project)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: "8px 0 0", color: "#64748b" }}>
                        No projects detected.
                      </p>
                    )}
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <strong>Certifications</strong>
                    {Array.isArray(resume.certifications) && resume.certifications.length > 0 ? (
                      <ul
                        style={{
                          margin: "8px 0 0",
                          paddingLeft: "20px",
                          color: "#475569",
                          lineHeight: 1.7
                        }}
                      >
                        {resume.certifications.map((certification, index) => (
                          <li
                            key={`${certification}-${index}`}
                            style={{ marginBottom: "6px" }}
                          >
                            {typeof certification === "string"
                              ? certification
                              : certification?.name || certification?.title || JSON.stringify(certification)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: "8px 0 0", color: "#64748b" }}>
                        No certifications detected.
                      </p>
                    )}
                  </div>
                </article>
              )}
            </section>
          ) : activeSection === "Dashboard" ? (
            <section style={{ display: "grid", gap: "20px" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "26px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ margin: "0 0 8px", color: "#2563eb", fontSize: "12px", fontWeight: "800", letterSpacing: "0.08em" }}>YOUR OVERVIEW</p>
                    <h2 style={{ margin: "0 0 8px", fontSize: "24px" }}>Your career journey starts here</h2>
                    <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>Keep your profile current, upload your resume, and explore opportunities that fit your skills.</p>
                  </div>
                  <button type="button" onClick={() => handleNavigation("Find Jobs")} style={{ border: 0, borderRadius: "10px", background: "#2563eb", color: "#fff", padding: "11px 16px", fontWeight: "700", cursor: "pointer" }}>Explore jobs →</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px" }}>
                {[
                  { label: "Profile skills", value: Array.isArray(candidateProfile.skills) ? candidateProfile.skills.length : 0, note: "Skills added to your profile", action: "Profile", cta: "Update profile" },
                  { label: "Applications", value: applicationsLoading ? "…" : candidateApplications.length, note: "Applications you have submitted", action: "My Applications", cta: "View applications" },
                  { label: "Available jobs", value: jobsLoading ? "…" : candidateJobs.length, note: "Jobs open for applying", action: "Find Jobs", cta: "Browse jobs" }
                ].map((item) => (
                  <article key={item.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "20px" }}>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "13px", fontWeight: "600" }}>{item.label}</p>
                    <p style={{ margin: "10px 0 6px", fontSize: "30px", fontWeight: "800", color: "#111827" }}>{item.value}</p>
                    <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "12px" }}>{item.note}</p>
                    <button type="button" onClick={() => handleNavigation(item.action)} style={{ border: 0, background: "transparent", padding: 0, color: "#2563eb", fontWeight: "700", cursor: "pointer" }}>{item.cta} →</button>
                  </article>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
                <article style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "22px" }}>
                  <h3 style={{ margin: "0 0 8px" }}>Complete your profile</h3>
                  <p style={{ color: "#64748b", lineHeight: 1.6, margin: "0 0 16px" }}>Add your skills, education, experience, and links so your candidate profile is ready for review.</p>
                  <button type="button" onClick={() => handleNavigation("Profile")} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: "9px", padding: "9px 12px", fontWeight: "700", cursor: "pointer" }}>Edit profile</button>
                </article>
                <article style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "16px", padding: "22px" }}>
                  <h3 style={{ margin: "0 0 8px" }}>Track your progress</h3>
                  <p style={{ color: "#64748b", lineHeight: 1.6, margin: "0 0 16px" }}>Check application statuses and review updates from employers in one place.</p>
                  <button type="button" onClick={() => handleNavigation("My Applications")} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: "9px", padding: "9px 12px", fontWeight: "700", cursor: "pointer" }}>View applications</button>
                </article>
              </div>
            </section>
          ) : activeSection === "Settings" ? (
            <section style={{ display: "grid", gap: "18px" }}>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "26px" }}>
                <h2 style={{ margin: "0 0 8px" }}>Account settings</h2>
                <p style={{ color: "#64748b", lineHeight: 1.6, margin: "0 0 22px" }}>Review your signed-in account and manage your candidate profile.</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                  <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                    <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: "12px", fontWeight: "700" }}>FULL NAME</p>
                    <p style={{ margin: 0, fontWeight: "700" }}>{user?.name || "Candidate"}</p>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                    <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: "12px", fontWeight: "700" }}>EMAIL ADDRESS</p>
                    <p style={{ margin: 0, fontWeight: "700", overflowWrap: "anywhere" }}>{user?.email || "Email not available"}</p>
                  </div>
                  <div style={{ padding: "16px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                    <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: "12px", fontWeight: "700" }}>ACCOUNT TYPE</p>
                    <p style={{ margin: 0, fontWeight: "700" }}>Candidate</p>
                  </div>
                </div>
              </div>
              <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "26px" }}>
                <h3 style={{ margin: "0 0 8px" }}>Profile and privacy</h3>
                <p style={{ color: "#64748b", lineHeight: 1.6, margin: "0 0 16px" }}>Update the profile information shared with TalentLens. Your password and Google account security are managed by your sign-in provider.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button type="button" onClick={() => handleNavigation("Profile")} style={{ border: 0, borderRadius: "9px", background: "#2563eb", color: "#fff", padding: "10px 14px", fontWeight: "700", cursor: "pointer" }}>Edit candidate profile</button>
                  <button type="button" onClick={handleLogout} style={{ border: "1px solid #fecaca", borderRadius: "9px", background: "#fff7f7", color: "#b91c1c", padding: "10px 14px", fontWeight: "700", cursor: "pointer" }}>Sign out</button>
                </div>
              </div>
            </section>
          ) : (
            <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "18px", padding: "28px" }}>
              <h2 style={{ marginTop: 0 }}>{activeSection}</h2>
              <p style={{ color: "#64748b", lineHeight: 1.6 }}>Choose a section from the navigation above to manage your candidate workspace.</p>
            </section>
          )}
        </main>

        {applicationNotice && (
          <div
            style={{
              position: "fixed",
              top: "24px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10001,
              width: "min(92vw, 520px)",
              background: applicationNotice.type === "success" ? "#ecfdf5" : "#eff6ff",
              border: `1px solid ${applicationNotice.type === "success" ? "#86efac" : "#93c5fd"}`,
              color: applicationNotice.type === "success" ? "#166534" : "#1d4ed8",
              borderRadius: "12px",
              padding: "14px 18px",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.18)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              fontWeight: "700"
            }}
          >
            <span>{applicationNotice.message}</span>
            <button
              type="button"
              onClick={() => setApplicationNotice(null)}
              aria-label="Close notification"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                fontSize: "20px",
                lineHeight: 1,
                cursor: "pointer",
                padding: "2px 6px"
              }}
            >
              ×
            </button>
          </div>
        )}

        {applicationConfirmJob && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              zIndex: 9999
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "440px",
                background: "#fff",
                borderRadius: "16px",
                padding: "26px",
                boxShadow: "0 20px 50px rgba(15, 23, 42, 0.2)"
              }}
            >
              <h3 style={{ margin: "0 0 10px", color: "#111827" }}>
                Confirm Application
              </h3>

              <p style={{ margin: "0 0 8px", color: "#475569", lineHeight: 1.6 }}>
                Are you sure you want to apply for this job?
              </p>

              <p style={{ margin: "0 0 22px", fontWeight: "700", color: "#111827" }}>
                {applicationConfirmJob.title}
              </p>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setApplicationConfirmJob(null)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "9px",
                    border: "1px solid #cbd5e1",
                    background: "#fff",
                    color: "#334155",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const jobId = applicationConfirmJob._id;
                    setApplicationConfirmJob(null);
                    await handleApplyForJob(jobId);
                  }}
                  style={{
                    padding: "10px 18px",
                    borderRadius: "9px",
                    border: "none",
                    background: "#111827",
                    color: "#fff",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Confirm Application
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------
  // HR WORKFLOW PAGES
  // ---------------------------------------------

  const hrShell = (title, subtitle, content) => (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">T</div>
          <div><h2>TalentLens</h2><span>AI Recruitment</span></div>
        </div>
        <nav className="navigation">
          <p className="nav-title">MAIN MENU</p>
          {["Dashboard", "Jobs", "AI Matching", "Rankings"].map((section) => (
            <button key={section} className={`nav-item ${activeSection === section ? "active" : ""}`} onClick={() => handleNavigation(section)}>
              <span>{section === "Dashboard" ? "⌂" : section === "Jobs" ? "▣" : section === "AI Matching" ? "✦" : "↗"}</span>{section}
            </button>
          ))}
          <p className="nav-title">MANAGEMENT</p>
          <button className={`nav-item ${activeSection === "Candidates" ? "active" : ""}`} onClick={() => handleNavigation("Candidates")}><span>♙</span>Candidates</button>
          <button className={`nav-item ${activeSection === "Settings" ? "active" : ""}`} onClick={() => handleNavigation("Settings")}><span>⚙</span>Settings</button>
        </nav>
        <div className="ai-status"><div className="status-dot"></div><div><strong>AI Service Online</strong><span>All systems operational</span></div></div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div><p className="breadcrumb">Workspace / {title}</p><h1>{title}</h1></div>
          <div className="top-actions"><div className="profile"><div className="profile-avatar">HR</div><div><strong>{user?.name || "HR"}</strong><span>{user?.company || "Talent Acquisition"}</span></div></div><button className="secondary-button" onClick={handleLogout} style={{ marginLeft: "10px" }}>Logout</button></div>
        </header>
        {message && <div style={{ margin: "0 0 18px", padding: "13px 18px", borderRadius: "10px", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", fontWeight: "600" }}>✓ {message}</div>}
        {error && <div style={{ margin: "0 0 18px", padding: "13px 18px", borderRadius: "10px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", fontWeight: "600" }}>⚠ {error}</div>}
        <section className="section">
          <div className="section-heading"><div><span>HR WORKSPACE</span><h2>{title}</h2><p>{subtitle}</p></div></div>
          {content}
        </section>
      </main>
    </div>
  );

  if (isLoggedIn && user?.role === "hr" && activeSection === "AI Matching") {
    const availableApplications = hrApplications.filter((application) => {
      if (!matchingJobId) return true;
      return String(application?.job?._id || application?.job) === String(matchingJobId);
    });
    return hrShell("AI Matching", "Run hybrid traditional + AI + RAG matching for an applicant.", (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: "14px" }}>
          <label style={{ display: "grid", gap: "7px" }}><strong>Job</strong><select value={matchingJobId} onChange={(e) => { setMatchingJobId(e.target.value); setMatchingApplicationId(""); setMatchResult(null); }} style={jobInputStyle}><option value="">Select a job</option>{hrJobs.map((job) => <option key={job._id} value={job._id}>{job.title} — {job.jobStatus}</option>)}</select></label>
          <label style={{ display: "grid", gap: "7px" }}><strong>Applicant</strong><select value={matchingApplicationId} onChange={(e) => setMatchingApplicationId(e.target.value)} style={jobInputStyle}><option value="">Select applicant</option>{availableApplications.map((application) => <option key={application._id} value={application._id}>{application.candidateName || application.candidate?.name || application.resume?.candidateName || "Candidate"} — {application.job?.title || "Job"}</option>)}</select></label>
        </div>
        <button type="button" className="primary-button" onClick={handleRunMatching} disabled={matchingLoading} style={{ marginTop: "16px" }}>{matchingLoading ? "Running AI Matching..." : "Run AI Matching"}</button>

        {matchResult && <div style={{ marginTop: "22px", display: "grid", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "12px" }}>
            {[['Final Score', matchResult.matchScore], ['Traditional', matchResult.traditionalMatch?.overallScore], ['AI Score', matchResult.aiMatch?.finalScore ?? matchResult.aiMatch?.final_score ?? matchResult.aiMatch?.score ?? matchResult.aiMatch?.ai_score ?? matchResult.aiScore], ['Keyword', matchResult.aiMatch?.keyword_score], ['Semantic', matchResult.aiMatch?.semantic_score]].map(([label,value]) => <div key={label} style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "16px" }}><small>{label}</small><h3 style={{ margin: "6px 0 0" }}>{value ?? "—"}</h3></div>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "14px" }}>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px" }}><strong>Matched Required Skills</strong><p>{(matchResult.traditionalMatch?.requiredSkills?.matched || []).join(", ") || "None"}</p></div>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px" }}><strong>Missing Required Skills</strong><p>{(matchResult.traditionalMatch?.requiredSkills?.missing || []).join(", ") || "None"}</p></div>
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px" }}><strong>AI Matched Words</strong><p>{(matchResult.aiMatch?.matched_words || []).join(", ") || "None"}</p></div>
          </div>
          {matchResult.analysis && <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px" }}><strong>AI Analysis</strong><div style={{ marginTop: "14px" }}>{renderAiAnalysis(matchResult.analysis)}</div></div>}
          <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "16px" }}><strong>RAG Evidence</strong>{Array.isArray(matchResult.ragEvidence) && matchResult.ragEvidence.length ? matchResult.ragEvidence.map((item,index) => <div key={index} style={{ marginTop: "10px", padding: "10px", background: "#fff", borderRadius: "8px" }}>{typeof item === "string" ? item : item?.text || JSON.stringify(item)}</div>) : <p>No RAG evidence returned.</p>}</div>
        </div>}
      </div>
    ));
  }

  if (isLoggedIn && user?.role === "hr" && activeSection === "Rankings") {
    return hrShell("Candidate Rankings", "Rank applicants by the persisted hybrid match score.", (
      <div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}><select value={rankingJobId} onChange={(e) => setRankingJobId(e.target.value)} style={{ ...jobInputStyle, maxWidth: "360px" }}><option value="">Select a job</option>{hrJobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}</select><button className="primary-button" onClick={() => loadRanking()} disabled={rankingLoading}>{rankingLoading ? "Loading..." : "Load Ranking"}</button></div>
        {rankingError && <p style={{ color: "#b91c1c" }}>⚠ {rankingError}</p>}
        {rankingData && <div style={{ marginTop: "20px", overflowX: "auto" }}><p><strong>{rankingData.job?.title}</strong> · {rankingData.totalApplicants} applicants</p><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}><thead><tr>{["Rank","Candidate","Status","Final","Traditional","AI","Required","Preferred","Experience","Education","Match Status","Actions"].map((h)=><th key={h} style={{ textAlign:"left", padding:"10px", borderBottom:"1px solid #e5e7eb" }}>{h}</th>)}</tr></thead><tbody>{(rankingData.rankedCandidates || []).map((row)=>{
          const rowApplicationId = row.application?.id;
          const isAnalysisOpen = analysisApplicationId === rowApplicationId;
          const rowAnalysis = isAnalysisOpen ? analysisData : null;

          return <Fragment key={rowApplicationId}>
            <tr>
              <td style={{padding:"10px"}}>#{row.rank}</td>
              <td style={{padding:"10px"}}>{row.candidate?.name}<br/><small>{row.candidate?.email}</small></td>
              <td style={{padding:"10px"}}>{row.application?.status}</td>
              <td style={{padding:"10px",fontWeight:800}}>{row.match?.finalScore ?? 0}</td>
              <td style={{padding:"10px"}}>{row.match?.traditionalScore ?? 0}</td>
              <td style={{padding:"10px"}}>{row.match?.aiScore ?? 0}</td>
              <td style={{padding:"10px"}}>{row.match?.requiredSkillsScore ?? 0}</td>
              <td style={{padding:"10px"}}>{row.match?.preferredSkillsScore ?? 0}</td>
              <td style={{padding:"10px"}}>{row.match?.experienceScore ?? 0}</td>
              <td style={{padding:"10px"}}>{row.match?.educationScore ?? 0}</td>
              <td style={{padding:"10px"}}>{row.match?.matchStatus || "not evaluated"}</td>
              <td style={{padding:"10px"}}>
                <button
                  className="secondary-button"
                  style={{ color: "#ffffff", background: "#4f46e5", borderColor: "#4f46e5", fontWeight: "600" }}
                  onClick={() => {
                    if (isAnalysisOpen) {
                      setAnalysisApplicationId("");
                      setAnalysisData(null);
                      setAnalysisError("");
                      return;
                    }
                    setAnalysisApplicationId(rowApplicationId);
                    setAnalysisData(null);
                    loadCandidateAnalysis(rowApplicationId);
                  }}
                >
                  {isAnalysisOpen ? "Hide Analysis" : "Analysis"}
                </button>
              </td>
            </tr>
            {isAnalysisOpen && (
              <tr>
                <td colSpan={12} style={{ padding: "0 10px 16px" }}>
                  <div style={{ marginTop: "8px", padding: "18px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "12px" }}>
                    {analysisLoading && <p style={{ color: "#64748b", margin: 0 }}>Loading analysis...</p>}
                    {analysisError && <p style={{ color: "#b91c1c", margin: 0 }}>⚠ {analysisError}</p>}
                    {rowAnalysis && (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                          <div>
                            <strong style={{ fontSize: "16px" }}>Candidate Analysis</strong>
                            <p style={{ margin: "5px 0 0", color: "#64748b" }}>
                              {rowAnalysis.candidate?.name || row.candidate?.name || "Candidate"} · {rowAnalysis.job?.title || rankingData.job?.title || "Job"}
                            </p>
                          </div>
                          <div style={{ fontWeight: 800, fontSize: "18px" }}>
                            Final Score: {rowAnalysis.match?.finalScore ?? "—"}
                          </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "10px" }}>
                          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px" }}><strong>Traditional</strong><p style={{ margin: "6px 0 0" }}>{rowAnalysis.match?.traditionalScore ?? "—"}</p></div>
                          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px" }}><strong>AI</strong><p style={{ margin: "6px 0 0" }}>{rowAnalysis.match?.aiScore ?? "—"}</p></div>
                          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px" }}><strong>Semantic</strong><p style={{ margin: "6px 0 0" }}>{rowAnalysis.match?.semanticScore ?? "—"}</p></div>
                          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "12px" }}><strong>Keyword</strong><p style={{ margin: "6px 0 0" }}>{rowAnalysis.match?.keywordScore ?? "—"}</p></div>
                        </div>

                        <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "12px" }}>
                          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "14px" }}>
                            <strong>Matched Skills</strong>
                            <p style={{ margin: "8px 0 0", color: "#475569" }}>{(rowAnalysis.match?.matchedRequiredSkills || []).join(", ") || "None"}</p>
                          </div>
                          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "14px" }}>
                            <strong>Missing Skills</strong>
                            <p style={{ margin: "8px 0 0", color: "#475569" }}>{(rowAnalysis.match?.missingRequiredSkills || []).join(", ") || "None"}</p>
                          </div>
                          <div style={{ background: "#ffffff", borderRadius: "10px", padding: "14px" }}>
                            <strong>AI Matched Words</strong>
                            <p style={{ margin: "8px 0 0", color: "#475569" }}>{(rowAnalysis.match?.aiMatchedWords || []).join(", ") || "None"}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </Fragment>;
        })}</tbody></table></div>}
      </div>
    ));
  }

  if (isLoggedIn && user?.role === "hr" && activeSection === "Candidates") {
    const candidatesForCurrentView = candidateJobFilterId
      ? hrApplications.filter((application) =>
          String(application.job?._id || application.job) === String(candidateJobFilterId)
        )
      : hrApplications;

    const filteredJobTitle = candidatesForCurrentView.find(
      (application) =>
        String(application.job?._id || application.job) === String(candidateJobFilterId)
    )?.job?.title;

    return hrShell(
      filteredJobTitle
        ? `Candidate Analysis · ${filteredJobTitle}`
        : "Candidates & Applications",
      filteredJobTitle
        ? `Reviewing the applicant and analysis for ${filteredJobTitle}.`
        : "Review applicants, run analysis and update recruitment status.",
      (
      <div>
        {hrApplicationsLoading && <p>Loading applications...</p>}
        {hrApplicationsError && <p style={{ color: "#b91c1c" }}>⚠ {hrApplicationsError}</p>}
        {!hrApplicationsLoading && candidatesForCurrentView.length === 0 && <div style={{ padding: "24px", background: "#f8fafc", borderRadius: "12px" }}>No applications found{filteredJobTitle ? ` for ${filteredJobTitle}.` : " for your company."}</div>}
        <div style={{ display: "grid", gap: "14px" }}>{candidatesForCurrentView.map((application) => {
          const candidateName = application.candidateName || application.candidate?.name || application.resume?.candidateName || "Candidate";
          const applicationId = application._id;
          return <article key={applicationId} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "14px", padding: "18px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:"14px", flexWrap:"wrap" }}><div><h3 style={{margin:0}}>{candidateName}</h3><p style={{margin:"5px 0",color:"#64748b"}}>{application.candidate?.email || application.email || ""} · {application.job?.title || "Job"}</p></div><select value={application.status || "Applied"} disabled={statusUpdatingId===applicationId} onChange={(e)=>handleApplicationStatusChange(applicationId,e.target.value)} style={{...jobInputStyle,width:"160px"}}><option>Applied</option><option>Shortlisted</option><option>Rejected</option><option>Selected</option></select></div>
            <div style={{ marginTop:"12px", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:"10px", fontSize:"13px", color:"#475569" }}><div><strong>Resume:</strong> {application.resume?.status || "Not processed"}</div><div><strong>Experience:</strong> {application.resume?.experience ?? 0} years</div><div><strong>Skills:</strong> {(application.resume?.skills || []).slice(0,5).join(", ") || "—"}</div></div>
            <div style={{ marginTop:"14px", display:"flex", gap:"8px", flexWrap:"wrap" }}><button className="secondary-button" style={{ color: "#344054", background: "#ffffff", borderColor: "#d0d5dd", fontWeight: "600" }} onClick={()=>{setAnalysisApplicationId(applicationId);loadCandidateAnalysis(applicationId);}}>View Analysis</button><button className="secondary-button" style={{ color: "#ffffff", background: "#4f46e5", borderColor: "#4f46e5", fontWeight: "600" }} onClick={()=>{setMatchingJobId(application.job?._id || application.job);setMatchingApplicationId(applicationId);setActiveSection("AI Matching");}}>Match with AI</button></div>
            {analysisApplicationId===applicationId && analysisData && <div style={{ marginTop:"14px", padding:"16px", background:"#f8fafc", borderRadius:"12px" }}><strong>Candidate Analysis</strong><p>Final Score: <b>{analysisData.match?.finalScore ?? "—"}</b></p><p>Traditional: {analysisData.match?.traditionalScore ?? "—"} · AI: {analysisData.match?.aiScore ?? "—"} · Semantic: {analysisData.match?.semanticScore ?? "—"} · Keyword: {analysisData.match?.keywordScore ?? "—"}</p><p><strong>Matched:</strong> {(analysisData.match?.matchedRequiredSkills || []).join(", ") || "None"}</p><p><strong>Missing:</strong> {(analysisData.match?.missingRequiredSkills || []).join(", ") || "None"}</p><p><strong>AI words:</strong> {(analysisData.match?.aiMatchedWords || []).join(", ") || "None"}</p></div>}
            {analysisApplicationId===applicationId && analysisLoading && <p style={{color:"#64748b"}}>Loading analysis...</p>}
          </article>;
        })}</div>
      </div>
    ));
  }

  if (isLoggedIn && user?.role === "hr" && activeSection === "Settings") {
    return hrShell("Settings", "Review the authenticated HR account used by this workspace.", (
      <div style={{ background: "#f8fafc", borderRadius: "14px", padding: "20px" }}>
        <p><strong>Name:</strong> {user?.name || "—"}</p>
        <p><strong>Email:</strong> {user?.email || "—"}</p>
        <p><strong>Role:</strong> {user?.role || "—"}</p>
        <p><strong>Company:</strong> {user?.company || "—"}</p>
        <p style={{ color: "#64748b" }}>Authentication and company ownership are controlled by the backend JWT; this page does not allow changing protected identity fields.</p>
      </div>
    ));
  }

  // ---------------------------------------------
  // HR JOBS PAGE
  // ---------------------------------------------
  // Render a separate Jobs workspace when HR selects Jobs.

  if (
    isLoggedIn &&
    user?.role === "hr" &&
    activeSection === "Jobs"
  ) {
    return (
      <div className="app">

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
              className="nav-item"
              onClick={() =>
                handleNavigation("Dashboard")
              }
            >
              <span>⌂</span>
              Dashboard
            </button>

            <button
              className="nav-item active"
              onClick={() =>
                handleNavigation("Jobs")
              }
            >
              <span>▣</span>
              Jobs
            </button>

            <button
              className="nav-item"
              onClick={() =>
                handleNavigation("AI Matching")
              }
            >
              <span>✦</span>
              AI Matching
            </button>

            <button
              className="nav-item"
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

        <main className="main-content">

          <header className="topbar">

            <div>

              <p className="breadcrumb">
                Workspace / Jobs
              </p>

              <h1>
                Job Management
              </h1>

            </div>

            <div className="top-actions">

              <div className="profile">

                <div className="profile-avatar">
                  HR
                </div>

                <div>

                  <strong>
                    {user?.name || "HR"}
                  </strong>

                  <span>
                    {user?.company ||
                      "Talent Acquisition"}
                  </span>

                </div>

              </div>

              <button
                className="secondary-button"
                onClick={handleLogout}
                style={{ marginLeft: "10px" }}
              >
                Logout
              </button>

            </div>

          </header>

          <section className="section">

            <div className="section-heading">

              <div>

                <span>
                  HR WORKSPACE
                </span>

                <h2>
                  Manage Jobs
                </h2>

                <p>
                  Create, manage and monitor job openings for your company.
                </p>

              </div>

              <button
                className="primary-button"
                onClick={handleCreateJob}
              >
                + Create Job
              </button>

            </div>

            {showJobForm && (
              <form
                onSubmit={
                  editingJobId
                    ? handleUpdateJobSubmit
                    : handleCreateJobSubmit
                }
                style={{
                  marginTop: "20px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 5px 16px rgba(15, 23, 42, 0.05)"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "16px",
                    marginBottom: "20px"
                  }}
                >
                  <div>
                    <span
                      style={{
                        color: "#6941c6",
                        fontSize: "10px",
                        fontWeight: "800",
                        letterSpacing: "1px"
                      }}
                    >
                      NEW JOB
                    </span>
                    <h3
                      style={{
                        margin: "6px 0 0",
                        color: "#101828"
                      }}
                    >
                      {editingJobId
                        ? "Edit Job Opening"
                        : "Create Job Opening"}
                    </h3>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: "#667085",
                        fontSize: "12px"
                      }}
                    >
                      Enter the public job information and the private HR/AI
                      evaluation criteria.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetJobForm}
                    style={{
                      border: "1px solid #e4e7ec",
                      background: "#ffffff",
                      color: "#475467",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                </div>

                {createJobError && (
                  <div
                    style={{
                      marginBottom: "18px",
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#b91c1c",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "13px",
                      fontWeight: "600"
                    }}
                  >
                    ⚠ {createJobError}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(230px, 1fr))",
                    gap: "16px"
                  }}
                >
                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Job Title *
                    </span>
                    <input
                      name="title"
                      value={jobForm.title}
                      onChange={handleJobFormChange}
                      placeholder="e.g. Full Stack Developer"
                      required
                      style={jobInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Location
                    </span>
                    <input
                      name="location"
                      value={jobForm.location}
                      onChange={handleJobFormChange}
                      placeholder="e.g. Bengaluru"
                      style={jobInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Work Mode
                    </span>
                    <select
                      name="workMode"
                      value={jobForm.workMode}
                      onChange={handleJobFormChange}
                      style={jobInputStyle}
                    >
                      <option value="On-site">On-site</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Employment Type
                    </span>
                    <select
                      name="employmentType"
                      value={jobForm.employmentType}
                      onChange={handleJobFormChange}
                      style={jobInputStyle}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Internship">Internship</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Salary
                    </span>
                    <input
                      name="salary"
                      value={jobForm.salary}
                      onChange={handleJobFormChange}
                      placeholder="e.g. ₹6–10 LPA"
                      style={jobInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Contract Period
                    </span>
                    <input
                      name="contractPeriod"
                      value={jobForm.contractPeriod}
                      onChange={handleJobFormChange}
                      placeholder="e.g. 12 months"
                      style={jobInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Minimum Experience (years) *
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      name="minimumExperience"
                      value={jobForm.minimumExperience}
                      onChange={handleJobFormChange}
                      placeholder="e.g. 2"
                      required
                      style={jobInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Education
                    </span>
                    <input
                      name="education"
                      value={jobForm.education}
                      onChange={handleJobFormChange}
                      placeholder="e.g. B.E. / B.Tech in CSE"
                      style={jobInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Application Deadline *
                    </span>
                    <input
                      type="date"
                      name="applicationDeadline"
                      value={jobForm.applicationDeadline}
                      onChange={handleJobFormChange}
                      required
                      style={jobInputStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Job Status *
                    </span>
                    <select
                      name="jobStatus"
                      value={jobForm.jobStatus}
                      onChange={handleJobFormChange}
                      required
                      style={jobInputStyle}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Open">Open</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </label>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "16px",
                    marginTop: "16px"
                  }}
                >
                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Description *
                    </span>
                    <textarea
                      name="description"
                      value={jobForm.description}
                      onChange={handleJobFormChange}
                      placeholder="Describe the role, required work and expected outcomes."
                      required
                      rows="5"
                      style={jobTextareaStyle}
                    />
                  </label>

                  <label style={{ display: "grid", gap: "7px" }}>
                    <span style={{ fontWeight: "700", fontSize: "12px" }}>
                      Responsibilities
                    </span>
                    <textarea
                      name="responsibilities"
                      value={jobForm.responsibilities}
                      onChange={handleJobFormChange}
                      placeholder="One responsibility per line or separate with commas."
                      rows="5"
                      style={jobTextareaStyle}
                    />
                  </label>
                </div>

                <div
                  style={{
                    marginTop: "22px",
                    paddingTop: "18px",
                    borderTop: "1px solid #eaecf0"
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 5px",
                      color: "#344054",
                      fontSize: "14px"
                    }}
                  >
                    Private HR / AI Evaluation
                  </h4>
                  <p
                    style={{
                      margin: "0 0 15px",
                      color: "#667085",
                      fontSize: "11px"
                    }}
                  >
                    These fields are sent only to the HR job API and must not
                    be exposed by candidate-facing job responses.
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(280px, 1fr))",
                      gap: "16px"
                    }}
                  >
                    <label style={{ display: "grid", gap: "7px" }}>
                      <span style={{ fontWeight: "700", fontSize: "12px" }}>
                        Required Skills
                      </span>
                      <textarea
                        name="requiredSkills"
                        value={jobForm.requiredSkills}
                        onChange={handleJobFormChange}
                        placeholder="Node.js, React, MongoDB"
                        rows="3"
                        style={jobTextareaStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "7px" }}>
                      <span style={{ fontWeight: "700", fontSize: "12px" }}>
                        Preferred Skills
                      </span>
                      <textarea
                        name="preferredSkills"
                        value={jobForm.preferredSkills}
                        onChange={handleJobFormChange}
                        placeholder="Docker, Redis, AWS"
                        rows="3"
                        style={jobTextareaStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "7px" }}>
                      <span style={{ fontWeight: "700", fontSize: "12px" }}>
                        Evaluation Criteria
                      </span>
                      <textarea
                        name="evaluationCriteria"
                        value={jobForm.evaluationCriteria}
                        onChange={handleJobFormChange}
                        placeholder="Strong backend fundamentals, API design..."
                        rows="3"
                        style={jobTextareaStyle}
                      />
                    </label>

                    <label style={{ display: "grid", gap: "7px" }}>
                      <span style={{ fontWeight: "700", fontSize: "12px" }}>
                        Internal Notes
                      </span>
                      <textarea
                        name="internalNotes"
                        value={jobForm.internalNotes}
                        onChange={handleJobFormChange}
                        placeholder="Internal hiring notes..."
                        rows="3"
                        style={jobTextareaStyle}
                      />
                    </label>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    marginTop: "22px"
                  }}
                >
                  <button
                    type="button"
                    onClick={resetJobForm}
                    className="secondary-button"
                    style={{
                      color: "#344054",
                      background: "#ffffff",
                      borderColor: "#d0d5dd"
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={creatingJob}
                  >
                    {editingJobId
                      ? updatingJob
                        ? "Saving Changes..."
                        : "Save Changes"
                      : creatingJob
                        ? "Creating Job..."
                        : "Create Job"}
                  </button>
                </div>
              </form>
            )}

            <div style={{ marginTop: "20px" }}>

              {hrJobsLoading && (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                    padding: "28px",
                    color: "#64748b"
                  }}
                >
                  Loading jobs...
                </div>
              )}

              {hrJobsError && (
                <div
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    fontWeight: "600"
                  }}
                >
                  ⚠ {hrJobsError}
                </div>
              )}

              {!hrJobsLoading &&
                !hrJobsError &&
                hrJobs.length === 0 && (
                  <div
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "16px",
                      padding: "28px",
                      color: "#64748b"
                    }}
                  >
                    No jobs found for your company.
                  </div>
                )}

              {!hrJobsLoading &&
                !hrJobsError &&
                hrJobs.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(300px, 1fr))",
                      gap: "18px"
                    }}
                  >
                    {hrJobs.map((job) => (
                      <article
                        key={job._id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: "16px",
                          padding: "22px",
                          boxShadow:
                            "0 5px 16px rgba(15, 23, 42, 0.05)"
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            gap: "12px",
                            alignItems:
                              "flex-start"
                          }}
                        >
                          <div>

                            <h3
                              style={{
                                margin: 0
                              }}
                            >
                              {job.title ||
                                "Untitled Job"}
                            </h3>

                            <p
                              style={{
                                margin:
                                  "6px 0 0",
                                color: "#2563eb",
                                fontWeight: "700"
                              }}
                            >
                              {job.company ||
                                user?.company}
                            </p>

                          </div>

                          <span
                            style={{
                              padding:
                                "6px 10px",
                              borderRadius:
                                "16px",
                              background:
                                job.jobStatus ===
                                "Open"
                                  ? "#ecfdf5"
                                  : job.jobStatus ===
                                    "Closed"
                                    ? "#fef2f2"
                                    : "#f3f4f6",
                              color:
                                job.jobStatus ===
                                "Open"
                                  ? "#047857"
                                  : job.jobStatus ===
                                    "Closed"
                                    ? "#b91c1c"
                                    : "#475569",
                              fontSize: "12px",
                              fontWeight: "700"
                            }}
                          >
                            {job.jobStatus ||
                              "Draft"}
                          </span>

                        </div>

                        <p
                          style={{
                            margin: "16px 0",
                            color: "#475569",
                            lineHeight: 1.6
                          }}
                        >
                          {job.description ||
                            "No description provided."}
                        </p>

                        <div
                          style={{
                            display: "grid",
                            gap: "8px",
                            color: "#64748b",
                            fontSize: "13px"
                          }}
                        >

                          <div>
                            <strong>
                              Location:
                            </strong>{" "}
                            {job.location ||
                              "Not specified"}
                          </div>

                          <div>
                            <strong>
                              Experience:
                            </strong>{" "}
                            {job.minimumExperience ??
                              0}{" "}
                            years
                          </div>

                          <div>
                            <strong>
                              Education:
                            </strong>{" "}
                            {job.education ||
                              "Not specified"}
                          </div>

                          <div>
                            <strong>
                              Employment:
                            </strong>{" "}
                            {job.employmentType ||
                              "Not specified"}
                          </div>

                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginTop: "18px"
                          }}
                        >
                          <select
                            value={job.jobStatus || "Draft"}
                            disabled={statusUpdatingId === job._id}
                            onChange={(event) =>
                              handleJobStatusChange(job._id, event.target.value)
                            }
                            style={{ ...jobInputStyle, width: "150px", padding: "9px 10px" }}
                          >
                            <option value="Draft">Draft</option>
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                          </select>

                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => handleEditJob(job)}
                              style={{
                                padding: "9px 14px",
                                color: "#344054",
                                background: "#ffffff",
                                borderColor: "#d0d5dd"
                              }}
                            >
                              Edit Job
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteJob(job)}
                              disabled={deletingJobId === job._id}
                              style={{
                                padding: "9px 14px",
                                border: "1px solid #fecaca",
                                borderRadius: "8px",
                                background: "#fff7f7",
                                color: "#b91c1c",
                                cursor: "pointer",
                                fontWeight: "700"
                              }}
                            >
                              {deletingJobId === job._id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>

                      </article>
                    ))}
                  </div>
                )}

            </div>

          </section>

        </main>

      </div>
    );
  }

  // ---------------------------------------------
  // HR DASHBOARD
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
              Good morning, {user?.name || "HR"} 👋
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
                  {user?.name || "HR"}
                </strong>

                <span>
                  {user?.company ||
                    "Talent Acquisition"}
                </span>

              </div>

            </div>

            <button
              className="secondary-button"
              onClick={handleLogout}
              style={{ marginLeft: "10px" }}
            >
              Logout
            </button>

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

        <section className="hero-section" style={{ gridTemplateColumns: "minmax(0, 1fr)" }}>

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
                {resume.status ||
                  "processed"}
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
                              background:
                                "rgba(124,58,237,0.1)",
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

                    <div
                      style={{
                        marginTop: "8px"
                      }}
                    >

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
        {/* Counts below are calculated from the authenticated HR account's API data. */}

        {(() => {
          const getJobStatus = (job) =>
            String(job?.jobStatus || job?.status || "Draft").toLowerCase();
          const activeJobCount = hrJobs.filter((job) =>
            ["active", "open", "published", "live"].includes(getJobStatus(job))
          ).length;
          const resumeIds = new Set(
            hrApplications
              .map((application) => {
                const resumeValue = application?.resume;
                return typeof resumeValue === "object"
                  ? resumeValue?._id
                  : resumeValue;
              })
              .filter(Boolean)
              .map(String)
          );
          const matchedCount = hrApplications.filter((application) =>
            application?.matchScore != null ||
            application?.match?.score != null ||
            application?.aiMatchScore != null ||
            application?.analysis?.matchScore != null
          ).length;
          const shortlistedCount = hrApplications.filter((application) =>
            ["shortlisted", "interview", "interview scheduled", "selected", "hired"].includes(
              String(application?.status || "").toLowerCase()
            )
          ).length;

          return (
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">◉</div>
                <div>
                  <span>Applicants with Resumes</span>
                  <strong>{resumeIds.size.toLocaleString()}</strong>
                  <small>Based on loaded applications</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">▣</div>
                <div>
                  <span>Active Jobs</span>
                  <strong>{activeJobCount.toLocaleString()}</strong>
                  <small>From your job postings</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">✦</div>
                <div>
                  <span>Applications</span>
                  <strong>{hrApplications.length.toLocaleString()}</strong>
                  <small>Total applications loaded</small>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange">↗</div>
                <div>
                  <span>Shortlisted</span>
                  <strong>{shortlistedCount.toLocaleString()}</strong>
                  <small>Shortlisted or further-stage candidates</small>
                </div>
              </div>
            </section>
          );
        })()}

        {/* LIVE RECRUITMENT DATA */}
        <section className="section" style={{ marginTop: "26px" }}>
          <div className="section-heading">
            <div>
              <span>LIVE DATA</span>
              <h2>Recruitment Overview</h2>
            </div>
            <button
              className="view-button"
              onClick={() => {
                loadHRJobs();
                loadHRApplications();
              }}
              disabled={hrJobsLoading || hrApplicationsLoading}
            >
              {hrJobsLoading || hrApplicationsLoading ? "Refreshing..." : "Refresh data ↻"}
            </button>
          </div>

          {(hrJobsError || hrApplicationsError) && (
            <p style={{ color: "#b91c1c", margin: "0 0 14px" }}>
              {hrJobsError || hrApplicationsError}
            </p>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px"
          }}>
            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "20px",
              minWidth: 0
            }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "17px" }}>Recent Job Postings</h3>
              {hrJobsLoading ? (
                <p style={{ color: "#64748b" }}>Loading jobs from your account…</p>
              ) : hrJobs.length === 0 ? (
                <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                  No job postings found yet. Use Create Job to publish your first role.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {[...hrJobs]
                    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
                    .slice(0, 5)
                    .map((job) => (
                      <div key={job?._id || job?.id || job?.title} style={{
                        paddingBottom: "11px",
                        borderBottom: "1px solid #eef2f7"
                      }}>
                        <strong style={{ display: "block", color: "#111827" }}>
                          {job?.title || "Untitled position"}
                        </strong>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>
                          {job?.location || "Location not specified"} · {job?.jobStatus || job?.status || "Draft"}
                        </span>
                      </div>
                    ))}
                </div>
              )}
              <button className="view-button" style={{ marginTop: "12px" }} onClick={() => handleNavigation("Jobs")}>
                Manage jobs →
              </button>
            </div>

            <div style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "20px",
              minWidth: 0
            }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "17px" }}>Recent Applications</h3>
              {hrApplicationsLoading ? (
                <p style={{ color: "#64748b" }}>Loading applications from your account…</p>
              ) : hrApplications.length === 0 ? (
                <p style={{ color: "#64748b", lineHeight: 1.6 }}>
                  No applications found yet. Applications will appear here when candidates apply to your jobs.
                </p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {[...hrApplications]
                    .sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))
                    .slice(0, 5)
                    .map((application) => {
                      const candidateName =
                        application?.candidate?.name ||
                        application?.user?.name ||
                        application?.resume?.candidateName ||
                        application?.resume?.name ||
                        "Candidate";
                      const jobTitle =
                        application?.job?.title ||
                        application?.jobTitle ||
                        "Job posting";
                      return (
                        <div key={application?._id || application?.id} style={{
                          paddingBottom: "11px",
                          borderBottom: "1px solid #eef2f7"
                        }}>
                          <strong style={{ display: "block", color: "#111827" }}>{candidateName}</strong>
                          <span style={{ color: "#64748b", fontSize: "13px" }}>
                            {jobTitle} · {application?.status || "Applied"}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
              <button className="view-button" style={{ marginTop: "12px" }} onClick={() => handleNavigation("Candidates")}>
                View candidates →
              </button>
            </div>
          </div>
        </section>

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


          </div>

          <div className="feature-grid">

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
                    .map(
                      word => word[0]
                    )
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
                      width:
                        resume.skills?.length
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
                        resume.status ===
                        "processed"
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

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
    console.error("VITE_GOOGLE_CLIENT_ID is not configured in frontend/.env.");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || "missing-google-client-id"}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}

export default App;
