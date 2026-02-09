const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema(
    {
        branchName: {
            type: String,
            required: true,
            trim: true
        },
        mobile: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        address: {
            type: String
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {timestamps: true}
);

module.exports = mongoose.model("branch", branchSchema);
