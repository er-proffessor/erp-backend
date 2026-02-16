const mongoose = require("mongoose");

const counterStockSchema = new mongoose.Schema(
    {
        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            required: true
        },
        
        counterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Counter",
            required: true
        },

        bookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true
        },

        quantity: {
            type: Number,
            default: 0,
            min: 0,
            required: true
        },

        status: {
            type: Boolean,
            default: true
        },
},

{timestamps: true}

);

// Prevent a bookId to be add by multiple counters {One Counter + One Book = one document}

counterStockSchema.index(
    {branchId: 1, counterId: 1, bookId: 1 },
    {unique: true}
)

module.exports = mongoose.model("CounterStock", counterStockSchema);
