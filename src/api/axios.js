import axios from "axios";

const api = axios.create({
  baseURL: "https://207.180.213.61/api/v1/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
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
