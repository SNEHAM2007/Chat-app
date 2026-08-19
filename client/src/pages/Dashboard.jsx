import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaUserFriends,
  FaComments,
  FaMoon,
  FaSun,
  FaSignOutAlt,
} from "react-icons/fa";

import socket from "../socket";

import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(true);

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // ==========================================
  // DARK / LIGHT MODE
  // ==========================================

  useEffect(() => {
    document.body.className = darkMode
      ? "dark"
      : "light";

    return () => {
      document.body.className = "";
    };
  }, [darkMode]);

  // ==========================================
  // SOCKET JOIN
  // ==========================================

  useEffect(() => {
    if (!user?._id) {
      console.log(
        "Dashboard: User not found"
      );
      return;
    }

    console.log(
      "Dashboard JOINING USER:",
      user._id
    );

    socket.emit(
      "join",
      user._id
    );

  }, [user?._id]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // ==========================================
  // DASHBOARD UI
  // ==========================================

  return (
    <div className="dashboard">

      {/* ================================== */}
      {/* SIDEBAR */}
      {/* ================================== */}

      <div className="sidebar">

        {/* LOGO */}

        <div className="logo">
         webHello
        </div>

        {/* FRIENDS */}

        <button
          className="sideButton"
          onClick={() =>
            navigate("/friends")
          }
        >
          <FaUserFriends />
          <span>Friends</span>
        </button>

        {/* CHATS */}

        <button
          className="sideButton"
          onClick={() =>
            navigate("/friends")
          }
        >
          <FaComments />
          <span>Chats</span>
        </button>

        {/* DARK / LIGHT MODE */}

        <button
          className="sideButton"
          onClick={() =>
            setDarkMode(
              (previous) =>
                !previous
            )
          }
        >
          {darkMode ? (
            <FaSun />
          ) : (
            <FaMoon />
          )}

          <span>
            {darkMode
              ? "Light Mode"
              : "Dark Mode"}
          </span>
        </button>

        {/* LOGOUT */}

        <button
          className="logoutButton"
          onClick={logout}
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>

      </div>

      {/* ================================== */}
      {/* MAIN CONTENT */}
      {/* ================================== */}

      <div className="mainContent">

        {/* TOP BAR */}

        <div className="topBar">

          <div>

            <h2>
              Welcome,
            </h2>

            <h1>
              {user?.username ||
                "User"}
            </h1>

          </div>

          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.username || "User"
            )}&background=2563eb&color=fff`}
            alt="User Avatar"
            className="avatar"
          />

        </div>

        {/* ================================== */}
        {/* DASHBOARD CARDS */}
        {/* ================================== */}

        <div className="cards">

          {/* FRIENDS CARD */}

          <div className="card">

            <h2>
              Friends
            </h2>

            <p>
              Manage all your friends.
            </p>

            <button
              onClick={() =>
                navigate("/friends")
              }
            >
              Open
            </button>

          </div>

          {/* CHAT CARD */}

          <div className="card">

            <h2>
              Chats
            </h2>

            <p>
              Continue your
              conversations.
            </p>

            <button
              onClick={() =>
                navigate("/friends")
              }
            >
              Open
            </button>

          </div>

          {/* CALL CARD */}

          <div className="card">

            <h2>
              Calls
            </h2>

            <p>
              Voice & Video Calling.
            </p>

            <button
              onClick={() =>
                navigate("/friends")
              }
            >
              Open
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}