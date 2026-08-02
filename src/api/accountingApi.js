import api from "./axios";

const accountingApi = api;

/**
 * GET all accounts
 */
export async function getAccounts() {
  const res = await accountingApi.get(
    "/accounting/accounts"
  );
  return res.data?.accounts || [];
}

/**
 * CREATE account
 */
export async function createAccount(payload) {
  const res = await accountingApi.post(
    "/accounting/accounts",
    payload
  );
  return res.data;
}

/**
 * UPDATE account
 */
export async function updateAccount(id, payload) {
  const res = await accountingApi.put(
    `/accounting/accounts/${id}`,
    payload
  );
  return res.data;
}

/**
 * DELETE account
 */
export async function deleteAccount(id) {
  const res = await accountingApi.delete(
    `/accounting/accounts/${id}`
  );
  return res.data;
}

/**
 * GET KPIs
 */
export async function getAccountsKPIs() {
  const res = await accountingApi.get(
    "/accounting/accounts"
  );
  return res.data?.kpis || {};
}




/* ===========================
   Daily Journal
=========================== */


// جلب كل القيود اليومية + الـ KPIs
export async function getDailyEntries() {
  const res = await accountingApi.get("/accounting/daily-limits");
  return res.data; // { success, kpis, entries }
}

// إنشاء قيد جديد (مسودة أو ترحيل مباشر)
// payload: { date, reference, description, action: "draft" | "post", lines: [{account_id, description, debit, credit}] }
export async function createDailyEntry(payload) {
  const res = await accountingApi.post("/accounting/daily-limits", payload);
  return res.data;
}

// تعديل قيد موجود (قبل الترحيل غالبًا)
// نفس شكل payload بتاع createDailyEntry
export async function updateDailyEntry(id, payload) {
  const res = await accountingApi.put(`/accounting/daily-limits/${id}`, payload);
  return res.data;
}

// ترحيل قيد (تحويله من مسودة إلى مرحّل)
export async function postDailyEntry(id) {
  const res = await accountingApi.post(`/accounting/daily-limits/${id}/post`);
  return res.data;
}

// عكس قيد مرحّل
export async function reverseDailyEntry(id, reason) {
  const res = await accountingApi.post(`/accounting/daily-limits/${id}/reverse`, { reason });
  return res.data;
}

