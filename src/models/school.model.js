const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
    schoolName: {
        type: String,
        required: true,
        trim: true
    },
    schoolAddress: {
        type: String,
        required: true
    },
    schoolOwnerMobile: {
        type: String,
        required: true
    },
    schoolClasses: [{
        type: String,
    }],

    branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
  },

   status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

},
    { timestamps: true }

);

module.exports =  mongoose.model("School", schoolSchema);
