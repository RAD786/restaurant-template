import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:5000", // backend origin
});

// Attach token if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("admintoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
