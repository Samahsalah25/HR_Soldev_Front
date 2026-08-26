import api from "./axios";

// Re-use the shared axios instance
const journalsApi = api;

/**
 * GET /accounting/journals
 * جلب كل دفاتر اليومية
 */
export async function getJournals() {
  const res = await journalsApi.get("/accounting/journals");
  return res.data?.journals || [];
}

/**
 * GET /accounting/journals/:id
 * جلب دفتر يومية واحد بالتفصيل
 */
export async function getJournal(id) {
  const res = await journalsApi.get(`/accounting/journals/${id}`);
  return res.data?.journal || {};
}

/**
 * POST /accounting/journals
 * إنشاء دفتر يومية جديد
 */
export async function createJournal(payload) {
  const res = await journalsApi.post("/accounting/journals", payload);
  return res.data?.journal || res.data;
}

/**
 * PUT /accounting/journals/:id
 * تعديل دفتر يومية موجود
 */
export async function updateJournal(id, payload) {
  const res = await journalsApi.put(`/accounting/journals/${id}`, payload);
  return res.data?.journal || res.data;
}

/**
 * DELETE /accounting/journals/:id
 * حذف دفتر يومية
 */
export async function deleteJournal(id) {
  const res = await journalsApi.delete(`/accounting/journals/${id}`);
  return res.data;
}

/**
 * GET /accounting/journals/:id/payment-methods
 * جلب طرق الدفع الخاصة بدفتر يومية معيّن (متسجل بالفعل وله ID حقيقي)
 *
 * شكل الرد:
 * {
 *   success: true,
 *   data: {
 *     inbound_methods: [{ id, name }],
 *     outbound_methods: [{ id, name }]
 *   }
 * }
 */
export async function getJournalPaymentMethods(journalId) {
  const res = await journalsApi.get(`/accounting/journals/${journalId}/payment-methods`);
  return {
    inbound: res.data?.data?.inbound_methods || [],
    outbound: res.data?.data?.outbound_methods || [],
  };
}

/**
 * GET /accounting/payment-methods
 * طرق الدفع العامة على مستوى النظام (Manual Payment inbound/outbound...)
 * تُستخدم للدفتر الجديد اللي لسه ماتسجلش (قبل ما يبقى له ID حقيقي)
 *
 * شكل الرد:
 * { success: true, payment_methods: [{ id, name, code, payment_type: "inbound" | "outbound" }] }
 */
export async function getGeneralPaymentMethods() {
  const res = await journalsApi.get("/accounting/payment-methods");
  const all = res.data?.payment_methods || [];
  return {
    inbound: all.filter((m) => m.payment_type === "inbound"),
    outbound: all.filter((m) => m.payment_type === "outbound"),
  };
}

/* ────────────────────────────────────────────────────────────────────────
   Accounts — تُستخدم في تعبئة الـ dropdowns جوه فورم الدفتر
   ──────────────────────────────────────────────────────────────────── */

/**
 * GET /accounting/accounts
 * جلب الحسابات (Generic) — ممكن تفلتري بـ account_type أو search
 *
 * @param {Object} params
 * @param {string} [params.account_type] - نوع الحساب (income, expense, asset_current, asset_cash...إلخ)
 * @param {string} [params.search] - بحث بالاسم أو الكود
 */
export async function getAccounts(params = {}) {
  const res = await journalsApi.get("/accounting/accounts", { params });
  return res.data?.accounts || [];
}

/**
 * كل الحسابات (بدون فلترة نوع) — بنفلتر client-side جوه الفورم
 * تُستخدم في: allowed_accounts (Access Control)، وأيضًا كمصدر عام لكل الـ dropdowns
 * بما فيها حسابات "Outstanding Receipts/Payments" (account_type = asset_current)
 */
export async function getAllAccounts(search = "") {
  return getAccounts({ search });
}

export async function getBankAccounts() {
  const res = await journalsApi.get("/accounting/bank-accounts");
  return res.data?.bank_accounts || [];
}