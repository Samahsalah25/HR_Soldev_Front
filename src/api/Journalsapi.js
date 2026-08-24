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
 * جلب طرق الدفع المتاحة لدفتر يومية معيّن (Incoming/Outgoing)
 * بترجع IDs تستخدم في inbound_payment_method_line_ids و outbound_payment_method_line_ids
 */
export async function getJournalPaymentMethods(journalId) {
  const res = await journalsApi.get(`/accounting/journals/${journalId}/payment-methods`);
  return res.data?.payment_methods || res.data;
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
 * حسابات الإيرادات (account_type = income) — تُستخدم في:
 * - income_account (دفاتر المبيعات)
 * - profit_account (دفاتر النقدية/البنك)
 */
export async function getIncomeAccounts(search = "") {
  return getAccounts({ account_type: "income", search });
}

/**
 * حسابات المصروفات (account_type = expense) — تُستخدم في:
 * - expense_account (دفاتر المشتريات)
 * - loss_account (دفاتر النقدية/البنك)
 */
export async function getExpenseAccounts(search = "") {
  return getAccounts({ account_type: "expense", search });
}

/**
 * حسابات الأصول المتداولة (account_type = asset_current) — تُستخدم في:
 * - suspense_account (الحساب المعلق لدفاتر النقدية/البنك)
 */
export async function getCurrentAssetAccounts(search = "") {
  return getAccounts({ account_type: "asset_current", search });
}

/**
 * حسابات البنك/الصندوق (account_type = asset_cash) — تُستخدم في:
 * - cash_bank_account (حساب الدفتر نفسه لدفاتر cash/bank/credit_card)
 */
export async function getBankAndCashAccounts(search = "") {
  return getAccounts({ account_type: "asset_cash", search });
}

/**
 * كل الحسابات (بدون فلترة نوع) — تُستخدم في:
 * - allowed_accounts (Access Control) في تاب الإعدادات المتقدمة
 */
export async function getAllAccounts(search = "") {
  return getAccounts({ search });
}