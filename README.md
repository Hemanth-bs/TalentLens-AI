# TalentLens AI — AI-Powered Resume Matching & Recruitment

TalentLens AI is an intelligent recruitment and resume analysis platform designed to help recruiters evaluate candidates more efficiently. It combines traditional backend technologies, machine learning, Generative AI, and Retrieval-Augmented Generation (RAG) to analyze resumes against job requirements and deliver relevant, explainable matching insights.

The platform provides separate experiences for recruiters and candidates, connecting resume processing, job management, candidate matching, and AI-powered feedback in one application.

## 🎯 Project Objective

The goal of TalentLens AI is to make resume screening more intelligent, relevant, and explainable by combining structured candidate information with AI-powered analysis.

The system aims to:

- Analyze and process candidate resumes.
- Extract relevant candidate information.
- Compare resumes against job descriptions.
- Generate candidate-job matching scores.
- Use RAG to support context-aware analysis.
- Provide explainable matching insights and recommendations.
- Help recruiters review candidates through an interactive interface.
- Give candidates access to relevant application and matching feedback.

## ✨ Key Features

### Resume Intelligence
- Resume upload and text extraction.
- Candidate information and skill identification.
- Resume processing and structured data storage.

### Job Management and Matching
- Job description management.
- Resume-to-job comparison.
- Skill-based and AI-assisted matching.
- Candidate matching scores and ranking support.

### AI-Powered Analysis
- Retrieval-Augmented Generation (RAG) integration.
- Context-aware resume and job analysis.
- AI-generated matching insights and recommendations.
- Identification of relevant and missing skills.

### Recruiter and Candidate Experiences
- Separate recruiter and candidate workflows.
- Candidate application management.
- Candidate analysis and matching feedback.
- Interactive web interface for recruitment activities.

## 🧠 AI Approach

TalentLens AI combines resume processing, skill matching, and AI-assisted analysis to evaluate how closely a candidate's profile aligns with a job description.

### RAG Workflow

```text
Candidate Resume
       |
       v
Resume Processing
       |
       v
Information and Skill Extraction
       |
       v
Relevant Context Retrieval
       |
       v
RAG Context Construction
       |
       v
LLM-Assisted Analysis
       |
       v
Candidate-Job Evaluation
       |
       v
Matching Insights and Feedback
```

RAG helps provide relevant context to AI analysis by retrieving information related to the resume and job requirements. Matching results are intended to support recruiter decisions rather than replace human judgment.

## 🏗️ System Architecture

The application is organized into three primary components.

```text
+-----------------------------+
|       React Frontend        |
| Recruiter and Candidate UI  |
+--------------+--------------+
               |
               v
+-----------------------------+
|     Node.js / Express       |
| APIs, Authentication,       |
| Jobs, Applications, Resumes |
+--------------+--------------+
               |
       +-------+-------+
       |               |
       v               v
+---------------+ +----------------+
|   MongoDB     | | FastAPI AI      |
| Application   | | Service         |
| Data          | | Matching / RAG  |
+---------------+ +----------------+
```

**Component responsibilities**

- **Frontend:** User interface and recruiter/candidate workflows.
- **Backend:** API endpoints, authentication, job and application management, and resume processing.
- **Database:** Persistent storage for application data using MongoDB.
- **AI service:** AI-related analysis and matching functionality exposed through FastAPI.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, JavaScript, CSS |
| Backend | Node.js, Express.js |
| AI service | Python, FastAPI |
| Database | MongoDB |
| AI techniques | Generative AI, RAG, resume and skill matching |
| Development tools | Git, GitHub, npm, Python virtual environments |

*The stack above reflects the project's main components. Specific model providers, libraries, and deployment services may vary with the current implementation.*

## 📁 Project Structure

```text
TalentLens-AI/
├── ai-service/
│   ├── services/
│   └── main.py
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── server.js
├── frontend/
│   └── src/
├── models/
├── .gitignore
└── README.md
```

The directory listing is representative; individual files may differ as the project evolves.

## ⚙️ Local Setup

### Prerequisites

Install the following before running the application:

- Node.js and npm
- Python
- MongoDB Atlas or another configured MongoDB deployment
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Hemanth-bs/TalentLens-AI.git
cd TalentLens-AI
```

### 2. Configure the Backend

```bash
cd backend
npm install
```

Create a `backend/.env` file and configure the environment variables required by the backend.

Example variable names:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Use the actual variable names required by your implementation. Configure any additional authentication or AI-related settings needed by the application.

### 3. Configure the AI Service

Open a separate terminal:

```bash
cd ai-service
python -m venv .venv
```

Activate the environment on Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the dependencies listed in the AI service's dependency file, such as `requirements.txt`, if provided.

Configure the AI service's required environment variables and model-provider credentials without committing secrets.

Start the service using the entry point and command configured in the project. For example, if `main.py` exposes an ASGI application named `app`:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Start the Backend

From the `backend` directory:

```bash
npm run dev
```

If your package scripts do not define `dev`, use the configured start script:

```bash
npm start
```

### 5. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by the frontend development server.

**Note:** Exact startup commands, required environment variables, and dependency files depend on the current project configuration. Verify them against the corresponding package scripts and service configuration.

## 🔐 Security

- Keep `.env` files and API credentials out of version control.
- Never expose MongoDB connection strings, JWT secrets, or model-provider API keys.
- Use appropriate authentication and authorization for protected endpoints.
- Restrict database network access to trusted sources.
- Do not commit real candidate resumes or other personal information.

## 🚀 Future Enhancements

Potential improvements include:

- More detailed recruitment analytics and visualizations.
- Improved matching evaluation and explainability.
- Expanded candidate feedback and skill-gap analysis.
- Automated testing and API documentation.
- Deployment with appropriate monitoring and security controls.

## 👨‍💻 Project Status

TalentLens AI is an evolving full-stack project focused on AI-assisted recruitment, resume intelligence, and candidate-job matching. Features and implementation details may change as development continues.

## 📄 License

Add a license if you intend to publish the project for reuse. Until a license is selected, all rights remain with the copyright holder.

---

**TalentLens AI — Making resume matching more intelligent, relevant, and explainable.**