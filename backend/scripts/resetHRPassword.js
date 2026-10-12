// ---------------------------------------------
// TALENTLENS AI - DEVELOPMENT CANDIDATE PASSWORD RESET
// ---------------------------------------------

require("dotenv").config();

const dns = require("dns");

dns.setServers([
    "1.1.1.1",
    "8.8.8.8"
]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");

const CANDIDATE_EMAIL = "candidate@test.com";
const NEW_PASSWORD = "TalentLensCandidate@123";

const resetCandidatePassword = async () => {

    try {

        console.log("Connecting to MongoDB...");

        await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log(
            "MongoDB connected successfully!"
        );

        const user =
            await User.findOne({
                email: CANDIDATE_EMAIL
            });

        if (!user) {

            console.log(
                `Candidate user not found: ${CANDIDATE_EMAIL}`
            );

            return;
        }

        const hashedPassword =
            await bcrypt.hash(
                NEW_PASSWORD,
                10
            );

        user.password =
            hashedPassword;

        await user.save();

        console.log(
            "Candidate password reset successfully!"
        );

        console.log(
            `Email: ${CANDIDATE_EMAIL}`
        );

        console.log(
            `New password: ${NEW_PASSWORD}`
        );

    } catch (error) {

        console.error(
            "Password reset failed:",
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

resetCandidatePassword();