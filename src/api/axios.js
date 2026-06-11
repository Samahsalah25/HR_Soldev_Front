import axios from "axios";

const api = axios.create({
  baseURL: "https://carl-variance-african-humanities.trycloudflare.com/api/v1",
  
  withCredentials: true,
    xsrfCookieName: "session_id",
  xsrfHeaderName: "X-Session-Id",

  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
