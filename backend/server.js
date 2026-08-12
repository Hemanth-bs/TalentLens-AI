// Import the Express framework
// Express helps us create our backend server and REST APIs
const express = require("express");

// Import dotenv
// dotenv loads variables from the .env file into process.env
require("dotenv").config();

// Import our MongoDB connection function
const connectDB = require("./config/db");

// Import Resume routes
// These routes handle Resume-related API requests
const resumeRoutes = require("./routes/resumeRoutes");

// Create an Express application
const app = express();

// Get the port from the .env file
// If PORT is not available, use 5000 as a fallback
const PORT = process.env.PORT || 5000;


// ---------------------------------------------
// MIDDLEWARE
// ---------------------------------------------

// Allows Express to understand JSON data
// sent by the frontend in API requests
app.use(express.json());


// ---------------------------------------------
// API ROUTES
// ---------------------------------------------

// Resume API routes
// Example:
// POST http://localhost:5000/api/resumes
app.use("/api/resumes", resumeRoutes);


// ---------------------------------------------
// TEST ROUTE
// ---------------------------------------------

// Visiting http://localhost:5000/
// will execute this function
app.get("/", (req, res) => {

    // Send a JSON response to the client
    res.json({
        message: "TalentLens AI Backend is running!"
    });
});


// ---------------------------------------------
// DATABASE + SERVER START
// ---------------------------------------------

// First connect to MongoDB.
// Only after a successful connection do we start
// the Express server.
const startServer = async () => {

    // Connect to MongoDB Atlas
    await connectDB();

    // Start the Express server
    app.listen(PORT, () => {

        // Display the server URL in the terminal
        console.log(
            `TalentLens AI Backend running on http://localhost:${PORT}`
        );
    });
};


// ---------------------------------------------
// START APPLICATION
// ---------------------------------------------

startServer();