const User = require("../models/User");

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query;

    const users = await User.find({
      username: {
        $regex: query,
        $options: "i",
      },
      _id: {
        $ne: req.user.id,
      },
    }).select("_id username email avatar");

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.sendFriendRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const receiverId = req.params.id;

    if (senderId === receiverId) {
      return res.status(400).json({
        message: "You cannot send request to yourself",
      });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (
      sender.friends.includes(receiverId)
    ) {
      return res.status(400).json({
        message: "Already friends",
      });
    }

    if (
      sender.sentRequests.includes(receiverId)
    ) {
      return res.status(400).json({
        message: "Request already sent",
      });
    }

    receiver.friendRequests.push(senderId);

    sender.sentRequests.push(receiverId);

    await receiver.save();
    await sender.save();

    res.status(200).json({
      message: "Friend request sent",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate(
        "friendRequests",
        "_id username email avatar"
      );

    res.status(200).json(
      user.friendRequests
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.acceptFriendRequest = async (
  req,
  res
) => {
  try {
    const currentUserId = req.user.id;
    const senderId = req.params.id;

    const currentUser =
      await User.findById(currentUserId);

    const sender =
      await User.findById(senderId);

    if (!sender) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    currentUser.friends.push(senderId);

    sender.friends.push(currentUserId);

    currentUser.friendRequests =
      currentUser.friendRequests.filter(
        (id) =>
          id.toString() !== senderId
      );

    sender.sentRequests =
      sender.sentRequests.filter(
        (id) =>
          id.toString() !== currentUserId
      );

    await currentUser.save();
    await sender.save();

    res.status(200).json({
      message:
        "Friend request accepted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate(
        "friends",
        "_id username email avatar online"
      );

    res.status(200).json(user.friends);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getSentRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      "sentRequests",
      "_id username email avatar"
    );

    res.status(200).json(user.sentRequests);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};