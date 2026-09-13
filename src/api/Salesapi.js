import api from "./axios";

// =============================
// GET CUSTOMERS (partner_id للمبيعات)
// =============================
export const getCustomers = async () => {
  const res = await api.get("/customers");
  return res.data?.data ?? res.data ?? [];
};

// =============================
// GET SALE PRODUCTS (type=sale)
// =============================
export const getSaleProducts = async () => {
  const res = await api.get("/accounting/products", { params: { type: "sale" } });
  return res.data?.products ?? res.data ?? [];
};

// =============================
// GET PROJECTS (نفس المشاريع المستخدمة في المشتريات)
// =============================
export const getProjects = async () => {
  const res = await api.get("/projects");
  return res.data?.data ?? res.data ?? [];
};

// =============================
// GET ALL SALE ORDERS
// =============================
export const getSales = async (params = {}) => {
  const res = await api.get("/sales", { params });
  return res.data;
};

// =============================
// GET ONE SALE ORDER
// =============================
export const getSale = async (id) => {
  const res = await api.get(`/sales/${id}`);
  return res.data?.data ?? res.data;
};

// =============================
// CREATE SALE ORDER
// =============================
export const createSale = async (formData) => {
  const res = await api.post("/sales", formData);
  return res.data?.data ?? res.data;
};

// =============================
// CONFIRM / CANCEL / CREATE INVOICE
// =============================
export const confirmSale = async (id) => {
  const res = await api.post(`/sales/${id}/confirm`);
  return res.data;
};

export const cancelSale = async (id) => {
  const res = await api.post(`/sales/${id}/cancel`);
  return res.data;
};

export const createInvoiceFromSale = async (id) => {
  const res = await api.post(`/sales/${id}/create_invoice`);
  return res.data;
};
// =============================
// DELETE SALE ORDER
// =============================
export const deleteSale = async (id) => {
  const res = await api.delete(`/sales/${id}`);
  return res.data;
};