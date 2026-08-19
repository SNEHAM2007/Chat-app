import {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import API from "../api/authApi";
import socket from "../socket";

import {
  FaArrowLeft,
  FaPhone,
  FaVideo,
  FaPhoneSlash,
  FaPaperPlane,
  FaUser,
  FaComments,
  FaSignOutAlt,
  FaEllipsisV,
  FaPaperclip,
  FaTimes,
  FaFile,
  FaDownload,
} from "react-icons/fa";

import "./Chat.css";

export default function Chat() {
  const { friendId } = useParams();
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [messages, setMessages] = useState([]);

  const [friend, setFriend] = useState(null);

  const [message, setMessage] = useState("");

  const [callStatus, setCallStatus] = useState("Idle");

  // CALL TYPE: "video" or "voice"
  const [callType, setCallType] = useState("video");

  const [showCallPanel, setShowCallPanel] =
    useState(false);

  const [incomingCall, setIncomingCall] =
    useState(null);

  const [isTyping, setIsTyping] =
    useState(false);

  const [onlineUsers, setOnlineUsers] =
    useState([]);

  // FILE SHARING
  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploadingFile, setUploadingFile] =
    useState(false);

  // ==========================================
  // REFS
  // ==========================================

  const ringtoneRef = useRef(null);

  const peerConnection =
    useRef(null);

  const localStream =
    useRef(null);

  const remoteUserId =
    useRef(friendId);

  const remoteAudioRef =
    useRef(null);

  const localVideoRef =
    useRef(null);

  const remoteVideoRef =
    useRef(null);

  const typingTimeout =
    useRef(null);

  const messagesEndRef =
    useRef(null);

  const fileInputRef =
    useRef(null);

  // ==========================================
  // CURRENT USER
  // ==========================================

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // ==========================================
  // WEBRTC CONFIG
  // ==========================================

  const configuration = {
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  };

  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  const loadMessages = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await API.get(
        `/messages/${friendId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setMessages(res.data);
    } catch (error) {
      console.log(
        "Error loading messages:",
        error
      );
    }
  };

  // ==========================================
  // LOAD FRIEND
  // ==========================================

  const loadFriend = async () => {
    try {
      const token =
        localStorage.getItem("token");

      const res = await API.get(
        "/users/friends",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const selectedFriend =
        res.data.find(
          (item) =>
            item._id === friendId
        );

      if (selectedFriend) {
        setFriend(selectedFriend);
      } else {
        console.log(
          "Friend not found:",
          friendId
        );
      }
    } catch (error) {
      console.log(
        "Error loading friend:",
        error
      );
    }
  };

  // ==========================================
  // SEND TEXT MESSAGE
  // ==========================================

  const sendMessage = async () => {
    try {
      if (!message.trim()) {
        return;
      }

      const token =
        localStorage.getItem("token");

      const messageContent =
        message.trim();

      await API.post(
        "/messages/send",
        {
          receiverId: friendId,
          content: messageContent,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      socket.emit(
        "send_message",
        {
          senderId: user._id,
          receiverId: friendId,
          content: messageContent,
        }
      );

      setMessage("");

      socket.emit(
        "stop-typing",
        {
          senderId: user._id,
          receiverId: friendId,
        }
      );

      await loadMessages();
    } catch (error) {
      console.log(
        "Send message error:",
        error
      );
    }
  };

  // ==========================================
  // SELECT FILE
  // ==========================================

  const handleFileSelect = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log(
      "Selected file:",
      file
    );

    setSelectedFile(file);
  };

  // ==========================================
  // REMOVE SELECTED FILE
  // ==========================================

  const removeSelectedFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================
  // SEND FILE
  // ==========================================

  const sendFile = async () => {
    if (!selectedFile) {
      return;
    }

    try {
      setUploadingFile(true);

      const token =
        localStorage.getItem("token");

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      console.log(
        "Uploading file:",
        selectedFile.name
      );

      // --------------------------------------
      // UPLOAD FILE
      // --------------------------------------

      const uploadResponse =
        await API.post(
          "/upload",
          formData,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      console.log(
        "FULL UPLOAD RESPONSE:",
        uploadResponse
      );

      console.log(
        "UPLOAD DATA:",
        uploadResponse?.data
      );

      console.log(
        "UPLOAD FILE:",
        uploadResponse?.data?.file
      );

      // --------------------------------------
      // GET FILE INFORMATION
      // --------------------------------------

      const uploadedFile =
        uploadResponse?.data?.file;

      if (!uploadedFile) {
        throw new Error(
          "Upload API did not return file information"
        );
      }

      /*
        Your backend currently returns:

        {
          message: "File uploaded successfully",
          file: { ... }
        }

        The URL may be stored under different
        property names, so we check all common
        possibilities.
      */

      let fileUrl =
        uploadedFile.url ||
        uploadedFile.secure_url ||
        uploadedFile.path ||
        uploadedFile.fileUrl ||
        uploadedFile.location;

      // --------------------------------------
      // FALLBACK FOR FILENAME
      // --------------------------------------

      if (
        !fileUrl &&
        uploadedFile.filename
      ) {
        fileUrl =
          `http://localhost:5000/uploads/${uploadedFile.filename}`;
      }

      // --------------------------------------
      // FALLBACK FOR ORIGINAL NAME
      // --------------------------------------

      if (
        !fileUrl &&
        uploadedFile.originalname
      ) {
        fileUrl =
          `http://localhost:5000/uploads/${uploadedFile.originalname}`;
      }

      if (!fileUrl) {
        console.error(
          "Upload API response:",
          uploadResponse?.data
        );

        throw new Error(
          "File URL was not returned by upload API"
        );
      }

      // --------------------------------------
      // CONVERT RELATIVE URL TO ABSOLUTE URL
      // --------------------------------------

      if (
        fileUrl.startsWith("/")
      ) {
        fileUrl =
          `http://localhost:5000${fileUrl}`;
      }

      console.log(
        "FINAL FILE URL:",
        fileUrl
      );

      // --------------------------------------
      // CREATE FILE MESSAGE
      // --------------------------------------

      const fileMessage = JSON.stringify({
        type: "file",
        fileName:
          selectedFile.name,
        fileUrl: fileUrl,
        fileType:
          selectedFile.type,
        fileSize:
          selectedFile.size,
      });

      // --------------------------------------
      // SAVE FILE MESSAGE IN DATABASE
      // --------------------------------------

      await API.post(
        "/messages/send",
        {
          receiverId: friendId,
          content: fileMessage,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      // --------------------------------------
      // SEND FILE MESSAGE THROUGH SOCKET
      // --------------------------------------

      socket.emit(
        "send_message",
        {
          senderId: user._id,
          receiverId: friendId,
          content: fileMessage,
        }
      );

      // --------------------------------------
      // CLEAR FILE
      // --------------------------------------

      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadMessages();

      console.log(
        "File sent successfully"
      );
    } catch (error) {
      console.error(
        "File upload/send error:",
        error
      );

      alert(
        "Failed to upload file. Please try again."
      );
    } finally {
      setUploadingFile(false);
    }
  };

  // ==========================================
  // HANDLE SEND
  // ==========================================

  const handleSend = async () => {
    if (selectedFile) {
      await sendFile();
      return;
    }

    await sendMessage();
  };

  // ==========================================
  // AUTO SCROLL
  // ==========================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // CREATE PEER CONNECTION
  // ==========================================

  const createPeerConnection = () => {
    peerConnection.current =
      new RTCPeerConnection(
        configuration
      );

    // --------------------------------------
    // REMOTE STREAM
    // --------------------------------------

    peerConnection.current.ontrack =
      (event) => {
        console.log(
          "REMOTE STREAM RECEIVED"
        );

        const remoteStream =
          event.streams[0];

        if (
          remoteVideoRef.current
        ) {
          remoteVideoRef.current.srcObject =
            remoteStream;
        }

        if (
          remoteAudioRef.current
        ) {
          remoteAudioRef.current.srcObject =
            remoteStream;

          remoteAudioRef.current
            .play()
            .catch((error) => {
              console.log(
                "Remote audio play error:",
                error
              );
            });
        }
      };

    // --------------------------------------
    // ICE CANDIDATE
    // --------------------------------------

    peerConnection.current.onicecandidate =
      (event) => {
        if (event.candidate) {
          socket.emit(
            "ice-candidate",
            {
              receiverId:
                remoteUserId.current,
              candidate:
                event.candidate,
            }
          );
        }
      };

    // --------------------------------------
    // CONNECTION STATE
    // --------------------------------------

    peerConnection.current.onconnectionstatechange =
      () => {
        const state =
          peerConnection.current
            ?.connectionState;

        console.log(
          "CONNECTION STATE:",
          state
        );

        if (
          state === "connected"
        ) {
          setCallStatus(
            "Connected"
          );
        }

        if (
          state === "connecting"
        ) {
          setCallStatus(
            "Connecting..."
          );
        }

        if (
          state === "disconnected"
        ) {
          setCallStatus(
            "Disconnected"
          );
        }

        if (
          state === "failed"
        ) {
          setCallStatus(
            "Connection Failed"
          );
        }
      };
  };

  // ==========================================
  // START CALL (VOICE / VIDEO)
  // ==========================================

  const startCall = async (type = "video") => {
    try {
      remoteUserId.current =
        friendId;

      setCallType(type);
      setShowCallPanel(true);

      setCallStatus(
        "Calling..."
      );

      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime =
          0;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
            video: type === "video",
          }
        );

      localStream.current =
        stream;

      if (type === "video" && localVideoRef.current) {
        localVideoRef.current.srcObject =
          stream;
      }

      createPeerConnection();

      stream
        .getTracks()
        .forEach((track) => {
          peerConnection.current.addTrack(
            track,
            stream
          );
        });

      const offer =
        await peerConnection.current.createOffer();

      await peerConnection.current.setLocalDescription(
        offer
      );

      socket.emit(
        "call-user",
        {
          callerId: user._id,
          receiverId: friendId,
          offer,
          callType: type,
        }
      );

      console.log(
        `${type === "voice" ? "Voice" : "Video"} call request sent`
      );
    } catch (error) {
      console.log(
        "Start call error:",
        error
      );

      setShowCallPanel(false);
      setCallStatus("Idle");
    }
  };

  // ==========================================
  // ACCEPT CALL
  // ==========================================

  const acceptCall =
    async () => {
      try {
        const data =
          incomingCall;

        if (!data) {
          return;
        }

        if (ringtoneRef.current) {
          ringtoneRef.current.pause();
          ringtoneRef.current.currentTime =
            0;
        }

        setIncomingCall(null);

        setShowCallPanel(true);

        setCallStatus(
          "Connecting..."
        );

        remoteUserId.current =
          data.callerId;

        const acceptedCallType =
          data.callType === "voice" ? "voice" : "video";

        setCallType(acceptedCallType);

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
              video: acceptedCallType === "video",
            }
          );

        localStream.current =
          stream;

        if (acceptedCallType === "video" && localVideoRef.current) {
          localVideoRef.current.srcObject =
            stream;
        }

        createPeerConnection();

        stream
          .getTracks()
          .forEach((track) => {
            peerConnection.current.addTrack(
              track,
              stream
            );
          });

        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(
            data.offer
          )
        );

        const answer =
          await peerConnection.current.createAnswer();

        await peerConnection.current.setLocalDescription(
          answer
        );

        socket.emit(
          "answer-call",
          {
            receiverId:
              data.callerId,
            answer,
          }
        );

        console.log(
          "Call accepted"
        );
      } catch (error) {
        console.log(
          "Accept call error:",
          error
        );
      }
    };

  // ==========================================
  // REJECT CALL
  // ==========================================

  const rejectCall = () => {
    if (!incomingCall) {
      return;
    }

    socket.emit(
      "reject-call",
      {
        receiverId:
          incomingCall.callerId,
      }
    );

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime =
        0;
    }

    setIncomingCall(null);

    setCallStatus(
      "Call Rejected"
    );

    setCallType("video");
  };

  // ==========================================
  // END CALL
  // ==========================================

  const endCall = () => {
    const receiverId =
      remoteUserId.current;

    if (localStream.current) {
      localStream.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStream.current = null;
    }

    if (peerConnection.current) {
      peerConnection.current.ontrack =
        null;

      peerConnection.current.onicecandidate =
        null;

      peerConnection.current.close();

      peerConnection.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject =
        null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject =
        null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject =
        null;
    }

    if (receiverId) {
      socket.emit(
        "end-call",
        {
          receiverId,
        }
      );
    }

    remoteUserId.current =
      friendId;

    setShowCallPanel(false);

    setCallType("video");
    setCallStatus("Idle");
  };

  // ==========================================
  // JOIN SOCKET
  // ==========================================

  useEffect(() => {
    if (!user?._id) {
      return;
    }

    socket.emit(
      "join",
      user._id
    );
  }, []);

  // ==========================================
  // LOAD FRIEND + MESSAGES
  // ==========================================

  useEffect(() => {
    if (!friendId) {
      return;
    }

    loadFriend();
    loadMessages();

    remoteUserId.current =
      friendId;
  }, [friendId]);

  // ==========================================
  // ONLINE USERS
  // ==========================================

  useEffect(() => {
    const handleOnlineUsers =
      (users) => {
        setOnlineUsers(users);
      };

    socket.on(
      "online_users",
      handleOnlineUsers
    );

    return () => {
      socket.off(
        "online_users",
        handleOnlineUsers
      );
    };
  }, []);

  // ==========================================
  // RECEIVE MESSAGE
  // ==========================================

  useEffect(() => {
    const handleReceiveMessage =
      (data) => {
        if (
          data.senderId !== friendId
        ) {
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            _id: Date.now(),
            sender:
              data.senderId,
            receiver:
              data.receiverId,
            content:
              data.content,
          },
        ]);
      };

    socket.on(
      "receive_message",
      handleReceiveMessage
    );

    return () => {
      socket.off(
        "receive_message",
        handleReceiveMessage
      );
    };
  }, [friendId]);

  // ==========================================
  // INCOMING CALL
  // ==========================================

  useEffect(() => {
    const handleIncomingCall =
      (data) => {
        console.log(
          "INCOMING CALL:",
          data
        );

        setIncomingCall(data);

        setCallType(
          data.callType === "voice" ? "voice" : "video"
        );

        setCallStatus(
          "Incoming Call"
        );

        if (
          ringtoneRef.current
        ) {
          ringtoneRef.current
            .play()
            .catch(() => {});
        }
      };

    socket.on(
      "incoming-call",
      handleIncomingCall
    );

    return () => {
      socket.off(
        "incoming-call",
        handleIncomingCall
      );
    };
  }, []);

  // ==========================================
  // CALL ANSWERED
  // ==========================================

  useEffect(() => {
    const handleCallAnswered =
      async (data) => {
        try {
          if (
            !peerConnection.current
          ) {
            return;
          }

          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(
              data.answer
            )
          );

          setCallStatus(
            "Connected"
          );

          console.log(
            "CALL CONNECTED"
          );
        } catch (error) {
          console.log(
            "Answer error:",
            error
          );
        }
      };

    socket.on(
      "call-answered",
      handleCallAnswered
    );

    return () => {
      socket.off(
        "call-answered",
        handleCallAnswered
      );
    };
  }, []);

  // ==========================================
  // ICE CANDIDATE
  // ==========================================

  useEffect(() => {
    const handleIceCandidate =
      async (data) => {
        try {
          if (
            !peerConnection.current
          ) {
            return;
          }

          if (
            peerConnection.current
              .signalingState ===
            "closed"
          ) {
            return;
          }

          if (
            !peerConnection.current
              .remoteDescription
          ) {
            console.log(
              "Remote description not ready"
            );

            return;
          }

          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(
              data.candidate
            )
          );

          console.log(
            "ICE candidate added"
          );
        } catch (error) {
          console.log(
            "ICE error:",
            error
          );
        }
      };

    socket.on(
      "ice-candidate",
      handleIceCandidate
    );

    return () => {
      socket.off(
        "ice-candidate",
        handleIceCandidate
      );
    };
  }, []);

  // ==========================================
  // CALL REJECTED
  // ==========================================

  useEffect(() => {
    const handleCallRejected =
      () => {
        setCallStatus(
          "Call Rejected"
        );

        if (
          localStream.current
        ) {
          localStream.current
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          localStream.current =
            null;
        }

        if (
          peerConnection.current
        ) {
          peerConnection.current.close();

          peerConnection.current =
            null;
        }

        if (
          localVideoRef.current
        ) {
          localVideoRef.current.srcObject =
            null;
        }

        if (
          remoteVideoRef.current
        ) {
          remoteVideoRef.current.srcObject =
            null;
        }

        setShowCallPanel(false);
        setCallType("video");

        alert(
          "User rejected your call"
        );
      };

    socket.on(
      "call-rejected",
      handleCallRejected
    );

    return () => {
      socket.off(
        "call-rejected",
        handleCallRejected
      );
    };
  }, []);

  // ==========================================
  // CALL ENDED
  // ==========================================

  useEffect(() => {
    const handleCallEnded =
      () => {
        console.log(
          "CALL ENDED BY OTHER USER"
        );

        if (
          localStream.current
        ) {
          localStream.current
            .getTracks()
            .forEach((track) => {
              track.stop();
            });

          localStream.current =
            null;
        }

        if (
          peerConnection.current
        ) {
          peerConnection.current.close();

          peerConnection.current =
            null;
        }

        if (
          localVideoRef.current
        ) {
          localVideoRef.current.srcObject =
            null;
        }

        if (
          remoteVideoRef.current
        ) {
          remoteVideoRef.current.srcObject =
            null;
        }

        if (
          remoteAudioRef.current
        ) {
          remoteAudioRef.current.srcObject =
            null;
        }

        setShowCallPanel(false);
        setCallType("video");

        setCallStatus("Idle");

        remoteUserId.current =
          friendId;
      };

    socket.on(
      "call-ended",
      handleCallEnded
    );

    return () => {
      socket.off(
        "call-ended",
        handleCallEnded
      );
    };
  }, [friendId]);

  // ==========================================
  // TYPING
  // ==========================================

  useEffect(() => {
    const handleTyping =
      () => {
        setIsTyping(true);
      };

    const handleStopTyping =
      () => {
        setIsTyping(false);
      };

    socket.on(
      "typing",
      handleTyping
    );

    socket.on(
      "stop-typing",
      handleStopTyping
    );

    return () => {
      socket.off(
        "typing",
        handleTyping
      );

      socket.off(
        "stop-typing",
        handleStopTyping
      );
    };
  }, []);

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      if (
        typingTimeout.current
      ) {
        clearTimeout(
          typingTimeout.current
        );
      }

      if (
        localStream.current
      ) {
        localStream.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      if (
        peerConnection.current
      ) {
        peerConnection.current.close();
      }
    };
  }, []);

  // ==========================================
  // FRIEND ONLINE STATUS
  // ==========================================

  const isFriendOnline =
    onlineUsers.includes(
      friendId
    );

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };

  // ==========================================
  // FILE MESSAGE RENDER
  // ==========================================

  const renderMessageContent = (
    msg
  ) => {
    let fileData = null;

    try {
      if (
        typeof msg.content ===
        "string"
      ) {
        const parsed =
          JSON.parse(
            msg.content
          );

        if (
          parsed?.type === "file"
        ) {
          fileData = parsed;
        }
      }
    } catch {
      // Normal text message
    }

    // --------------------------------------
    // FILE MESSAGE
    // --------------------------------------

    if (fileData) {
      const isImage =
        fileData.fileType?.startsWith(
          "image/"
        );

      return (
        <div className="fileMessage">

          {isImage && (
            <img
              src={fileData.fileUrl}
              alt={
                fileData.fileName ||
                "Shared file"
              }
              className="sharedImage"
              onError={(e) => {
                e.currentTarget.style.display =
                  "none";
              }}
            />
          )}

          <div className="fileMessageInfo">

            <FaFile />

            <span>
              {fileData.fileName ||
                "Shared file"}
            </span>

          </div>

          <a
            href={fileData.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="downloadFileButton"
          >
            <FaDownload />

            Open / Download
          </a>

        </div>
      );
    }

    // --------------------------------------
    // NORMAL TEXT MESSAGE
    // --------------------------------------

    return msg.content;
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="chatPage">

      {/* =====================================
          LEFT SIDEBAR
      ====================================== */}

      <aside className="chatSidebar">

        <div className="chatLogo">
          ChatSphere
        </div>

        {/* CURRENT USER */}

        <div className="sidebarProfile">

          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.username ||
                "User"
            )}&background=2563eb&color=fff`}
            alt="Profile"
          />

          <div className="sidebarProfileInfo">

            <h4>
              {user?.username ||
                "User"}
            </h4>

            <span>
              <span className="onlineDot">
                ●
              </span>{" "}
              Online
            </span>

          </div>

        </div>

        {/* DASHBOARD */}

        <button
          className="chatNavButton"
          onClick={() =>
            navigate(
              "/dashboard"
            )
          }
        >
          <FaArrowLeft />

          <span>
            Dashboard
          </span>
        </button>

        {/* CHAT */}

        <button
          className="chatNavButton active"
        >
          <FaComments />

          <span>
            Chat
          </span>
        </button>

        {/* FRIENDS */}

        <button
          className="chatNavButton"
          onClick={() =>
            navigate(
              "/friends"
            )
          }
        >
          <FaUser />

          <span>
            Friends
          </span>
        </button>

        {/* LOGOUT */}

        <button
          className="chatLogout"
          onClick={logout}
        >
          <FaSignOutAlt />

          <span>
            Logout
          </span>
        </button>

      </aside>

      {/* =====================================
          MAIN CHAT
      ====================================== */}

      <main className="chatMain">

        {/* ===================================
            CHAT HEADER
        ==================================== */}

        <header className="chatHeader">

          <div className="chatHeaderLeft">

            <button
              className="backButton"
              onClick={() =>
                navigate(
                  "/friends"
                )
              }
            >
              <FaArrowLeft />
            </button>

            <img
              className="friendAvatar"
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                friend?.username ||
                  "User"
              )}&background=2563eb&color=fff`}
              alt={
                friend?.username ||
                "User"
              }
            />

            <div className="friendHeaderInfo">

              <h3>
                {friend?.username ||
                  "Loading..."}
              </h3>

              <span
                className={
                  isFriendOnline
                    ? "friendOnline"
                    : "friendOffline"
                }
              >
                ●{" "}
                {isFriendOnline
                  ? "Online"
                  : "Offline"}
              </span>

            </div>

          </div>

          {/* HEADER ACTIONS */}

          <div className="chatHeaderActions">

            {/* VOICE CALL */}

            <button
              className="headerCallButton"
              onClick={() => startCall("voice")}
              title="Start Voice Call"
            >
              <FaPhone />
            </button>

            {/* VIDEO CALL */}

            <button
              className="headerCallButton"
              onClick={() => startCall("video")}
              title="Start Video Call"
            >
              <FaVideo />
            </button>

            {/* END CALL */}

            {showCallPanel && (
              <button
                className="headerCallButton danger"
                onClick={
                  endCall
                }
                title="End Call"
              >
                <FaPhoneSlash />
              </button>
            )}

            {/* MORE */}

            <button
              className="headerCallButton"
              title="More"
            >
              <FaEllipsisV />
            </button>

          </div>

        </header>

        {/* ===================================
            INCOMING CALL
        ==================================== */}

        {incomingCall && (
          <div className="incomingCall">

            <h3>
              {incomingCall?.callType === "voice"
                ? "📞 Incoming Voice Call"
                : "📹 Incoming Video Call"}
            </h3>

            <p>
              {friend?.username ||
                "Someone"}{" "}
              is calling you...
            </p>

            <div className="incomingCallActions">

              <button
                className="acceptButton"
                onClick={
                  acceptCall
                }
              >
                ✅ Accept
              </button>

              <button
                className="rejectButton"
                onClick={
                  rejectCall
                }
              >
                ❌ Reject
              </button>

            </div>

          </div>
        )}

        {/* ===================================
            VOICE / VIDEO CALL
        ==================================== */}

        {showCallPanel && (
          <section className="videoArea">

            <div className="callStatusBar">

              {callType === "voice" ? "Voice Call Status:" : "Video Call Status:"}

              <strong
                className={
                  callStatus === "Connected"
                    ? "callStatusConnected"
                    : "callStatusCalling"
                }
              >
                {" "}
                {callStatus}
              </strong>

            </div>

            {callType === "voice" ? (
              <div
                className="voiceCallPanel"
                style={{
                  minHeight: "260px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  borderRadius: "16px",
                }}
              >
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    friend?.username || "User"
                  )}&background=2563eb&color=fff&size=128`}
                  alt={friend?.username || "Friend"}
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                  }}
                />

                <h3 style={{ margin: 0 }}>
                  {friend?.username || "Friend"}
                </h3>

                <p style={{ margin: 0 }}>
                  {callStatus === "Connected"
                    ? "Voice call connected"
                    : callStatus}
                </p>
              </div>
            ) : (
              <>
                <div className="remoteVideoBox">

                  <video
                    ref={remoteVideoRef}
                    className="remoteVideo"
                    autoPlay
                    playsInline
                  />

                  {!remoteVideoRef.current?.srcObject && (
                    <div className="remotePlaceholder">

                      <div className="remotePlaceholderIcon">
                        <FaUser />
                      </div>

                      <p>
                        Waiting for {friend?.username || "friend"}...
                      </p>

                    </div>
                  )}

                </div>

                <div className="localVideoBox">

                  <video
                    ref={localVideoRef}
                    className="localVideo"
                    autoPlay
                    muted
                    playsInline
                  />

                </div>

                <audio
                  ref={remoteAudioRef}
                  autoPlay
                  playsInline
                />
              </>
            )}

            <div className="callControls">

              <button
                className="callControlButton"
                onClick={endCall}
                title="End Call"
              >
                <FaPhoneSlash />
              </button>

            </div>

          </section>
        )}

        {/* ===================================
            TYPING INDICATOR
        ==================================== */}

        {isTyping && (
          <div className="typingIndicator">

            {friend?.username ||
              "Friend"}{" "}
            is typing...

          </div>
        )}

        {/* ===================================
            MESSAGES
        ==================================== */}

        <section className="messagesArea">

          {messages.length ===
            0 && (
            <div
              style={{
                textAlign:
                  "center",
                color:
                  "#64748b",
                margin:
                  "auto",
              }}
            >

              <h3>
                Start a conversation
              </h3>

              <p>
                Send a message to{" "}
                {friend?.username ||
                  "your friend"}.
              </p>

            </div>
          )}

          {messages.map(
            (
              msg,
              index
            ) => {

              const senderId =
                typeof msg.sender ===
                "object"
                  ? msg.sender?._id
                  : msg.sender;

              const isMine =
                senderId ===
                user?._id;

              return (
                <div
                  key={
                    msg._id ||
                    index
                  }
                  className={`messageRow ${
                    isMine
                      ? "sent"
                      : "received"
                  }`}
                >

                  <div className="messageBubble">

                    {renderMessageContent(
                      msg
                    )}

                  </div>

                </div>
              );
            }
          )}

          <div
            ref={
              messagesEndRef
            }
          />

        </section>

        {/* ===================================
            SELECTED FILE PREVIEW
        ==================================== */}

        {selectedFile && (
          <div className="selectedFilePreview">

            <FaFile />

            <span>
              {selectedFile.name}
            </span>

            <span>
              (
              {(
                selectedFile.size /
                1024 /
                1024
              ).toFixed(2)}
              MB)
            </span>

            <button
              onClick={
                removeSelectedFile
              }
              title="Remove file"
            >
              <FaTimes />
            </button>

          </div>
        )}

        {/* ===================================
            MESSAGE INPUT
        ==================================== */}

        <div className="messageArea">

          <div className="messageForm">

            {/* HIDDEN FILE INPUT */}

            <input
              ref={
                fileInputRef
              }
              type="file"
              style={{
                display:
                  "none",
              }}
              onChange={
                handleFileSelect
              }
            />

            {/* ATTACH FILE */}

            <button
              type="button"
              className="fileButton"
              onClick={() =>
                fileInputRef.current?.click()
              }
              title="Attach file"
              disabled={
                uploadingFile
              }
            >
              <FaPaperclip />
            </button>

            {/* MESSAGE INPUT */}

            <input
              className="messageInput"
              type="text"
              value={
                message
              }
              placeholder={
                selectedFile
                  ? "File selected..."
                  : "Type a message..."
              }
              onChange={(e) => {

                const value =
                  e.target.value;

                setMessage(
                  value
                );

                socket.emit(
                  "typing",
                  {
                    senderId:
                      user._id,

                    receiverId:
                      friendId,
                  }
                );

                clearTimeout(
                  typingTimeout.current
                );

                typingTimeout.current =
                  setTimeout(
                    () => {

                      socket.emit(
                        "stop-typing",
                        {
                          senderId:
                            user._id,

                          receiverId:
                            friendId,
                        }
                      );

                    },
                    1000
                  );

              }}
              onKeyDown={(e) => {

                if (
                  e.key ===
                  "Enter"
                ) {
                  handleSend();
                }

              }}
            />

            {/* SEND BUTTON */}

            <button
              className="sendButton"
              onClick={
                handleSend
              }
              title={
                selectedFile
                  ? "Send file"
                  : "Send"
              }
              disabled={
                uploadingFile
              }
            >

              {uploadingFile ? (
                "..."
              ) : selectedFile ? (
                <FaPaperPlane />
              ) : (
                <FaPaperPlane />
              )}

            </button>

          </div>

        </div>

        {/* ===================================
            RINGTONE
        ==================================== */}

        <audio
          ref={
            ringtoneRef
          }
          src="/ringtone.mp3"
          preload="auto"
        />

        {/* ===================================
            REMOTE AUDIO
        ==================================== */}

        <audio
          ref={
            remoteAudioRef
          }
          autoPlay
          className="hiddenAudio"
        />

      </main>

    </div>
  );
}