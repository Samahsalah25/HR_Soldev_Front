import api from "./axios";

const paymentTermsApi = api;

/**
 * GET /accounting/payment-terms
 * جلب كل شروط الدفع
 */
export async function getPaymentTerms() {
  const res = await paymentTermsApi.get("/accounting/payment-terms");
  return res.data?.payment_terms || [];
}

/**
 * GET /accounting/payment-terms/:id
 * جلب شرط دفع واحد بالتفصيل
 */
export async function getPaymentTerm(id) {
  const res = await paymentTermsApi.get(`/accounting/payment-terms/${id}`);
  return res.data?.payment_term || {};
}

/**
 * POST /accounting/payment-terms
 * إنشاء شرط دفع جديد
 */
export async function createPaymentTerm(payload) {
  const res = await paymentTermsApi.post("/accounting/payment-terms", payload);
  return res.data?.payment_term || res.data;
}

/**
 * PUT /accounting/payment-terms/:id
 * تعديل شرط دفع موجود
 */
export async function updatePaymentTerm(id, payload) {
  const res = await paymentTermsApi.put(`/accounting/payment-terms/${id}`, payload);
  return res.data?.payment_term || res.data;
}

/**
 * DELETE /accounting/payment-terms/:id
 * حذف شرط دفع
 */
export async function deletePaymentTerm(id) {
  const res = await paymentTermsApi.delete(`/accounting/payment-terms/${id}`);
  return res.data;
}