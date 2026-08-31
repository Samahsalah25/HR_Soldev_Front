import api from "./axios";

// =============================
// GET ALL BRANCHES
// =============================
export const getBranches = async (params = {}) => {
  const response = await api.get("/branches", { params });

  return response.data;
};

// =============================
// GET SINGLE BRANCH
// ========================ش=====
export const getBranchById = async (id) => {
  const response = await api.get(`/branches/${id}`);

  return response.data;
};

// =============================
// CREATE BRANCH
// =============================
export const createBranch = async (data) => {
  const response = await api.post("/branches", data);

  return response.data;
};

// =============================
// UPDATE BRANCH
// =============================
export const updateBranch = async (id, data) => {
  const response = await api.put(`/branches/${id}`, data);

  return response.data;
};

// =============================
// DELETE BRANCH
// =============================
export const deleteBranch = async (id) => {
  const response = await api.delete(`/branches/${id}`);

  return response.data;
};