import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "react-hot-toast";

import { useEffect } from "react";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Friends from "./pages/Friends";
import Chat from "./pages/Chat";

import socket from "./socket";

import "./App.css";

function App() {
  const token =
    localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  // ==========================================
  // JOIN SOCKET
  // ==========================================

  useEffect(() => {
    if (!token || !user?._id) {
      console.log(
        "APP: User not logged in"
      );

      return;
    }

    const joinUser = () => {
      console.log(
        "APP JOINING USER:",
        user._id
      );

      socket.emit(
        "join",
        user._id
      );
    };

    // Socket already connected
    if (socket.connected) {
      joinUser();
    } else {
      // Wait until connection happens
      socket.once(
        "connect",
        joinUser
      );
    }

    return () => {
      socket.off(
        "connect",
        joinUser
      );
    };
  }, [token, user?._id]);

  return (
    <BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#fff",
          },
        }}
      />

      <Routes>

        <Route
          path="/"
          element={
            token ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <Navigate
                to="/login"
                replace
              />
            )
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/friends"
          element={<Friends />}
        />

        <Route
          path="/chat/:friendId"
          element={<Chat />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;