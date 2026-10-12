// ---------------------------------------------
// JOB DESCRIPTION INTELLIGENCE SERVICE
// ---------------------------------------------

// Common skills that can be detected in a job description
const knownSkills = [
    "JavaScript",
    "TypeScript",
    "Python",
    "Java",
    "C++",
    "C#",
    "React",
    "Angular",
    "Vue",
    "Node.js",
    "Express.js",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "SQL",
    "REST APIs",
    "Git",
    "GitHub",
    "Docker",
    "AWS",
    "Azure",
    "HTML5",
    "CSS3",
    "Vite",
    "Mongoose"
];


// ---------------------------------------------
// EXTRACT SKILLS FROM JOB DESCRIPTION
// ---------------------------------------------

const extractSkills = (text) => {

    if (!text) {
        return [];
    }

    const lowerText = text.toLowerCase();

    return knownSkills.filter((skill) =>
        lowerText.includes(skill.toLowerCase())
    );
};


// ---------------------------------------------
// EXTRACT EXPERIENCE REQUIREMENT
// ---------------------------------------------

const extractExperience = (text) => {

    if (!text) {
        return 0;
    }

    const match = text.match(
        /(\d+)\s*\+?\s*years?\s*(?:of\s*)?(?:professional\s*)?experience/i
    );

    if (match) {
        return Number(match[1]);
    }

    return 0;
};


// ---------------------------------------------
// ANALYZE JOB DESCRIPTION
// ---------------------------------------------

const analyzeJobDescription = (jobDescription) => {

    if (!jobDescription) {
        throw new Error("Job description is required");
    }

    const combinedText = [
        jobDescription.title || "",
        jobDescription.description || "",
        ...(jobDescription.requiredSkills || []),
        ...(jobDescription.preferredSkills || []),
        jobDescription.education || "",
        ...(jobDescription.responsibilities || [])
    ].join(" ");

    return {

        // Skills mentioned throughout the JD
        detectedSkills: extractSkills(combinedText),

        // Required skills explicitly provided by recruiter
        requiredSkills: jobDescription.requiredSkills || [],

        // Preferred skills explicitly provided by recruiter
        preferredSkills: jobDescription.preferredSkills || [],

        // Minimum experience
        minimumExperience:
            Number(jobDescription.minimumExperience) || 0,

        // Education requirement
        education:
            jobDescription.education || "",

        // Responsibilities
        responsibilities:
            jobDescription.responsibilities || []
    };
};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    analyzeJobDescription
};