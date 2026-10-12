const mongoose = require("mongoose");
const Application = require("./models/Application");

const MONGO_URI = process.env.MONGO_URI;

const APPLICATION_ID = "6a99549f6177d19c4a55a119";

const deleteTestApplication = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error(
                "MONGO_URI is not defined in the environment."
            );
        }

        await mongoose.connect(MONGO_URI);

        console.log("Connected to MongoDB.");

        const application =
            await Application.findById(
                APPLICATION_ID
            );

        if (!application) {
            console.log(
                "Application not found."
            );

            return;
        }

        await Application.findByIdAndDelete(
            APPLICATION_ID
        );

        console.log(
            "Test application deleted successfully."
        );

    } catch (error) {
        console.error(
            "Delete application error:",
            error.message
        );
    } finally {
        await mongoose.connection.close();

        console.log(
            "MongoDB connection closed."
        );
    }
};

deleteTestApplication();