// src/api/additionsApi.js

import api from "./axios";

// ==========================
// GET ALL ADDITIONS
// ==========================
export const getAdditions = async (params = {}) => {
  const res = await api.get("/additions", { params });
  return res.data;
};

// ==========================
// GET UNDER APPROVAL
// ==========================
export const getUnderApprovalAdditions = async () => {
  const res = await api.get("/additions/under-approval");
  return res.data;
};

// ==========================
// GET ONE
// ==========================
export const getAddition = async (id) => {
  const res = await api.get(`/additions/${id}`);
  return res.data;
};

// ==========================
// CREATE
// ==========================
export const createAddition = async (data) => {
  const res = await api.post("/additions", data);

  return res.data;
};

// ==========================
// UPDATE
// ==========================
export const updateAddition = async (id, data) => {
  const res = await api.put(`/additions/${id}`, data);

  return res.data;
};

// ==========================
// DELETE
// ==========================
export const deleteAddition = async (id) => {
  const res = await api.delete(`/additions/${id}`);

  return res.data;
};