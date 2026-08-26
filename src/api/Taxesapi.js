import api from "./axios";

const taxesApi = api;

/**
 * GET /accounting/taxes
 * جلب كل الضرائب
 */
export async function getTaxes() {
  const res = await taxesApi.get("/accounting/taxes");
  return res.data?.taxes || [];
}

/**
 * GET /accounting/taxes/:id
 * جلب ضريبة واحدة بالتفصيل
 */
export async function getTax(id) {
  const res = await taxesApi.get(`/accounting/taxes/${id}`);
  return res.data?.tax || {};
}

/**
 * POST /accounting/taxes
 * إنشاء ضريبة جديدة
 */
export async function createTax(payload) {
  const res = await taxesApi.post("/accounting/taxes", payload);
  return res.data?.tax || res.data;
}

/**
 * PUT /accounting/taxes/:id
 * تعديل ضريبة موجودة
 */
export async function updateTax(id, payload) {
  const res = await taxesApi.put(`/accounting/taxes/${id}`, payload);
  return res.data?.tax || res.data;
}

/**
 * DELETE /accounting/taxes/:id
 * حذف ضريبة
 */
export async function deleteTax(id) {
  const res = await taxesApi.delete(`/accounting/taxes/${id}`);
  return res.data;
}