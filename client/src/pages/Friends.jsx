import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaComments,
  FaCircle,
  FaSignOutAlt,
  FaUserPlus,
  FaUserCheck,
  FaUserClock,
  FaCheck,
} from "react-icons/fa";

import API from "../api/authApi";
import socket from "../socket";

import "../styles/sidebar.css";

export default function Friends() {
  const navigate = useNavigate();

  // =========================
  // USER
  // =========================

  const user = JSON.parse(localStorage.getItem("user"));

  // =========================
  // STATES
  // =========================

  const [friends, setFriends] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  const [loading, setLoading] = useState(false);

  // =========================
  // TOKEN
  // =========================

  const token = localStorage.getItem("token");

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // =========================
  // ONLINE USERS
  // =========================

  useEffect(() => {
    const handleOnlineUsers = (users) => {
      console.log("ONLINE USERS:", users);
      setOnlineUsers(users || []);
    };

    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("online_users", handleOnlineUsers);
    };
  }, []);

  // =========================
  // LOAD FRIENDS
  // =========================

  const loadFriends = async () => {
    try {
      const res = await API.get(
        "/users/friends",
        authConfig
      );

      console.log("FRIENDS:", res.data);

      setFriends(res.data || []);
    } catch (error) {
      console.log(
        "Load Friends Error:",
        error.response?.data || error.message
      );
    }
  };

  // =========================
  // LOAD FRIEND REQUESTS
  // =========================

  const loadFriendRequests = async () => {
    try {
      const res = await API.get(
        "/users/requests",
        authConfig
      );

      console.log(
        "FRIEND REQUESTS:",
        res.data
      );

      setFriendRequests(res.data || []);
    } catch (error) {
      console.log(
        "Friend Requests Error:",
        error.response?.data || error.message
      );
    }
  };

  // =========================
  // LOAD SENT REQUESTS
  // =========================

 const loadSentRequests = async () => {
  try {
    const res = await API.get(
      "/users/sent-requests",
      authConfig
    );

    console.log(
      "SENT REQUESTS:",
      res.data
    );

    setSentRequests(res.data || []);
  } catch (error) {
    console.log(
      "Sent Requests Error:",
      error.response?.data || error.message
    );
  }
};

  // =========================
  // LOAD ALL DATA
  // =========================

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadFriends();
    loadFriendRequests();
    loadSentRequests();
  }, []);

  // =========================
  // SEARCH USERS
  // =========================

  const searchUsers = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);

      const res = await API.get(
        `/users/search?query=${encodeURIComponent(
          value
        )}`,
        authConfig
      );

      console.log(
        "SEARCH RESULTS:",
        res.data
      );

      setSearchResults(res.data || []);
    } catch (error) {
      console.log(
        "Search Error:",
        error.response?.data || error.message
      );

      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CHECK FRIEND
  // =========================

  const isFriend = (userId) => {
    return friends.some(
      (friend) =>
        friend._id === userId
    );
  };

  // =========================
  // CHECK REQUEST SENT
  // =========================

  const isRequestSent = (userId) => {
    return sentRequests.some(
      (request) => {
        const id =
          typeof request === "string"
            ? request
            : request?._id;

        return id === userId;
      }
    );
  };

  // =========================
  // SEND FRIEND REQUEST
  // =========================

  const sendFriendRequest = async (
    userId
  ) => {
    try {
      await API.post(
        `/users/request/${userId}`,
        {},
        authConfig
      );

      console.log(
        "Friend Request Sent"
      );

      // Add the user to pending locally
      setSentRequests((prev) => [
        ...prev,
        userId,
      ]);

      // Remove from search result
      setSearchResults((prev) =>
        prev.map((item) =>
          item._id === userId
            ? {
                ...item,
                requestSent: true,
              }
            : item
        )
      );
    } catch (error) {
      console.log(
        "Send Request Error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to send friend request"
      );
    }
  };

  // =========================
  // ACCEPT FRIEND REQUEST
  // =========================

  const acceptFriendRequest = async (
    senderId
  ) => {
    try {
      await API.post(
        `/users/accept/${senderId}`,
        {},
        authConfig
      );

      console.log(
        "Friend Request Accepted"
      );

      // Remove from requests
      setFriendRequests((prev) =>
        prev.filter(
          (request) =>
            request._id !== senderId
        )
      );

      // Reload friends
      await loadFriends();
    } catch (error) {
      console.log(
        "Accept Request Error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Unable to accept request"
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  // =========================
  // FILTER FRIENDS
  // =========================

  const filteredFriends =
    friends.filter((friend) =>
      friend.username
        ?.toLowerCase()
        .includes(
          search.toLowerCase()
        )
    );

  // =========================
  // RENDER
  // =========================

  return (
    <div className="friendsPage">

      {/* =================================
          LEFT SIDEBAR
      ================================= */}

      <aside className="leftSidebar">

        <h1 className="logo">
          ChatSphere
        </h1>

        {/* PROFILE */}

        <div className="profile">

          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.username || "User"
              )}&background=2563eb&color=fff`
            }
            alt="Profile"
          />

          <div>
            <h3>
              {user?.username || "User"}
            </h3>

            <p>
              <FaCircle
                color="#22c55e"
                size={8}
              />
              {" "}Online
            </p>
          </div>

        </div>

        {/* NAVIGATION */}

        <button
          className="chatNavButton"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <FaComments />
          Dashboard
        </button>

        <button
          className="chatNavButton active"
        >
          <FaUserPlus />
          Friends
        </button>

        {/* LOGOUT */}

        <button
          className="chatLogout"
          onClick={logout}
        >
          <FaSignOutAlt />
          Logout
        </button>

      </aside>


      {/* =================================
          MAIN CONTENT
      ================================= */}

      <main className="friendsContainer">

        {/* HEADER */}

        <div className="friendsHeader">

          <div>
            <h1>
              Friends
            </h1>

            <p>
              Manage your friends and
              connections
            </p>
          </div>

        </div>


        {/* =================================
            SEARCH
        ================================= */}

        <section className="friendSection">

          <div className="sectionTitle">
            <FaSearch />

            <h2>
              Find People
            </h2>
          </div>

          <div className="searchBar">

            <FaSearch />

            <input
              type="text"
              placeholder="Search username..."
              value={search}
              onChange={(e) =>
                searchUsers(
                  e.target.value
                )
              }
            />

          </div>


          {/* SEARCH RESULTS */}

          {search.trim() && (

            <div className="searchResults">

              {loading && (
                <p className="emptyText">
                  Searching...
                </p>
              )}

              {!loading &&
                searchResults.length === 0 && (
                  <p className="emptyText">
                    No users found.
                  </p>
                )}

              {searchResults.map(
                (person) => {

                  const alreadyFriend =
                    isFriend(
                      person._id
                    );

                  const requestSent =
                    person.requestSent ||
                    isRequestSent(
                      person._id
                    );

                  return (
                    <div
                      className="friendCard"
                      key={person._id}
                    >

                      <img
                        src={
                          person.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            person.username
                          )}&background=random`
                        }
                        alt=""
                      />

                      <div className="friendInfo">

                        <h3>
                          {person.username}
                        </h3>

                        <p>
                          {person.email}
                        </p>

                      </div>


                      {alreadyFriend ? (

                        <button
                          className="statusButton"
                          disabled
                        >
                          <FaUserCheck />
                          Friends
                        </button>

                      ) : requestSent ? (

                        <button
                          className="statusButton pending"
                          disabled
                        >
                          <FaUserClock />
                          Pending
                        </button>

                      ) : (

                        <button
                          className="addFriendButton"
                          onClick={() =>
                            sendFriendRequest(
                              person._id
                            )
                          }
                        >
                          <FaUserPlus />
                          Add Friend
                        </button>

                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>


        {/* =================================
            FRIEND REQUESTS
        ================================= */}

        <section className="friendSection">

          <div className="sectionTitle">

            <FaUserPlus />

            <h2>
              Friend Requests
            </h2>

            {friendRequests.length >
              0 && (
              <span className="countBadge">
                {friendRequests.length}
              </span>
            )}

          </div>


          {friendRequests.length ===
            0 ? (

            <p className="emptyText">
              No pending friend requests.
            </p>

          ) : (

            <div className="requestList">

              {friendRequests.map(
                (request) => (

                  <div
                    className="friendCard"
                    key={request._id}
                  >

                    <img
                      src={
                        request.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          request.username
                        )}&background=random`
                      }
                      alt=""
                    />

                    <div className="friendInfo">

                      <h3>
                        {request.username}
                      </h3>

                      <p>
                        {request.email}
                      </p>

                    </div>

                    <button
                      className="acceptButton"
                      onClick={() =>
                        acceptFriendRequest(
                          request._id
                        )
                      }
                    >
                      <FaCheck />
                      Accept
                    </button>

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* =================================
            PENDING REQUESTS
        ================================= */}

        <section className="friendSection">

          <div className="sectionTitle">

            <FaUserClock />

            <h2>
              Pending Requests
            </h2>

            {sentRequests.length >
              0 && (
              <span className="countBadge">
                {sentRequests.length}
              </span>
            )}

          </div>


          {sentRequests.length ===
            0 ? (

            <p className="emptyText">
              You have no pending requests.
            </p>

          ) : (

            <div className="requestList">

              {sentRequests.map(
                (request) => {

                  const requestId =
                    typeof request ===
                    "string"
                      ? request
                      : request?._id;

                  const requestUser =
                    typeof request ===
                    "object"
                      ? request
                      : null;

                  return (
                    <div
                      className="friendCard"
                      key={requestId}
                    >

                      <img
                        src={
                          requestUser?.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            requestUser?.username ||
                              "User"
                          )}&background=random`
                        }
                        alt=""
                      />

                      <div className="friendInfo">

                        <h3>
                          {requestUser?.username ||
                            "Friend Request"}
                        </h3>

                        <p>
                          Waiting for
                          response
                        </p>

                      </div>

                      <button
                        className="statusButton pending"
                        disabled
                      >
                        <FaUserClock />
                        Pending
                      </button>

                    </div>
                  );
                }
              )}

            </div>

          )}

        </section>


        {/* =================================
            MY FRIENDS
        ================================= */}

        <section className="friendSection">

          <div className="sectionTitle">

            <FaUserCheck />

            <h2>
              My Friends
            </h2>

            <span className="countBadge">
              {friends.length}
            </span>

          </div>


          {filteredFriends.length ===
            0 ? (

            <p className="emptyText">
              You don't have any friends
              yet.
            </p>

          ) : (

            <div className="friendsList">

              {filteredFriends.map(
                (friend) => {

                  const isOnline =
                    onlineUsers.includes(
                      friend._id
                    );

                  return (

                    <div
                      className="friendCard"
                      key={friend._id}
                    >

                      <img
                        src={
                          friend.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            friend.username
                          )}&background=random`
                        }
                        alt=""
                      />


                      <div className="friendInfo">

                        <h3>
                          {friend.username}
                        </h3>

                        <p>

                          <FaCircle
                            color={
                              isOnline
                                ? "#22c55e"
                                : "#6b7280"
                            }
                            size={9}
                          />

                          {isOnline
                            ? " Online"
                            : " Offline"}

                        </p>

                      </div>


                      <button
                        className="chatBtn"
                        onClick={() =>
                          navigate(
                            `/chat/${friend._id}`
                          )
                        }
                        title="Open Chat"
                      >
                        <FaComments />
                      </button>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}