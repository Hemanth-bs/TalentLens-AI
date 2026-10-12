// Import Multer
// Multer handles file uploads sent through HTTP requests
const multer = require("multer");

// Store uploaded files temporarily in memory
// The file is processed immediately and the extracted
// text is stored in MongoDB.
const storage = multer.memoryStorage();


// ---------------------------------------------
// FILE FILTER
// ---------------------------------------------
// Allows only PDF and DOCX resume files.
//
// We check both:
// 1. MIME type
// 2. File extension
//
// This makes the upload compatible with clients
// that send DOCX files with different MIME types.
const fileFilter = (req, file, cb) => {

    const fileName =
        file.originalname.toLowerCase();

    const isPDF =
        file.mimetype === "application/pdf" &&
        fileName.endsWith(".pdf");

    const isDOCX =
        (
            file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            ||
            file.mimetype === "application/octet-stream"
            ||
            file.mimetype === "application/zip"
        ) &&
        fileName.endsWith(".docx");


    // -----------------------------------------
    // ALLOW PDF
    // -----------------------------------------

    if (isPDF) {
        return cb(null, true);
    }


    // -----------------------------------------
    // ALLOW DOCX
    // -----------------------------------------

    if (isDOCX) {
        return cb(null, true);
    }


    // -----------------------------------------
    // REJECT EVERYTHING ELSE
    // -----------------------------------------

    cb(
        new Error(
            "Only PDF and DOCX resume files are allowed"
        )
    );
};


// ---------------------------------------------
// MULTER CONFIGURATION
// ---------------------------------------------

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    // Maximum file size: 5 MB
    limits: {
        fileSize: 5 * 1024 * 1024
    }

});


// ---------------------------------------------
// EXPORT
// ---------------------------------------------

module.exports = upload;