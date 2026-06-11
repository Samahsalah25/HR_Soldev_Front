import api from "./axios";

// ==========================
// GET ALL
// ==========================
export const getAttendance = async (date) => {
  const res = await api.get("/attendance", {
    params: { date }
  });
  return res.data;
};

// ==========================
// GET ONE
// ==========================
export const getAttendanceById = async (id) => {
  const res = await api.get(`/attendance/${id}`);
  return res.data;
};

// ==========================
// CREATE
// ==========================
export const createAttendance = async (data) => {
  const res = await api.post("/attendance", data);
  return res.data;
};

// ==========================
// UPDATE
// ==========================
export const updateAttendance = async (id, data) => {
  const res = await api.put(`/attendance/${id}`, data);
  return res.data;
};

// ==========================
// DELETE
// ==========================
export const deleteAttendance = async (id) => {
  const res = await api.delete(`/attendance/${id}`);
  return res.data;
};

// ==========================
// CHECK IN
// ==========================
export const checkInAttendance = async (data) => {
  const res = await api.post("/attendance/check-in", data);
  return res.data;
};

// ==========================
// CHECK OUT
// ==========================
export const checkOutAttendance = async (data) => {
  const res = await api.post("/attendance/checkout", data);
  return res.data;
};