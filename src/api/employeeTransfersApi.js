import api from "./axios";

// ======================
// GET ALL EMPLOYEE TRANSFERS
// ======================
export const getEmployeeTransfers = async () => {
  const res = await api.get("/employee_transfers");
  return res.data;
};

// ======================
// GET SINGLE TRANSFER
// ======================
export const getEmployeeTransfer = async (id) => {
  const res = await api.get(`/employee_transfers/${id}`);
  return res.data;
};

// ======================
// CREATE TRANSFER
// ======================
export const createEmployeeTransfer = async (data) => {
  const res = await api.post("/employee_transfers", data);
  return res.data;
};

// ======================
// UPDATE TRANSFER
// ======================
export const updateEmployeeTransfer = async (id, data) => {
  const res = await api.put(`/employee_transfers/${id}`, data);
  return res.data;
};

// ======================
// DELETE TRANSFER
// ======================
export const deleteEmployeeTransfer = async (id) => {
  const res = await api.delete(`/employee_transfers/${id}`);
  return res.data;
};