// رفع مرفق لقيد موجود
export async function uploadDailyEntryAttachment(id, file) {
  const formData = new FormData();
  formData.append("attachment", file);
  const res = await accountingApi.post(
    `/accounting/daily-limits/${id}/attachment`,
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
  const res = await accountingApi.get("/accounting/vouchers");
  return res.data; // { success, kpis, vouchers }
}

// إنشاء سند قبض
// payload: { date, payment_type, customer_number, account_id, bank_account_id, amount, description, action: "draft" | "post" }
export async function createReceiptVoucher(payload) {
  const res = await accountingApi.post("/accounting/vouchers/receipt", payload);
  return res.data;
}

// إنشاء سند دفع (نفس شكل الـ payload)
export async function createPaymentVoucher(payload) {
  const res = await accountingApi.post("/accounting/vouchers/payment", payload);
  return res.data;
}

// تعديل سند موجود
export async function updateVoucher(id, payload) {
  const res = await accountingApi.put(`/accounting/vouchers/${id}`, payload);
  return res.data;
}

// اعتماد وترحيل سند (تحويله من مسودة إلى معتمد + إنشاء قيد تلقائي في السيرفر)
export async function postVoucher(id) {
  const res = await accountingApi.post(`/accounting/vouchers/${id}/post`);
  return res.data;
}

// تحقق من السند
export async function validateVoucher(id) {
  const res = await accountingApi.post(`/accounting/vouchers/${id}/validate`);
  return res.data;
}

// تعليم السند كمُرسَل
export async function markVoucherAsSent(id) {
  const res = await accountingApi.post(`/accounting/vouchers/${id}/mark-as-sent`);
  return res.data;
}

// إلغاء تعليم السند كمُرسَل
export async function unmarkVoucherAsSent(id) {
  const res = await accountingApi.post(`/accounting/vouchers/${id}/unmark-as-sent`);
  return res.data;
}

// إرجاع السند لمسودة
export async function resetVoucherToDraft(id) {
  const res = await accountingApi.post(`/accounting/vouchers/${id}/reset-to-draft`);
  return res.data;
}

// إلغاء سند
export async function cancelVoucher(id) {
  const res = await accountingApi.post(`/accounting/vouchers/${id}/cancel`);
  return res.data;
}

// رفض سند
export async function rejectVoucher(id) {
  const res = await accountingApi.post(`/accounting/vouchers/${id}/reject`);
  return res.data;
}

// رفع مرفق لسند
export async function uploadVoucherAttachment(id, file) {
  const formData = new FormData();
  formData.append("attachment", file);
  const res = await accountingApi.post(
    `/accounting/vouchers/${id}/attachment`,
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
  const res = await accountingApi.get("/accounting/trial-balance", {
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
  const res = await accountingApi.get("/accounting/income-statement", {
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
  const res = await accountingApi.get("/accounting/balance-sheet", {
    params,
  });
  return res.data;
  // { success, date_from, date_to, assets_card, commitments_property_rights_card }
}

/* ===========================
   Customers (العملاء — partners)
=========================== */

// جلب كل العملاء
export async function getCustomers() {
  const res = await accountingApi.get("/accounting/partners", {
    params: { type: "customer" },
  });
  return res.data?.partners || [];
}

// جلب عميل واحد
export async function getCustomerById(id) {
  const res = await accountingApi.get(`/accounting/partners/${id}`);
  return res.data?.partner || null;
}

// إنشاء عميل جديد
export async function createCustomer(payload) {
  const res = await accountingApi.post("/accounting/partners", payload);
  return res.data;
}

// تعديل عميل
export async function updateCustomer(id, payload) {
  const res = await accountingApi.put(`/accounting/partners/${id}`, payload);
  return res.data;
}

/* ===========================
   Customer Invoices (فواتير العملاء)
=========================== */

// جلب كل فواتير العملاء
export async function getInvoices(type = "out_invoice") {
  const res = await accountingApi.get("/accounting/invoices", {
    params: { type },
  });
  return res.data?.invoices || [];
}

// إنشاء فاتورة عميل جديدة
export async function createInvoice(payload) {
  const res = await accountingApi.post("/accounting/invoices", payload);
  return res.data;
}

// تعديل فاتورة (قبل الترحيل غالبًا)
export async function updateInvoice(id, payload) {
  const res = await accountingApi.put(`/accounting/invoices/${id}`, payload);
  return res.data;
}

// اعتماد وترحيل الفاتورة
export async function confirmInvoice(id) {
  const res = await accountingApi.post(`/accounting/invoices/${id}/post`);
  return res.data;
}

// إرجاع الفاتورة لمسودة
export async function resetInvoiceToDraft(id) {
  const res = await accountingApi.post(`/accounting/invoices/${id}/reset-to-draft`);
  return res.data;
}

// إلغاء الفاتورة
export async function cancelInvoice(id) {
  const res = await accountingApi.post(`/accounting/invoices/${id}/cancel`);
  return res.data;
}

// تسجيل دفعة على الفاتورة
// payload: { journal_id, amount, memo, payment_method_line_id }
export async function registerInvoicePayment(id, payload) {
  const res = await accountingApi.post(`/accounting/invoices/${id}/register-payment`, payload);
  return res.data;
}

// إصدار إشعار دائن للفاتورة
// payload: { reason, date, journal_id }
export async function creditNoteInvoice(id, payload) {
  const res = await accountingApi.post(`/accounting/invoices/${id}/credit-note`, payload);
  return res.data;
}

// تحميل الفاتورة PDF
export async function downloadInvoicePDF(id) {
  const res = await accountingApi.get(`/accounting/invoices/${id}/print`, {
    responseType: "blob",
  });
  return res.data;
}

// إرسال الفاتورة بالبريد الإلكتروني
export async function sendInvoiceEmail(id) {
  const res = await accountingApi.post(`/accounting/invoices/${id}/send`);
  return res.data;
}

/* ===========================
   Taxes & Payment Terms (قوائم مساعدة)
=========================== */

// جلب كل الضرائب
export async function getTaxes() {
  const res = await accountingApi.get("/accounting/taxes");
  return res.data?.taxes || [];
}

// جلب كل شروط الدفع
export async function getPaymentTerms() {
  const res = await accountingApi.get("/accounting/payment-terms");
  return res.data?.payment_terms || [];
}

// جلب كل دفاتر اليومية
// كل واحد: { id, name, code, type, default_account_id, default_account_name, currency_id }
export async function getJournals() {
  const res = await accountingApi.get("/accounting/journals");
  return res.data?.journals || [];
}

// دفاتر اليومية المستخدمة فعليًا كطرق دفع (bank + cash بس)
export async function getPaymentJournals() {
  const journals = await getJournals();
  return journals.filter((j) => j.type === "bank" || j.type === "cash");
}

// جلب طرق الدفع الخاصة بدفتر يومية معيّن
// direction: "inbound" (دفعات واردة - عملاء) | "outbound" (دفعات صادرة - موردين)
export async function getPaymentMethodsForJournal(journalId, direction = "inbound") {
  if (!journalId) return [];
  const res = await accountingApi.get(`/accounting/journals/${journalId}/payment-methods`);
  const data = res.data?.data || {};
  return direction === "outbound" ? (data.outbound_methods || []) : (data.inbound_methods || []);
}

/* ===========================
   Products (المنتجات)
=========================== */

// جلب كل المنتجات
export async function getProducts(type = "sale") {
  const res = await accountingApi.get("/accounting/products", {
    params: { type },
  });
  return res.data?.products || [];
}

// إنشاء منتج جديد
export async function createProduct(payload) {
  const res = await accountingApi.post("/accounting/products", payload);
  return res.data;
}

// تعديل منتج
export async function updateProduct(id, payload) {
  const res = await accountingApi.put(`/accounting/products/${id}`, payload);
  return res.data;
}