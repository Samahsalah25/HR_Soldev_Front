import api from "./axios";

const BASE = "/requests";

/* =========================

   COMPLAINT
========================= */
export const createComplaint = async (data) => {
  const response = await api.post(`${BASE}/complaint`, data);
  return response.data;
};
export const getAllRequests = async () => {
  const response = await api.get(`${BASE}`);
  return response.data;
};
/* =========================
   APPEAL
========================= */
export const createAppeal = async (data) => {
  const response = await api.post(`${BASE}/appeal`, data);
  return response.data;
};

/* =========================
   ALLOWANCE
========================= */
export const createAllowance = async (data) => {
  const response = await api.post(`${BASE}/allowance`, data);
  return response.data;
};

/* =========================
   EXPENSE
========================= */
export const createExpense = async (data) => {
  const response = await api.post(`${BASE}/expense`, data);
  return response.data;
};

/* =========================
   (OPTIONAL) GET REQUESTS
   لو عندك endpoint للـ listing
========================= */
export const getRequests = async () => {
  const response = await api.get(`${BASE}`);
  return response.data;
};

/* =========================
   (OPTIONAL) UPDATE STATUS
========================= */
export const updateRequestStatus = async (id, status) => {
  const response = await api.put(`${BASE}/${id}/status`, { status });
  return response.data;
};
export const requestAction = async (id, action) => {
  const response = await api.post(`${BASE}/${id}/action`, {
    action, // "accept" | "reject"
  });

  return response.data;
};