const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
    {
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true
        },

        bookName: {
            type: String,
            required: true
        },

        publisherName : {
            type: String,
            required: true
        },

        className: {
            type: String,
            required: true
        },
        
        subject: {
            type: String,
            required: true
        },

        mrp: {
            type: Number,
            required: true,
        },

        purchasePrice: {
            type: Number,
            required: true
        },

        sellPrice: {
            type: Number,
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            default: 0
        }
},
{timestamps: true}

);

module.exports = mongoose.model("Book", bookSchema);

