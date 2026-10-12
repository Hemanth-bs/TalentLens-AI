// ---------------------------------------------
// RESUME INTELLIGENCE SERVICE
// ---------------------------------------------

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
// EXTRACT SKILLS
// ---------------------------------------------

const extractSkills = (text) => {
    const lowerText = text.toLowerCase();

    return knownSkills.filter((skill) =>
        lowerText.includes(skill.toLowerCase())
    );
};


// ---------------------------------------------
// EXTRACT EXPERIENCE
// ---------------------------------------------

const extractExperience = (text) => {
    const match = text.match(
        /(\d+)\s*\+?\s*years?\s*(?:of\s*)?experience/i
    );

    if (match) {
        return Number(match[1]);
    }

    return 0;
};


// ---------------------------------------------
// EXTRACT EDUCATION
// ---------------------------------------------

const extractEducation = (text) => {

    // First, specifically look for an education section.
    const educationSection = text.match(
        /EDUCATION([\s\S]*?)(?:CERTIFICATIONS|ADDITIONAL INFORMATION|$)/i
    );

    if (educationSection) {

        const lines = educationSection[1]
            .split("\n")
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // Find the line containing a recognized degree
        const educationLine = lines.find(line =>
            /B\.?\s*E\.?|B\.?\s*Tech|Bachelor|M\.?\s*E\.?|M\.?\s*Tech|Master/i.test(line)
        );

        if (educationLine) {
            return educationLine;
        }
    }

    // Fallback: search the entire resume for a degree.
    const degreeMatch = text.match(
        /(?:B\.?\s*E\.?|B\.?\s*Tech|Bachelor(?:'s)?|M\.?\s*E\.?|M\.?\s*Tech|Master(?:'s)?)[^\n]*/i
    );

    if (degreeMatch) {
        return degreeMatch[0].trim();
    }

    return "";
};


// ---------------------------------------------
// EXTRACT PROJECTS
// ---------------------------------------------

const extractProjects = (text) => {

    const projects = [];

    const projectSection = text.match(
        /PROJECTS([\s\S]*?)(?:EDUCATION|CERTIFICATIONS|ADDITIONAL INFORMATION|$)/i
    );

    if (!projectSection) {
        return projects;
    }

    const lines = projectSection[1]
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

    for (const line of lines) {

        if (
            !line.startsWith("•") &&
            !line.startsWith("-") &&
            line.length < 100
        ) {
            projects.push(line);
        }
    }

    return projects;
};


// ---------------------------------------------
// EXTRACT CERTIFICATIONS
// ---------------------------------------------

const extractCertifications = (text) => {

    const certifications = [];

    const certificationSection = text.match(
        /CERTIFICATIONS([\s\S]*?)(?:ADDITIONAL INFORMATION|$)/i
    );

    if (!certificationSection) {
        return certifications;
    }

    const lines = certificationSection[1]
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

    for (const line of lines) {

        const cleaned = line
            .replace(/^[-•]\s*/, "")
            .trim();

        if (cleaned) {
            certifications.push(cleaned);
        }
    }

    return certifications;
};


// ---------------------------------------------
// ANALYZE RESUME
// ---------------------------------------------

const analyzeResume = (resumeText) => {

    if (!resumeText || !resumeText.trim()) {
        throw new Error("Resume text is empty");
    }

    return {
        skills: extractSkills(resumeText),
        experience: extractExperience(resumeText),
        education: extractEducation(resumeText),
        projects: extractProjects(resumeText),
        certifications: extractCertifications(resumeText)
    };
};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    analyzeResume
};