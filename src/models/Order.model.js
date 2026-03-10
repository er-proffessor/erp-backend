const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
{
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

  buyerType: {
    type: String,
    enum: ["SCHOOL", "DIRECT"],
    default: "DIRECT"
  },

  studentName: {
    type: String
  },

  fatherName: {
    type: String
  },

  mobileNo: {
    type: String
  },

  className: {
    type: String
  },

  books: [
    {
      bookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true
      },
      total: {
        type: Number,
        required: true
      }
    }
  ],

  totalAmount: {
    type: Number,
    required: true
  },

  billingStatus: {
    type: String,
    enum: ["PAID", "DUE"],
    default: "PAID"
  },

  paymentType: {
    type: String,
    enum: ["PhonePe", "GooglePay", "Paytm", "NetBanking", "Cash"],
    default: "Cash"
  },

  utrNo: {
    type: String
  }
},
{ timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);