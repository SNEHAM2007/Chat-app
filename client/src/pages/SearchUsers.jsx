import { useState } from "react";
import API from "../api/authApi";

export default function SearchUsers() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);

  const handleSearch = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(
        `/users/search?query=${query}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  const sendRequest = async (id) => {
  try {
    const token =
      localStorage.getItem("token");

    const res = await API.post(
      `/users/request/${id}`,
      {},
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    alert(res.data.message);
  } catch (error) {
    alert(
      error.response?.data?.message
    );
  }
};

  return (
    <div>
      <h1>Search Users</h1>

      <input
        type="text"
        placeholder="Search User"
        value={query}
        onChange={(e) =>
          setQuery(e.target.value)
        }
      />

      <button onClick={handleSearch}>
        Search
      </button>

      <hr />

    {users.map((user) => (
  <div key={user._id}>
    <h3>{user.username}</h3>

    <p>{user.email}</p>

    <button
      onClick={() =>
        sendRequest(user._id)
      }
    >
      Send Request
    </button>
  </div>
))}
    </div>
  );
}