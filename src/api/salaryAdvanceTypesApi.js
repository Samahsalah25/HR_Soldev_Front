import api from "./axios";

// =============================
// GET ALL SALARY ADVANCE TYPES
// =============================
export const getSalaryAdvanceTypes = async () => {
  const response = await api.get("/salary_advance_types");

  return response.data;
};

// =============================
// GET SINGLE SALARY ADVANCE TYPE
// =============================
export const getSalaryAdvanceTypeById = async (id) => {
  const response = await api.get(`/salary_advance_types/${id}`);

  return response.data;
};

// =============================
// CREATE SALARY ADVANCE TYPE
// =============================
export const createSalaryAdvanceType = async (data) => {
  const response = await api.post("/salary_advance_types", data);

  return response.data;
};

// =============================
// UPDATE SALARY ADVANCE TYPE
// =============================
export const updateSalaryAdvanceType = async (id, data) => {
  const response = await api.put(`/salary_advance_types/${id}`, data);

  return response.data;
};

// =============================
// DELETE SALARY ADVANCE TYPE
// =============================
export const deleteSalaryAdvanceType = async (id) => {
  const response = await api.delete(`/salary_advance_types/${id}`);

  return response.data;
};