
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: false,
            default: undefined
        },

        googleId: {
            type: String,
            default: null,
            sparse: true
        },

        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local"
        },

        role: {
            type: String,
            enum: ["hr", "candidate"],
            required: true
        },

        company: {
            type: String,
            default: "",
            trim: true
        }
    },
    {
        timestamps: true
    }
);

userSchema.index(
    { googleId: 1 },
    {
        unique: true,
        sparse: true
    }
);

module.exports = mongoose.model("User", userSchema);
