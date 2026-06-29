import axios from "axios";

const api = axios.create({
  baseURL: "https://undelved-semiacademical-roxann.ngrok-free.dev/api/v1",
  withCredentials: true,
  xsrfCookieName: "session_id",
  xsrfHeaderName: "X-Session-Id",
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true", // أضيفي ده
  },
});

// Attach token from localStorage on every request (if present)
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      // The login response stores the session token in the "id" field
      const token = user?.token || user?.access_token || user?.accessToken || user?.id;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch (_) {
    // ignore JSON parse errors
  }
  return config;
});

export default api;
