import api from "./axios";

// =============================
// GET DEPARTURE REASONS
// =============================
export const getDepartureReasons = async () => {
  const res = await api.get("/departure_reasons");
  return res.data;
};

// =============================
// GET ALL END OF SERVICE REQUESTS
// =============================
export const getEndOfService = async (params = {}) => {
  const res = await api.get("/end_of_service", { params });
  return res.data;
};

// =============================
// CREATE END OF SERVICE REQUEST
// =============================
export const createEndOfService = async (formData) => {
  const res = await api.post("/end_of_service", formData);
  return res.data;
};

// =============================
// APPROVE / REJECT EOS REQUEST
// =============================
export const eosAction = async (id, action, notes = "") => {
  const res = await api.post(`/end_of_service/${id}/action`, {
    action,
    notes,
  });
  return res.data;
};