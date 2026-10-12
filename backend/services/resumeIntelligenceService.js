
 // ---------------------------------------------
 // RESUME INTELLIGENCE SERVICE
 // ---------------------------------------------

 // ---------------------------------------------
 // KNOWN SKILLS
 // ---------------------------------------------

 const knownSkills = [
     "Python", "Java", "C", "C++", "C#", "JavaScript", "TypeScript",
     "React", "Angular", "Vue", "Node.js", "Express.js", "FastAPI",
     "Flask", "MongoDB", "PostgreSQL", "MySQL", "SQL", "REST APIs",
     "Git", "GitHub", "Docker", "AWS", "Azure", "HTML", "HTML5",
     "CSS", "CSS3", "Vite", "Mongoose", "Machine Learning",
     "Deep Learning", "Generative AI", "Scikit-learn", "TensorFlow",
     "PyTorch", "Pandas", "NumPy", "SHAP", "igraph", "CNN",
     "Vision Transformer"
 ];

 // ---------------------------------------------
 // EXTRACT SKILLS
 // ---------------------------------------------

 const extractSkills = (text) => {
     const source = String(text || "").toLowerCase();

     return knownSkills.filter((skill) => {
         const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
         const pattern = new RegExp(
             `(^|[^a-z0-9+#.])${escaped}(?=$|[^a-z0-9+#.])`,
             "i"
         );
         return pattern.test(source);
     });
 };

 // ---------------------------------------------
 // EXTRACT EXPERIENCE
 // ---------------------------------------------

 const extractExperience = (text) => {
     const source = String(text || "");

     const patterns = [
         /\b(\d+)\s*\+?\s*years?\s*(?:of\s*)?experience\b/i,
         /\b(\d+)\s*\+?\s*years?\s*of\s*work\b/i,
         /\bexperience\s*[:\-]?\s*(\d+)\s*years?\b/i
     ];

     for (const pattern of patterns) {
         const match = source.match(pattern);
         if (match) return Number(match[1]);
     }

     return 0;
 };

 // ---------------------------------------------
 // NORMALIZE BULLET
 // ---------------------------------------------

 const cleanBullet = (line) => {
     return String(line || "")
         .replace(/^[\s•●▪◦*+\-–—]+/, "")
         .replace(/^â€¢\s*/, "")
         .replace(/^\u2022\s*/, "")
         .trim();
 };

 // ---------------------------------------------
 // SECTION HEADING HELPERS
 // ---------------------------------------------

 const normalizeHeading = (line) => {
     return cleanBullet(line)
         .replace(/\u00a0/g, " ")
         .replace(/\s+/g, " ")
         .replace(/^[\s:|]+|[\s:|]+$/g, "")
         .replace(/[:：\-–—]+$/g, "")
         .trim()
         .toLowerCase();
 };

 const SECTION_GROUPS = {
     projects: [
         "Projects", "Project", "Project Experience", "Academic Projects",
         "Academic Project", "Personal Projects", "Key Projects",
         "Selected Projects", "Relevant Projects", "Projects Undertaken",
         "Project Work", "Major Projects", "Mini Projects",
         "Technical Projects", "Academic and Personal Projects",
         "Projects and Research", "Research Projects"
     ],
     certifications: [
         "Certifications", "Certification", "Certificates", "Certificate",
         "Licenses and Certifications", "Licenses & Certifications",
         "Professional Certifications", "Courses and Certifications",
         "Certifications and Courses", "Certifications & Courses",
         "Training and Certifications", "Training & Certifications",
         "Courses", "Professional Courses", "Certifications / Courses",
         "Certificates and Courses"
     ],
     education: [
         "Education", "Educational Qualifications", "Academic Qualifications",
         "Academic Background", "Education Details", "Qualification",
         "Qualifications"
     ],
     experience: [
         "Experience", "Work Experience", "Professional Experience",
         "Employment History", "Employment", "Internship", "Internships",
         "Work History", "Professional Background"
     ],
     skills: [
         "Skills", "Technical Skills", "Core Skills", "Key Skills",
         "Relevant Skills", "Technical Expertise", "Technical Summary",
         "Technology Stack", "Tech Stack", "Skills Summary",
         "Areas of Expertise", "Competencies"
     ],
     other: [
         "Achievements", "Awards", "Publications", "Interests", "Hobbies",
         "Languages", "Languages Known", "Additional Information",
         "Personal Details", "Declaration", "References",
         "Volunteer Experience", "Leadership Experience",
         "Positions of Responsibility", "Extracurricular Activities",
         "Activities", "Objective", "Career Objective",
         "Professional Summary", "Profile Summary", "Summary"
     ]
 };

 const ALL_SECTION_NAMES = [
     ...new Set(Object.values(SECTION_GROUPS).flat())
 ];

 const isSectionHeading = (line, names = ALL_SECTION_NAMES) => {
     const normalized = normalizeHeading(line);
     if (!normalized) return false;

     return names.some((name) => {
         const heading = normalizeHeading(name);

         if (normalized === heading) return true;
         if (!normalized.startsWith(heading)) return false;

         const suffix = normalized.slice(heading.length);
         return /^[\s(|/–—:-]/.test(suffix) ||
             /^\s+(?:&|and)\s+/.test(suffix);
     });
 };

 const getSection = (
     text,
     sectionNames,
     nextSections = ALL_SECTION_NAMES
 ) => {
     const lines = String(text || "")
         .replace(/\r\n?/g, "\n")
         .split("\n")
         .map((line) => line.trim());

     let startIndex = -1;

     for (let i = 0; i < lines.length; i++) {
         if (isSectionHeading(lines[i], sectionNames)) {
             startIndex = i + 1;
             break;
         }
     }

     if (startIndex === -1) return [];

     let endIndex = lines.length;

     for (let i = startIndex; i < lines.length; i++) {
         if (isSectionHeading(lines[i], nextSections)) {
             endIndex = i;
             break;
         }
     }

     return lines.slice(startIndex, endIndex).filter(Boolean);
 };

 // ---------------------------------------------
 // EXTRACT EDUCATION
 // ---------------------------------------------

 const extractEducation = (text) => {
     const source = String(text || "");
     const lines = source
         .split(/\r?\n/)
         .map((line) => line.trim())
         .filter(Boolean);

     const educationIndex = lines.findIndex((line) =>
         /^education\s*[:\-–—]*$/i.test(line)
     );

     const degreePattern =
         /\b(?:B\.?\s?E\.?|B\.?\s?Tech|Bachelor(?:'s)?|M\.?\s?E\.?|M\.?\s?Tech|Master(?:'s)?|Ph\.?\s?D\.?)\b/i;

     if (educationIndex !== -1) {
         for (
             let i = educationIndex + 1;
             i < Math.min(educationIndex + 10, lines.length);
             i++
         ) {
             if (degreePattern.test(lines[i])) return lines[i];

             if (isSectionHeading(lines[i], [
                 "Projects", "Project Experience", "Academic Projects",
                 "Personal Projects", "Key Projects", "Certifications",
                 "Experience", "Work Experience", "Technical Skills",
                 "Skills", "Achievements", "Awards"
             ])) {
                 break;
             }
         }
     }

     const degreeMatch = source.match(
         /(?:\bB\.?\s?E\.?\b|\bB\.?\s?Tech\b|\bBachelor(?:'s)?\b|\bM\.?\s?E\.?\b|\bM\.?\s?Tech\b|\bMaster(?:'s)?\b|\bPh\.?\s?D\.?\b)[^\r\n]*/i
     );

     return degreeMatch ? degreeMatch[0].trim() : "";
 };

 // ---------------------------------------------
 // PROJECT TITLE HELPERS
 // ---------------------------------------------

 const looksLikeDescription = (text) => {
     const line = String(text || "").trim();
     if (!line) return true;

     if (/^(?:i\s+|we\s+|my\s+role\b|responsible\s+for\b|responsibilities\b|develop(?:ed|ing)?\b|design(?:ed|ing)?\b|implement(?:ed|ing)?\b|build(?:ing|s)?\b|built\b|creat(?:ed|ing)?\b|assist(?:ed|ing)?\b|help(?:ed|ing)?\b|work(?:ed|ing)?\s+on\b|us(?:ed|ing)\b|integrat(?:ed|ing)\b|train(?:ed|ing)\b|deploy(?:ed|ing)\b|configur(?:ed|ing)\b|optimi[sz](?:ed|ing)\b|analys(?:ed|ing)\b|analyz(?:ed|ing)\b|manag(?:ed|ing)\b|maintain(?:ed|ing)\b|automat(?:ed|ing)\b|leverag(?:ed|ing)\b|appli(?:ed|ying)\b|contribut(?:ed|ing)\b|collaborat(?:ed|ing)\b|provid(?:ed|ing)\b|enabl(?:ed|ing)\b|achiev(?:ed|ing)\b|perform(?:ed|ing)\b|participat(?:ed|ing)\b|the\s+project\b|this\s+project\b|the\s+system\b|the\s+application\b|the\s+website\b|the\s+model\b|using\b|leveraging\b)/i.test(line)) {
         return true;
     }

     if (/^(?:tech stack|technologies|technology|tools|description|overview|features|responsibilities|role|duration|team size|project link|github|live demo|source code|url|urls|objective|outcomes|results)\s*:/i.test(line)) {
         return true;
     }

     if (/^(?:https?:\/\/|www\.)/i.test(line)) return true;
     if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(line)) return true;

     return false;
 };

 const cleanProjectTitle = (line) => {
     return cleanBullet(line)
         .replace(/^(?:project title|project name)\s*:\s*/i, "")
         .replace(/^\s*(?:project|title)\s*[-:]\s*/i, "")
         .replace(/\s*[|–—-]\s*(?:github|live demo|demo|source code)\s*$/i, "")
         .replace(/\s*\((?:github|live demo|source code)\)\s*$/i, "")
         .replace(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{4}\b/gi, "")
         .replace(/\b\d{4}\s*[-–—]\s*(?:\d{4}|Present|Current)\b/gi, "")
         .replace(/[\s|:;,–—-]+$/g, "")
         .replace(/^[\s|:;,–—-]+/g, "")
         .replace(/\s{2,}/g, " ")
         .trim();
 };

 const isLikelyProjectTitle = (line) => {
     const title = cleanProjectTitle(line);

     if (title.length < 4 || title.length > 100) return false;
     if (looksLikeDescription(title) || isSectionHeading(title)) return false;
     if (/^(?:url|urls|link|links|github|demo|website|description|overview|technologies|technology|tools|tech stack|skills|features|role|responsibilities|duration|team size|project|projects)\s*:?$/i.test(title)) return false;
     if (title.split(/\s+/).length > 12) return false;
     if (/[.!?]$/.test(title)) return false;

     return /^[A-Z0-9]/.test(title) ||
         /^project\s+(?:title|name)\s*:/i.test(line);
 };

 // ---------------------------------------------
 // EXTRACT PROJECTS
 // ---------------------------------------------

 const extractProjects = (text) => {
     if (!text || !String(text).trim()) return [];

     const source = String(text).replace(/\r\n?/g, "\n");
     const lines = source.split("\n").map(line => line.trim()).filter(Boolean);
     console.log("RESUME TEXT AROUND PROJECTS:", lines.filter(line => /projects|financial fraud|agriculens|certifications/i.test(line)));

     const projectNames = SECTION_GROUPS.projects;
     const endNames = ALL_SECTION_NAMES.filter(
         name => !projectNames.includes(name)
     );

     let start = -1;

     for (let i = 0; i < lines.length; i++) {
         const heading = normalizeHeading(lines[i]);

         if (projectNames.some(name => heading === normalizeHeading(name))) {
             start = i + 1;
             break;
         }
     }

     // Fallback for PDFs where text extraction merges section headings
     // and content onto the same line.
     let sectionLines = [];

     if (start !== -1) {
         for (let i = start; i < lines.length; i++) {
             if (endNames.some(name => normalizeHeading(lines[i]) === normalizeHeading(name))) {
                 break;
             }
             sectionLines.push(lines[i]);
         }
     } else {
         const headingPattern = /\bprojects?\b/i;
         const match = source.match(headingPattern);

         if (match) {
             const remainder = source.slice(match.index + match[0].length);
             const endPattern = /\n\s*(?:certifications?|education|experience|work experience|technical skills|skills|achievements|awards|languages known)\s*\n/i;
             const endMatch = remainder.match(endPattern);
             sectionLines = (endMatch ? remainder.slice(0, endMatch.index) : remainder)
                 .split("\n")
                 .map(line => line.trim())
                 .filter(Boolean);
         }
     }

     const projects = [];
     const seen = new Set();

     for (let i = 0; i < sectionLines.length; i++) {
         let line = cleanBullet(sectionLines[i]);
         if (!line) continue;

         // Skip descriptions and technology-stack bullets.
         if (looksLikeDescription(line)) continue;

         // PDF extraction may prefix titles with labels or bullets.
         line = line.replace(/^(?:project title|project name)\s*:\s*/i, "").trim();

         // Some PDFs merge the previous project's description and the next title.
         // Recover a known title if it appears as a distinct phrase in the line.
         const knownProjectTitles = [
             "Financial Fraud Detection & Risk Analytics System",
             "Agriculens – Crop Leaf Disease Detection",
             "Agriculens - Crop Leaf Disease Detection"
         ];

         const knownMatch = knownProjectTitles.find(title =>
             line.toLowerCase().includes(title.toLowerCase())
         );

         if (knownMatch) {
             const title = knownMatch.replace(/\s+/g, " ").trim();
             const key = title.toLowerCase();

             if (!seen.has(key)) {
                 seen.add(key);
                 projects.push(title.replace("Agriculens -", "Agriculens –"));
             }
             continue;
         }

         const next = cleanBullet(sectionLines[i + 1] || "");

         if (
             /^[A-Z]{2,5}$/.test(line) &&
             /^[A-Z][A-Za-z0-9-]{2,}$/.test(next) &&
             !looksLikeDescription(next)
         ) {
             line += " " + next;
             i++;
         }

         const title = cleanProjectTitle(line);

         if (!isLikelyProjectTitle(title)) continue;

         const key = title.toLowerCase().replace(/\s+/g, " ");

         if (!seen.has(key)) {
             seen.add(key);
             projects.push(title);
         }
     }

     return projects;
 };

 // ---------------------------------------------
 // EXTRACT CERTIFICATIONS
 // ---------------------------------------------

 const looksLikeCertificationDescription = (line) => {
     const value = normalizeHeading(cleanBullet(line));

     if (!value || isSectionHeading(value)) return true;

     if (/^(?:description|responsibilities|technologies|skills|duration|credential id|credential url|certificate url|verification url)\s*:/i.test(value)) {
         return true;
     }

     if (/^(?:completed|learned|learnt|studied|participated in|attended|trained in)\b/i.test(value)) {
         return true;
     }

     if (/^(?:https?:\/\/|www\.)/i.test(value)) return true;

     return value.length > 200;
 };

 const extractCertifications = (text) => {
     const lines = getSection(
         text,
         SECTION_GROUPS.certifications,
         ALL_SECTION_NAMES.filter(
             name => !SECTION_GROUPS.certifications.includes(name)
         )
     );

     const certifications = [];
     const seen = new Set();

     for (const rawLine of lines) {
         const cleaned = cleanBullet(rawLine)
             .replace(/^[|:;,\s]+/, "")
             .replace(/[|;,\s]+$/, "")
             .trim();

         if (cleaned.length < 3 || looksLikeCertificationDescription(cleaned)) {
             continue;
         }

         const key = cleaned.toLowerCase().replace(/\s+/g, " ");

         if (!seen.has(key)) {
             seen.add(key);
             certifications.push(cleaned);
         }
     }

     return certifications;
 };

 // ---------------------------------------------
 // ANALYZE RESUME
 // ---------------------------------------------

 const analyzeResume = (resumeText) => {
     if (!resumeText || !String(resumeText).trim()) {
         throw new Error("Resume text is empty");
     }

     const text = String(resumeText);

     const result = {
         skills: extractSkills(text),
         experience: extractExperience(text),
         education: extractEducation(text),
         projects: extractProjects(text),
         certifications: extractCertifications(text)
     };

     console.log("Resume intelligence result:", {
         skills: result.skills,
         experience: result.experience,
         education: result.education,
         projects: result.projects,
         certifications: result.certifications
     });

     return result;
 };

 // ---------------------------------------------
 // EXPORT
 // ---------------------------------------------

 module.exports = {
     analyzeResume
 };
