const uploadRoutes = require("./routes/uploadRoutes");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");

const connectDB = require("./config/db");

dotenv.config();

connectDB();

const app = express();

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: "https://chat-app-1-nria.onrender.com",
    credentials: true,
  })
);

app.use(express.json());

// ======================================================
// STATIC UPLOADS
// ======================================================

app.use("/uploads", express.static("uploads"));

// ======================================================
// ROUTES
// ======================================================

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);

// ======================================================
// DEFAULT ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.send("API Running");
});

// ======================================================
// HTTP SERVER
// ======================================================

const server = http.createServer(app);

// ======================================================
// SOCKET.IO SERVER
// ======================================================

const io = new Server(server, {
  cors: {
    origin: "https://chat-app-1-nria.onrender.com",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ======================================================
// ONLINE USERS
// ======================================================
//
// Structure:
//
// {
//   userId: socketId
// }
//
// Example:
//
// {
//   "6a59...": "ABC123",
//   "6a5a...": "XYZ789"
// }
//
// ======================================================

const onlineUsers = {};

// ======================================================
// SOCKET CONNECTION
// ======================================================

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // ====================================================
  // USER JOIN
  // ====================================================

  socket.on("join", (userId) => {
    if (!userId) {
      console.log("JOIN ERROR: userId missing");
      return;
    }

    // Save user ID on this socket
    socket.userId = userId;

    // Register socket
    onlineUsers[userId] = socket.id;

    console.log("User Joined:", userId);
    console.log("Socket ID:", socket.id);
    console.log("Current Online Users:", onlineUsers);

    // Send updated online users
    io.emit("online_users", Object.keys(onlineUsers));
  });

  // ====================================================
  // CHAT MESSAGE
  // ====================================================

  socket.on("send_message", (data) => {
    console.log("Message:", data);

    const receiverSocket =
      onlineUsers[data.receiverId];

    console.log(
      "Receiver Socket:",
      receiverSocket
    );

    if (receiverSocket) {
      io.to(receiverSocket).emit(
        "receive_message",
        data
      );

      console.log("Message Delivered");
    } else {
      console.log("Receiver Offline");
    }
  });

  // ====================================================
  // TYPING
  // ====================================================

  socket.on(
    "typing",
    ({ senderId, receiverId }) => {
      const receiverSocket =
        onlineUsers[receiverId];

      if (receiverSocket) {
        io.to(receiverSocket).emit(
          "typing",
          {
            senderId,
          }
        );
      }
    }
  );

  // ====================================================
  // STOP TYPING
  // ====================================================

  socket.on(
    "stop-typing",
    ({ senderId, receiverId }) => {
      const receiverSocket =
        onlineUsers[receiverId];

      if (receiverSocket) {
        io.to(receiverSocket).emit(
          "stop-typing",
          {
            senderId,
          }
        );
      }
    }
  );

  // ====================================================
  // CALL USER
  // ====================================================
  //
  // Supports:
  //
  // callType = "voice"
  // callType = "video"
  //
  // IMPORTANT:
  // callType is forwarded to the receiver.
  //
  // ====================================================

  socket.on("call-user", (data) => {
    console.log(
      "================================="
    );
    console.log("CALL REQUEST");
    console.log(
      "Caller:",
      data.callerId
    );
    console.log(
      "Receiver:",
      data.receiverId
    );
    console.log(
      "Call Type:",
      data.callType
    );
    console.log(
      "================================="
    );

    const receiverSocket =
      onlineUsers[data.receiverId];

    console.log(
      "Receiver Socket:",
      receiverSocket
    );

    if (receiverSocket) {
      io.to(receiverSocket).emit(
        "incoming-call",
        {
          callerId:
            data.callerId,

          offer:
            data.offer,

          // IMPORTANT
          // Forward voice/video type
          callType:
            data.callType || "video",
        }
      );

      console.log(
        `${
          data.callType || "video"
        } call sent successfully`
      );
    } else {
      console.log(
        "Receiver Offline"
      );
    }
  });

  // ====================================================
  // ANSWER CALL
  // ====================================================
  //
  // The receiver accepts the call.
  //
  // Forward:
  //
  // answer
  // callType
  //
  // ====================================================

  socket.on("answer-call", (data) => {
    console.log(
      "================================="
    );
    console.log("ANSWER CALL");
    console.log(
      "Receiver:",
      data.receiverId
    );
    console.log(
      "Call Type:",
      data.callType
    );
    console.log(
      "================================="
    );

    const receiverSocket =
      onlineUsers[data.receiverId];

    console.log(
      "Caller Socket:",
      receiverSocket
    );

    if (receiverSocket) {
      io.to(receiverSocket).emit(
        "call-answered",
        {
          answer:
            data.answer,

          // IMPORTANT
          // Forward voice/video type
          callType:
            data.callType || "video",
        }
      );

      console.log(
        "Call Answered"
      );
    } else {
      console.log(
        "Caller Offline"
      );
    }
  });

  // ====================================================
  // REJECT CALL
  // ====================================================

  socket.on(
    "reject-call",
    ({ receiverId }) => {
      console.log(
        "REJECT CALL"
      );

      console.log(
        "Receiver ID:",
        receiverId
      );

      const receiverSocket =
        onlineUsers[receiverId];

      console.log(
        "Receiver Socket:",
        receiverSocket
      );

      if (receiverSocket) {
        io.to(receiverSocket).emit(
          "call-rejected"
        );

        console.log(
          "Call Rejected Event Sent"
        );
      } else {
        console.log(
          "Caller Offline"
        );
      }
    }
  );

  // ====================================================
  // ICE CANDIDATE
  // ====================================================

  socket.on(
    "ice-candidate",
    (data) => {
      const receiverSocket =
        onlineUsers[
          data.receiverId
        ];

      if (receiverSocket) {
        io.to(receiverSocket).emit(
          "ice-candidate",
          {
            candidate:
              data.candidate,
          }
        );

        console.log(
          "ICE Candidate Sent"
        );
      } else {
        console.log(
          "ICE Candidate Receiver Offline"
        );
      }
    }
  );

  // ====================================================
  // END CALL
  // ====================================================

  socket.on(
    "end-call",
    (data) => {
      console.log(
        "================================="
      );
      console.log(
        "END CALL"
      );
      console.log(
        "Receiver:",
        data.receiverId
      );
      console.log(
        "================================="
      );

      const receiverSocket =
        onlineUsers[
          data.receiverId
        ];

      console.log(
        "Receiver Socket:",
        receiverSocket
      );

      if (receiverSocket) {
        io.to(receiverSocket).emit(
          "call-ended"
        );

        console.log(
          "Call Ended"
        );
      } else {
        console.log(
          "Receiver Offline"
        );
      }
    }
  );

  // ====================================================
  // DISCONNECT
  // ====================================================

  socket.on(
    "disconnect",
    () => {
      console.log(
        "User Disconnected:",
        socket.id
      );

      // Only delete the user if
      // this socket is still the active socket.
      //
      // This prevents another active tab/device
      // from being removed accidentally.

      if (
        socket.userId &&
        onlineUsers[
          socket.userId
        ] === socket.id
      ) {
        delete onlineUsers[
          socket.userId
        ];

        console.log(
          "Removed User:",
          socket.userId
        );
      }

      console.log(
        "Current Online Users:",
        onlineUsers
      );

      // Send updated online users
      io.emit(
        "online_users",
        Object.keys(onlineUsers)
      );
    }
  );
});

// ======================================================
// START SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});