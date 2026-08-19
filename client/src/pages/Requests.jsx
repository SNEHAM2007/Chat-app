import { useEffect, useState } from "react";
import API from "../api/authApi";

export default function Requests() {
  const [requests, setRequests] =
    useState([]);

  const token =
    localStorage.getItem("token");

  const loadRequests = async () => {
    const res = await API.get(
      "/users/requests",
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    setRequests(res.data);
  };

  const acceptRequest = async (
    id
  ) => {
    await API.post(
      `/users/accept/${id}`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    loadRequests();
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div>
      <h1>
        Friend Requests
      </h1>

      {requests.map((user) => (
        <div key={user._id}>
          <h3>
            {user.username}
          </h3>

          <button
            onClick={() =>
              acceptRequest(
                user._id
              )
            }
          >
            Accept
          </button>
        </div>
      ))}
    </div>
  );
}