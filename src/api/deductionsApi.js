// src/api/deductionsApi.js

import api from "./axios";

// ==========================
// GET ALL DEDUCTIONS
// ==========================
export const getDeductions = async () => {
  const res = await api.get("/deductions");
  return res.data;
};

// ==========================
// GET UNDER APPROVAL
// ==========================
export const getUnderApprovalDeductions = async () => {
  const res = await api.get("/deductions/under-approval");
  return res.data;
};

// ==========================
// GET ONE
// ==========================
export const getDeduction = async (id) => {
  const res = await api.get(`/deductions/${id}`);
  return res.data;
};

// ==========================
// CREATE
// ==========================
export const createDeduction = async (data) => {
  const res = await api.post("/deductions", data);
  return res.data;
};

// ==========================
// UPDATE
// ==========================
export const updateDeduction = async (id, data) => {
  const res = await api.put(`/deductions/${id}`, data);
  return res.data;
};

// ==========================
// DELETE
// ==========================
export const deleteDeduction = async (id) => {
  const res = await api.delete(`/deductions/${id}`);
  return res.data;
};