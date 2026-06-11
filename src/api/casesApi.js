import api from "./axios";

// =============================
// GET ALL CASES
// =============================
export const getCases = async () => {
  const response = await api.get("/cases");

  return response.data;
};

// =============================
// GET SINGLE CASE
// =============================
export const getCaseById = async (id) => {
  const response = await api.get(`/cases/${id}`);

  return response.data;
};

// =============================
// CREATE CASE
// =============================
export const createCase = async (data) => {
  const response = await api.post("/cases", data);

  return response.data;
};

// =============================
// UPDATE CASE
// =============================
export const updateCase = async (id, data) => {
  const response = await api.put(`/cases/${id}`, data);

  return response.data;
};

// =============================
// DELETE CASE
// =============================
export const deleteCase = async (id) => {
  const response = await api.delete(`/cases/${id}`);

  return response.data;
};