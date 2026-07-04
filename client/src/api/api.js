import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "/api";
  }
  return "https://medflow-ai.onrender.com/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

console.log("🔍 API Base URL is set to:", api.defaults.baseURL);

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