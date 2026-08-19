import axios from "axios";

const API = axios.create({
  baseURL: "https://chat-app-1-rzbm.onrender.com/api",
});

export default API;