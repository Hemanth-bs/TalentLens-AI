const dns = require("dns");

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);

const mongoose = require("mongoose");

const sleep = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async () => {
    const maxRetries = 5;
    const retryDelay = 5000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000
            });

            console.log("MongoDB connected successfully!");
            return;
        } catch (error) {
            console.error(
                `MongoDB connection attempt ${attempt}/${maxRetries} failed:`,
                error.message
            );

            if (attempt < maxRetries) {
                console.log("Retrying MongoDB connection in 5 seconds...");
                await sleep(retryDelay);
            } else {
                throw new Error(
                    "MongoDB connection failed after 5 attempts."
                );
            }
        }
    }
};

module.exports = connectDB;
