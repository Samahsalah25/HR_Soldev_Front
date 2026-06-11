import api from "./axios";

// LOGIN
export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);

  return response.data;
};

// GET CURRENT USER
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

// LOGOUT
export const logoutUser = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};

// GOOGLE LOGIN
export const googleLoginUser = async (id_token) => {
  const response = await api.post("/auth/google", {
    id_token,
  });

  return response.data;
};