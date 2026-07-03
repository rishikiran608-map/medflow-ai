import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname;
  // If accessing via local network IP (e.g., 10.10.11.154), point to the backend at the same IP
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1" && /^[0-9.]+$/.test(hostname)) {
    return `http://${hostname}:5000/api`;
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// Request interceptor to automatically inject authorization token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;