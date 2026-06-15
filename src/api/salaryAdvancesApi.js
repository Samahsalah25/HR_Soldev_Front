import api from "./axios";

// =============================
// GET ALL SALARY ADVANCES
// =============================
export const getSalaryAdvances = async () => {
  const response = await api.get("/salary_advances");

  return response.data;
};

// =============================
// GET SINGLE SALARY ADVANCE
// =============================
export const getSalaryAdvanceById = async (id) => {
  const response = await api.get(`/salary_advances/${id}`);

  return response.data;
};

// =============================
// GET ACTIVE SALARY ADVANCES
// =============================
export const getActiveSalaryAdvances = async () => {
  const response = await api.get("/salary_advances/active");

  return response.data;
};

// =============================
// CREATE SALARY ADVANCE
// =============================
export const createSalaryAdvance = async (formData) => {
  const response = await api.post(
    "/salary_advances",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

// =============================
// UPDATE SALARY ADVANCE ACTION
// =============================
export const updateSalaryAdvance = async (
  id,
  action,
  rejection_reason = null
) => {
  const payload = {
    action,
  };

  if (rejection_reason) {
    payload.rejection_reason = rejection_reason;
  }

  const response = await api.put(
    `/salary_advances/${id}`,
    payload
  );

  return response.data;
};

// =============================
// DELETE SALARY ADVANCE
// =============================
export const deleteSalaryAdvance = async (id) => {
  const response = await api.delete(
    `/salary_advances/${id}`
  );

  return response.data;
};

// =============================
// GET ADVANCE DOCUMENT
// =============================
export const getSalaryAdvanceDocument = async (id) => {
  const response = await api.get(
    `/salary_advances/${id}/document`,
    {
      responseType: "blob",
    }
  );

  return response;
};

// =============================
// GET INSTALLMENTS
// =============================
export const getSalaryAdvanceInstallments = async (id) => {
  const response = await api.get(
    `/salary_advances/${id}/installments`
  );

  return response.data;
};

// =============================
// PAY INSTALLMENT
// =============================
export const payInstallment = async (advanceId, installmentId) => {
  if (!installmentId) {
    throw new Error("installmentId is missing");
  }

  const response = await api.post(
    `/salary_advances/${advanceId}/installment/${installmentId}/pay`
  );

  return response.data;
};;

// =============================
// DELAY INSTALLMENT
// =============================
export const delayInstallment = async (
  advanceId,
  installmentId,
  new_due_date
) => {
  const response = await api.post(
    `/salary_advances/${advanceId}/installment/${installmentId}/delay`,
    {
      new_due_date,
    }
  );

  return response.data;
};

// =============================
// EARLY PAY INSTALLMENT
// =============================
export const earlyPayInstallment = async (
  advanceId,
  installmentId,
  new_due_date
) => {
  const response = await api.post(
    `/salary_advances/${advanceId}/installment/${installmentId}/early_pay`,
    {
      new_due_date,
    }
  );

  return response.data;
};

export const getAllInstallments = async () => {
  const response = await api.get("/salary_advances/installments");
  return response.data;
};
// =============================
// GET SALARY ADVANCE HISTORY
// =============================
export const getSalaryAdvanceHistory = async (id) => {
  const response = await api.get(
    `/salary_advances/${id}/history`
  );

  return response.data;
};