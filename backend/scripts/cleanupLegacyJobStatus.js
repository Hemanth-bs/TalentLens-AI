// ---------------------------------------------
// TALENTLENS AI - LEGACY JOB STATUS CLEANUP
// ---------------------------------------------
// Removes the old "status" field from job documents.
// The new system uses "processingStatus" instead.
// ---------------------------------------------

require("dotenv").config();

const dns = require("dns");

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);

const mongoose = require("mongoose");

const cleanupLegacyJobStatus = async () => {

    try {

        console.log("Connecting to MongoDB...");

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "MongoDB connected successfully!"
        );

        const db =
            mongoose.connection.db;

        const result =
            await db
                .collection("jobdescriptions")
                .updateMany(
                    {
                        status: {
                            $exists: true
                        }
                    },
                    {
                        $unset: {
                            status: ""
                        }
                    }
                );

        console.log(
            "Matched:",
            result.matchedCount
        );

        console.log(
            "Modified:",
            result.modifiedCount
        );

        console.log(
            "Legacy status cleanup completed."
        );

    } catch (error) {

        console.error(
            "Cleanup failed:",
            error.message
        );

        process.exitCode = 1;

    } finally {

        await mongoose.disconnect();

        console.log(
            "MongoDB connection closed."
        );

    }
};

cleanupLegacyJobStatus();