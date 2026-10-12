// Use reliable public DNS servers for MongoDB SRV lookups
const dns = require("dns");

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);

// Import Mongoose
// Mongoose helps our Node.js application communicate with MongoDB
const mongoose = require("mongoose");

// Function to connect TalentLens to MongoDB Atlas
const connectDB = async () => {
    try {
        // Connect to MongoDB using the URI stored in .env
        await mongoose.connect(process.env.MONGODB_URI);

        // Display a success message when the connection is established
        console.log("MongoDB connected successfully!");
    } catch (error) {

        // Display the error if MongoDB connection fails
        console.error("MongoDB connection failed:", error.message);

        // Stop the application if the database connection fails
        process.exit(1);
    }
};

// Export the function so server.js can use it
module.exports = connectDB;