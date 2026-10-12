// ---------------------------------------------
// CANDIDATE RANKING SERVICE
// ---------------------------------------------

// Import matching service
const {
    matchCandidateToJob
} = require("./matchingService");


// ---------------------------------------------
// RANK CANDIDATES FOR A JOB
// ---------------------------------------------

const rankCandidates = (candidates, job) => {

    if (!job) {
        throw new Error("Job description is required");
    }

    if (!Array.isArray(candidates)) {
        throw new Error("Candidates must be an array");
    }


    // Calculate match score for every candidate
    const rankedCandidates = candidates.map(candidate => {

        const matchResult =
            matchCandidateToJob(candidate, job);

        return {

            candidateId:
                candidate._id,

            candidateName:
                candidate.candidateName,

            email:
                candidate.email,

            matchScore:
                matchResult.overallScore,

            requiredSkillsScore:
                matchResult.requiredSkills.score,

            preferredSkillsScore:
                matchResult.preferredSkills.score,

            experienceScore:
                matchResult.experience.score,

            educationScore:
                matchResult.education.score,

            matchedRequiredSkills:
                matchResult.requiredSkills.matched,

            missingRequiredSkills:
                matchResult.requiredSkills.missing

        };

    });


    // Sort highest match score first
    rankedCandidates.sort(
        (a, b) => b.matchScore - a.matchScore
    );


    // Add ranking position
    return rankedCandidates.map(
        (candidate, index) => ({

            rank: index + 1,

            ...candidate

        })
    );
};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    rankCandidates
};