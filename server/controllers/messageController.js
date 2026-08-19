const Message = require("../models/Message");

// =====================================
// SEND MESSAGE
// =====================================

exports.sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      content,
      fileUrl,
      fileName,
      fileType,
    } = req.body;

    // At least text or file is required
    if (
      (!content || !content.trim()) &&
      !fileUrl
    ) {
      return res.status(400).json({
        message:
          "Message content or file is required",
      });
    }

    const message =
      await Message.create({
        sender: req.user.id,
        receiver: receiverId,
        content: content || "",
        fileUrl: fileUrl || "",
        fileName: fileName || "",
        fileType: fileType || "",
      });

    res.status(201).json(message);

  } catch (error) {
    console.log(
      "Send message error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};


// =====================================
// GET MESSAGES
// =====================================

exports.getMessages = async (
  req,
  res
) => {
  try {
    const friendId =
      req.params.friendId;

    const messages =
      await Message.find({
        $or: [
          {
            sender: req.user.id,
            receiver: friendId,
          },
          {
            sender: friendId,
            receiver: req.user.id,
          },
        ],
      }).sort({
        createdAt: 1,
      });

    res.status(200).json(messages);

  } catch (error) {
    console.log(
      "Get messages error:",
      error
    );

    res.status(500).json({
      message: error.message,
    });
  }
};