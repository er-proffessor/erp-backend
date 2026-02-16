const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School"
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
  buyerType: {
    type: String,
    enum: ["SCHOOL", "DIRECT"],
    default: "DIRECT"
  },
    quantity: {
    type: Number,
    required: true,
    min: 1
    },
  
     studentName: String,
  className: String,
  price: Number,
  totalAmount: Number

}, 
{ timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
