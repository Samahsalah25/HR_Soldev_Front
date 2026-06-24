import api from "./axios";

// =============================
// CREATE END OF SERVICE REQUEST
// =============================
export const createEndOfService = async (formData) => {
  const res = await api.post("/end_of_service", formData);
  return res.data;
};


export const getEndOfService = async () => {
  const res = await api.get("/end_of_service");
  return res.data;
};