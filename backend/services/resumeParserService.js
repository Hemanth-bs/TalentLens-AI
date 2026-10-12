// ---------------------------------------------
// IMPORT PDF PARSER
// ---------------------------------------------
// pdf-parse v2 is used for extracting text
// from PDF resume files.

const {
    PDFParse
} = require("pdf-parse");


// ---------------------------------------------
// IMPORT DOCX PARSER
// ---------------------------------------------
// Mammoth extracts raw text from DOCX files.

const mammoth =
    require("mammoth");


// ---------------------------------------------
// PARSE PDF
// ---------------------------------------------
// Receives the uploaded PDF as a Buffer
// and returns the extracted text.

const parsePDF = async (buffer) => {

    const parser =
        new PDFParse({
            data: buffer
        });

    try {

        const result =
            await parser.getText();

        return result.text;

    } finally {

        await parser.destroy();

    }
};


// ---------------------------------------------
// PARSE DOCX
// ---------------------------------------------
// Receives the uploaded DOCX as a Buffer
// and extracts its raw text using Mammoth.

const parseDOCX = async (buffer) => {

    const result =
        await mammoth.extractRawText({
            buffer: buffer
        });

    return result.value;

};


// ---------------------------------------------
// MAIN RESUME PARSER
// ---------------------------------------------
// Determines whether the uploaded file is
// PDF or DOCX and sends it to the correct
// parser.
//
// We check both MIME type and extension.
// This is important because different clients
// can send different MIME types for DOCX files.

const extractResumeText = async (file) => {

    // -----------------------------------------
    // 1. CHECK FILE
    // -----------------------------------------

    if (!file) {

        throw new Error(
            "No resume file was uploaded"
        );

    }


    // -----------------------------------------
    // 2. NORMALIZE FILE INFORMATION
    // -----------------------------------------

    const fileName =
        file.originalname
            ? file.originalname.toLowerCase()
            : "";


    const mimeType =
        file.mimetype
            ? file.mimetype.toLowerCase()
            : "";


    // -----------------------------------------
    // 3. DETECT PDF
    // -----------------------------------------

    const isPDF =
        mimeType === "application/pdf" &&
        fileName.endsWith(".pdf");


    // -----------------------------------------
    // 4. DETECT DOCX
    // -----------------------------------------
    // Some upload clients send DOCX as:
    //
    // application/vnd.openxmlformats-officedocument
    // .wordprocessingml.document
    //
    // Others may send:
    //
    // application/octet-stream
    // application/zip
    //
    // We therefore validate the extension as
    // well as the known MIME types.

    const isDOCX =
        (
            mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ||
            mimeType ===
            "application/octet-stream"
            ||
            mimeType ===
            "application/zip"
        ) &&
        fileName.endsWith(".docx");


    // -----------------------------------------
    // 5. PARSE PDF
    // -----------------------------------------

    if (isPDF) {

        return await parsePDF(
            file.buffer
        );

    }


    // -----------------------------------------
    // 6. PARSE DOCX
    // -----------------------------------------

    if (isDOCX) {

        return await parseDOCX(
            file.buffer
        );

    }


    // -----------------------------------------
    // 7. UNSUPPORTED FILE
    // -----------------------------------------

    throw new Error(
        "Unsupported resume file type"
    );

};


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = {
    extractResumeText
};