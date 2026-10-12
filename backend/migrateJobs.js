const dns = require("dns");


// =====================================================
// MONGODB SRV DNS CONFIGURATION
// =====================================================

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);


// =====================================================
// IMPORTS
// =====================================================

const mongoose =
    require("mongoose");

require("dotenv").config();


// =====================================================
// MIGRATE EXISTING JOBS
// =====================================================

const migrateJobs = async () => {

    try {

        // ---------------------------------------------
        // CHECK MONGODB URI
        // ---------------------------------------------

        if (
            !process.env.MONGODB_URI
        ) {

            throw new Error(
                "MONGODB_URI is not defined."
            );
        }


        // ---------------------------------------------
        // CONNECT TO MONGODB
        // ---------------------------------------------

        console.log(
            "Connecting to MongoDB..."
        );


        await mongoose.connect(
            process.env.MONGODB_URI
        );


        console.log(
            "MongoDB connected successfully!"
        );


        // ---------------------------------------------
        // GET RAW DATABASE COLLECTION
        // ---------------------------------------------
        // We intentionally bypass the Mongoose model.
        //
        // This allows us to inspect/update the actual
        // MongoDB documents without schema defaults
        // masking the old data.
        // ---------------------------------------------

        const db =
            mongoose.connection.db;


        const collection =
            db.collection(
                "jobdescriptions"
            );


        // ---------------------------------------------
        // COUNT EXISTING JOBS
        // ---------------------------------------------

        const totalJobs =
            await collection.countDocuments();


        console.log(
            `Found ${totalJobs} jobs.`
        );


        // ---------------------------------------------
        // UPDATE EXISTING JOBS
        // ---------------------------------------------
        // Existing jobs were already active in the
        // previous TalentLens system.
        //
        // Therefore:
        //
        // jobStatus:
        //     Open
        //
        // processingStatus:
        //     processed
        // ---------------------------------------------

        const result =
            await collection.updateMany(

                {
                    $or: [
                        {
                            jobStatus: {
                                $exists: false
                            }
                        },
                        {
                            processingStatus: {
                                $exists: false
                            }
                        }
                    ]
                },

                {
                    $set: {
                        jobStatus:
                            "Open",

                        processingStatus:
                            "processed"
                    }
                }
            );


        // ---------------------------------------------
        // MIGRATION RESULT
        // ---------------------------------------------

        console.log(
            `Matched ${result.matchedCount} jobs.`
        );


        console.log(
            `Modified ${result.modifiedCount} jobs.`
        );


        console.log(
            "Job migration completed successfully."
        );

    } catch (error) {

        console.error(
            "Job migration failed:",
            error.message
        );

        process.exitCode =
            1;

    } finally {

        // ---------------------------------------------
        // CLOSE DATABASE CONNECTION
        // ---------------------------------------------

        await mongoose.disconnect();

        console.log(
            "MongoDB connection closed."
        );
    }
};


// =====================================================
// RUN MIGRATION
// =====================================================

migrateJobs();