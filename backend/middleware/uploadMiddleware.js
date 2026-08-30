// Import Multer
// Multer handles file uploads sent through HTTP requests
const multer = require("multer");

// Store uploaded files temporarily in memory
// We will process the file immediately and then save
// the extracted text to MongoDB.
const storage = multer.memoryStorage();

// Allow only PDF and DOCX resume files
const fileFilter = (req, file, cb) => {

    // PDF MIME type
    if (file.mimetype === "application/pdf") {
        return cb(null, true);
    }

    // DOCX MIME type
    if (
        file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        return cb(null, true);
    }

    // Reject unsupported file types
    cb(new Error("Only PDF and DOCX resume files are allowed"));
};

// Create the upload middleware
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,

    // Maximum file size: 5 MB
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

// Export the upload middleware
module.exports = upload;