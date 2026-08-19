import { io } from "socket.io-client";

const socket = io(
  "https://chat-app-1-rzbm.onrender.com",
  {
    transports: ["websocket", "polling"],
  }
);
socket.on("connect", () => {
  console.log(
    "SOCKET CONNECTED:",
    socket.id
  );
});

socket.on("disconnect", (reason) => {
  console.log(
    "SOCKET DISCONNECTED:",
    reason
  );
});

socket.on("connect_error", (error) => {
  console.log(
    "SOCKET CONNECTION ERROR:",
    error.message
  );
});

export default socket;