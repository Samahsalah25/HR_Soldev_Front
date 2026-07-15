import api from "./axios";

const accountingApi = api;

/**
 * GET all accounts
 */
export async function getAccounts() {
  const res = await accountingApi.get(
    "/salary/accounting/accounts"
  );
  return res.data?.accounts || [];
}

/**
 * CREATE account
 */
export async function createAccount(payload) {
  const res = await accountingApi.post(
    "/salary/accounting/accounts",
    payload
  );
  return res.data;
}

/**
 * UPDATE account
 */
export async function updateAccount(id, payload) {
  const res = await accountingApi.put(
    `/salary/accounting/accounts/${id}`,
    payload
  );
  return res.data;
}

/**
 * DELETE account
 */
export async function deleteAccount(id) {
  const res = await accountingApi.delete(
    `/salary/accounting/accounts/${id}`
  );
  return res.data;
}

/**
 * GET KPIs
 */
export async function getAccountsKPIs() {
  const res = await accountingApi.get(
    "/salary/accounting/accounts"
  );
  return res.data?.kpis || {};
}




/* ===========================
   Daily Journal
=========================== */


// جلب كل القيود اليومية + الـ KPIs
export async function getDailyEntries() {
  const res = await accountingApi.get("/salary/accounting/daily-limits");
  return res.data; // { success, kpis, entries }
}

// إنشاء قيد جديد (مسودة أو ترحيل مباشر)
// payload: { date, reference, description, action: "draft" | "post", lines: [{account_id, description, debit, credit}] }
export async function createDailyEntry(payload) {
  const res = await accountingApi.post("/salary/accounting/daily-limits", payload);
  return res.data;
}

// تعديل قيد موجود (قبل الترحيل غالبًا)
// نفس شكل payload بتاع createDailyEntry
export async function updateDailyEntry(id, payload) {
  const res = await accountingApi.put(`/salary/accounting/daily-limits/${id}`, payload);
  return res.data;
}

// ترحيل قيد (تحويله من مسودة إلى مرحّل)
export async function postDailyEntry(id) {
  const res = await accountingApi.post(`/salary/accounting/daily-limits/${id}/post`);
  return res.data;
}

// عكس قيد مرحّل
export async function reverseDailyEntry(id) {
  const res = await accountingApi.post(`/salary/accounting/daily-limits/${id}/reverse`);
  return res.data;
}

// رفع مرفق لقيد موجود
export async function uploadDailyEntryAttachment(id, file) {
  const formData = new FormData();
  formData.append("attachment", file);
  const res = await accountingApi.post(
    `/salary/accounting/daily-limits/${id}/attachment`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}




/* ===========================
   Vouchers (سندات القبض والدفع)
=========================== */

// جلب كل السندات + KPIs
export async function getVouchers() {
  const res = await accountingApi.get("/salary/accounting/vouchers");
  return res.data; // { success, kpis, vouchers }
}

// إنشاء سند قبض
// payload: { date, payment_type, customer_number, account_id, bank_account_id, amount, description, action: "draft" | "post" }
export async function createReceiptVoucher(payload) {
  const res = await accountingApi.post("/salary/accounting/vouchers/receipt", payload);
  return res.data;
}

// إنشاء سند دفع (نفس شكل الـ payload)
export async function createPaymentVoucher(payload) {
  const res = await accountingApi.post("/salary/accounting/vouchers/payment", payload);
  return res.data;
}

// تعديل سند موجود
export async function updateVoucher(id, payload) {
  const res = await accountingApi.put(`/salary/accounting/vouchers/${id}`, payload);
  return res.data;
}

// اعتماد وترحيل سند (تحويله من مسودة إلى معتمد + إنشاء قيد تلقائي في السيرفر)
export async function postVoucher(id) {
  const res = await accountingApi.post(`/salary/accounting/vouchers/${id}/post`);
  return res.data;
}

// إلغاء سند
export async function cancelVoucher(id) {
  const res = await accountingApi.post(`/salary/accounting/vouchers/${id}/cancel`);
  return res.data;
}

// رفع مرفق لسند
export async function uploadVoucherAttachment(id, file) {
  const formData = new FormData();
  formData.append("attachment", file);
  const res = await accountingApi.post(
    `/salary/accounting/vouchers/${id}/attachment`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}




/* ===========================
   Trial Balance (ميزان المراجعة)
=========================== */

// جلب ميزان المراجعة
// params: { date_from, date_to, hide_inactive_accounts }
export async function getTrialBalance(params = {}) {
  const res = await accountingApi.get("/salary/accounting/trial-balance", {
    params,
  });
  return res.data;
  // { success, date_from, date_to, hide_inactive_accounts, is_balanced, grand_totals, trial_balance }
}




/* ===========================
   Income Statement (قائمة الدخل)
=========================== */

// جلب قائمة الدخل
// params: { date_from, date_to }
export async function getIncomeStatement(params = {}) {
  const res = await accountingApi.get("/salary/accounting/income-statement", {
    params,
  });
  return res.data;
  // { success, date_from, date_to, total_revenues, total_expenses, net_profit, revenues, expenses }
}

/* ===========================
   Balance Sheet (الميزانية العمومية)
=========================== */

// جلب الميزانية العمومية
// params: { date_from, date_to }
export async function getBalanceSheet(params = {}) {
  const res = await accountingApi.get("/salary/accounting/balance-sheet", {
    params,
  });
  return res.data;
  // { success, date_from, date_to, assets_card, commitments_property_rights_card }
}