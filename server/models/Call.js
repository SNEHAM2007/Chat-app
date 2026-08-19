const mongoose =
  require("mongoose");

const callSchema =
  new mongoose.Schema({
    caller: {
      type:
        mongoose.Schema.Types
          .ObjectId,
      ref: "User",
    },

    receiver: {
      type:
        mongoose.Schema.Types
          .ObjectId,
      ref: "User",
    },

    status: String,

    duration: Number,

    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

module.exports =
  mongoose.model(
    "Call",
    callSchema
  );