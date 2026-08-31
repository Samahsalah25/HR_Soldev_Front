import api from "./axios";

// ======================
// GET ALL VIOLATIONS
// ======================
export const getViolations = async (params = {}) => {
  const res = await api.get("/violations", { params });
  return res.data;
};

// ======================
// GET VIOLATION BY ID
// ======================
export const getViolation = async (id) => {
  const res = await api.get(`/violations/${id}`);
  return res.data;
};

// ======================
// CREATE VIOLATION
// ======================
export const createViolation = async (violationData) => {
  const res = await api.post(
    "/violations",
    violationData
  );

  return res.data;
};

// ======================
// UPDATE VIOLATION
// ======================
export const updateViolation = async (
  id,
  violationData
) => {
  const res = await api.put(
    `/violations/${id}`,
    violationData
  );

  return res.data;
};

// ======================
// DELETE VIOLATION
// ======================
export const deleteViolation = async (id) => {
  const res = await api.delete(
    `/violations/${id}`
  );

  return res.data;
};