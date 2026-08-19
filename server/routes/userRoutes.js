const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  searchUsers,
  sendFriendRequest,
  getFriendRequests,
  getSentRequests,
  acceptFriendRequest,
  getFriends,
} = require("../controllers/userController");

router.post(
  "/request/:id",
  authMiddleware,
  sendFriendRequest
);

router.get(
  "/friends",
  authMiddleware,
  getFriends
);

router.get(
  "/search",
  authMiddleware,
  searchUsers
);

router.get(
  "/requests",
  authMiddleware,
  getFriendRequests
);

router.post(
  "/accept/:id",
  authMiddleware,
  acceptFriendRequest
);

router.get(
  "/sent-requests",
  authMiddleware,
  getSentRequests
);

module.exports = router;