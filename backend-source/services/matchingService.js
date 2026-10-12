// ---------------------------------------------
// RESUME ↔ JOB MATCHING SERVICE
// ---------------------------------------------

// Normalize a skill for reliable comparison
const normalizeSkill = (skill) => {
    return skill
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
};


// ---------------------------------------------
// CALCULATE SKILL MATCH
// ---------------------------------------------

const calculateSkillMatch = (candidateSkills, jobSkills) => {

    if (!jobSkills || jobSkills.length === 0) {
        return {
            matched: [],
            missing: [],
            score: 100
        };
    }

    const candidateSet = new Set(
        candidateSkills.map(normalizeSkill)
    );

    const matched = [];
    const missing = [];

    jobSkills.forEach(skill => {

        if (candidateSet.has(normalizeSkill(skill))) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }

    });

    const score =
        (matched.length / jobSkills.length) * 100;

    return {
        matched,
        missing,
        score: Math.round(score)
    };
};


// ---------------------------------------------
// CALCULATE EXPERIENCE MATCH
// ---------------------------------------------

const calculateExperienceMatch = (
    candidateExperience,
    minimumExperience
) => {

    const candidateYears =
        Number(candidateExperience) || 0;

    const requiredYears =
        Number(minimumExperience) || 0;

    if (requiredYears === 0) {
        return 100;
    }

    if (candidateYears >= requiredYears) {
        return 100;
    }

    return Math.round(
        (candidateYears / requiredYears) * 100
    );
};


// ---------------------------------------------
// CALCULATE EDUCATION MATCH
// ---------------------------------------------

const calculateEducationMatch = (
    candidateEducation,
    requiredEducation
) => {

    if (!requiredEducation) {
        return 100;
    }

    if (!candidateEducation) {
        return 0;
    }

    const candidateText =
        candidateEducation.toLowerCase();

    const requiredText =
        requiredEducation.toLowerCase();

    // Basic degree-family matching
    const degreeKeywords = [
        "b.e",
        "b.tech",
        "bachelor",
        "m.e",
        "m.tech",
        "master"
    ];

    const candidateDegree =
        degreeKeywords.find(degree =>
            candidateText.includes(degree)
        );

    const requiredDegree =
        degreeKeywords.find(degree =>
            requiredText.includes(degree)
        );

    if (
        candidateDegree &&
        requiredDegree &&
        candidateDegree === requiredDegree
    ) {
        return 100;
    }

    // Related bachelor's degree fallback
    if (
        candidateText.includes("b.e") ||
        candidateText.includes("b.tech") ||
        candidateText.includes("bachelor")
    ) {

        if (
            requiredText.includes("b.e") ||
            requiredText.includes("b.tech") ||
            requiredText.includes("bachelor")
        ) {
            return 100;
        }
    }

    return 50;
};


// ---------------------------------------------
// CALCULATE OVERALL MATCH
// ---------------------------------------------

const calculateOverallMatch = ({
    requiredSkillScore,
    preferredSkillScore,
    experienceScore,
    educationScore
}) => {

    // Weight distribution
    const requiredWeight = 50;
    const preferredWeight = 15;
    const experienceWeight = 20;
    const educationWeight = 15;

    const overallScore =
        (requiredSkillScore * requiredWeight / 100) +
        (preferredSkillScore * preferredWeight / 100) +
        (experienceScore * experienceWeight / 100) +
        (educationScore * educationWeight / 100);

    return Math.round(overallScore);
};


// ---------------------------------------------
// MATCH CANDIDATE WITH JOB
// ---------------------------------------------

const matchCandidateToJob = (
    candidate,
    job
) => {

    if (!candidate) {
        throw new Error("Candidate data is required");
    }

    if (!job) {
        throw new Error("Job data is required");
    }


    // Required skills
    const requiredSkillMatch =
        calculateSkillMatch(
            candidate.skills || [],
            job.requiredSkills || []
        );


    // Preferred skills
    const preferredSkillMatch =
        calculateSkillMatch(
            candidate.skills || [],
            job.preferredSkills || []
        );


    // Experience
    const experienceScore =
        calculateExperienceMatch(
            candidate.experience,
            job.minimumExperience
        );


    // Education
    const educationScore =
        calculateEducationMatch(
            candidate.education,
            job.education
        );


    // Overall score
    const overallScore =
        calculateOverallMatch({

            requiredSkillScore:
                requiredSkillMatch.score,

            preferredSkillScore:
                preferredSkillMatch.score,

            experienceScore,

            educationScore

        });


    return {

        overallScore,

        requiredSkills: {
            matched: requiredSkillMatch.matched,
            missing: requiredSkillMatch.missing,
            score: requiredSkillMatch.score
        },

        preferredSkills: {
            matched: preferredSkillMatch.matched,
            missing: preferredSkillMatch.missing,
            score: preferredSkillMatch.score
        },

        experience: {
            candidateYears:
                Number(candidate.experience) || 0,

            requiredYears:
                Number(job.minimumExperience) || 0,

            score: experienceScore
        },

        education: {
            candidateEducation:
                candidate.education || "",

            requiredEducation:
                job.education || "",

            score: educationScore
        }

    };
};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    matchCandidateToJob
};