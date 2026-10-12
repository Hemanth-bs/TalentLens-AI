// Import PDFParse from pdf-parse v2
const { PDFParse } = require("pdf-parse");

// Import Mammoth for DOCX files
const mammoth = require("mammoth");


// ---------------------------------------------
// PARSE PDF
// ---------------------------------------------

const parsePDF = async (buffer) => {
    // Create a PDF parser using the uploaded file buffer
    const parser = new PDFParse({
        data: buffer
    });

    try {
        // Extract text from the PDF
        const result = await parser.getText();

        // Return extracted text
        return result.text;

    } finally {
        // Release parser resources
        await parser.destroy();
    }
};


// ---------------------------------------------
// PARSE DOCX
// ---------------------------------------------

const parseDOCX = async (buffer) => {
    // Extract raw text from the DOCX buffer
    const result = await mammoth.extractRawText({
        buffer: buffer
    });

    // Return extracted text
    return result.value;
};


// ---------------------------------------------
// MAIN RESUME PARSER
// ---------------------------------------------

const extractResumeText = async (file) => {

    // Make sure a file was uploaded
    if (!file) {
        throw new Error("No resume file was uploaded");
    }

    // PDF
    if (file.mimetype === "application/pdf") {
        return await parsePDF(file.buffer);
    }

    // DOCX
    if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        return await parseDOCX(file.buffer);
    }

    // Unsupported file type
    throw new Error("Unsupported resume file type");
};


// Export parser
module.exports = {
    extractResumeText
};