const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Text message
    content: {
      type: String,
      default: "",
    },

    // Uploaded file URL
    fileUrl: {
      type: String,
      default: "",
    },

    // Original file name
    fileName: {
      type: String,
      default: "",
    },

    // File MIME type
    fileType: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Message",
  messageSchema
);