import api from "./axios";

// =============================
// GET ALL CONTRACTS
// =============================
export const getContracts = async () => {
  const response = await api.get("/storage/contracts");

  return response.data;
};

// =============================
// GET SINGLE CONTRACT
// =============================
export const getContractById = async (id) => {
  const response = await api.get(`/storage/contracts/${id}`);

  return response.data;
};

// =============================
// RENEW CONTRACT
// =============================
export const renewContract = async (id) => {
  const response = await api.post(`/storage/contracts/${id}/renew`);

  return response.data;
};

// =============================
// STOP AUTO RENEWAL
// =============================
export const stopRenewalContract = async (id) => {
  const response = await api.post(`/storage/contracts/${id}/stop-renewal`);

  return response.data;
};



// =============================
// GET ALL INVOICES
// =============================
export const getInvoices = async () => {
  const response = await api.get("/storage/invoices");

  return response.data;
};

// =============================
// GET SINGLE INVOICE
// =============================
export const getInvoiceById = async (id) => {
  const response = await api.get(`/storage/invoices/${id}`);

  return response.data;
};

// =============================
// PAY INVOICE
// =============================
export const payInvoice = async (id) => {
  const response = await api.post(`/storage/invoices/${id}/pay`);

  return response.data;
};