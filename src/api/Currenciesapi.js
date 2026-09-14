import api from "./axios";

const currenciesApi = api;

/**
 * GET /accounting/currencies
 * جلب كل العملات
 */
export async function getCurrencies(params = {}) {
  const res = await currenciesApi.get("/accounting/currencies", { params });
  return res.data?.currencies || [];
}

/**
 * GET /accounting/currencies/:id
 * جلب عملة واحدة بالتفصيل
 */
export async function getCurrency(id) {
  const res = await currenciesApi.get(`/accounting/currencies/${id}`);
  return res.data?.currency || {};
}

/**
 * POST /accounting/currencies
 * إنشاء عملة جديدة
 */
export async function createCurrency(payload) {
  const res = await currenciesApi.post("/accounting/currencies", payload);
  return res.data?.currency || res.data;
}

/**
 * PUT /accounting/currencies/:id
 * تعديل عملة موجودة
 */
export async function updateCurrency(id, payload) {
  const res = await currenciesApi.put(`/accounting/currencies/${id}`, payload);
  return res.data?.currency || res.data;
}

/**
 * DELETE /accounting/currencies/:id
 * حذف عملة
 */
export async function deleteCurrency(id) {
  const res = await currenciesApi.delete(`/accounting/currencies/${id}`);
  return res.data;
}
