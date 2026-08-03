// src/api/accountingMetaApi.js
//
// الـ endpoints دي اتأكدت فعليًا من الباك اند:
//   GET /accounting/journals       -> { success, journals: [{ id, name, code, type, default_account_id, default_account_name, currency_id, balance? }] }
//   GET /accounting/payment-terms  -> { success, payment_terms: [{ id, name, note }] }
//
// ملحوظة: مفيش endpoint منفصل لـ "payment methods". حسب كلام الباك اند،
// دفتر اليومية (journal) نفسه لو نوعه bank أو cash هو اللي بيتحدد بيه
// "طريقة الدفع" وقت register-payment. يعني وقت الدفع لازم نعرض دفاتر
// اليومية من نوع bank/cash بس، مش كل الدفاتر.
// لو اتأكد لاحقًا إن payment_method_line_id مطلوب كحقل منفصل عن الـ journal،
// هنحتاج endpoint إضافي وقتها.

import api from "./axios";

const journalsCache = { data: null, promise: null };

/**
 * GET كل دفاتر اليومية. بنعمل cache بسيط في نفس الجلسة لأن اللستة دي
 * شبه ثابتة ومفيش داعي نطلبها من جديد كل مرة نفتح فيها select
 */
export async function getJournals({ forceRefresh = false } = {}) {
  if (!forceRefresh && journalsCache.data) return journalsCache.data;
  if (!forceRefresh && journalsCache.promise) return journalsCache.promise;

  journalsCache.promise = api
    .get("/accounting/journals")
    .then((res) => {
      const journals = res.data?.journals || [];
      journalsCache.data = journals;
      return journals;
    })
    .finally(() => {
      journalsCache.promise = null;
    });

  return journalsCache.promise;
}

/**
 * دفاتر اليومية المستخدمة فعليًا كـ "طريقة دفع" وقت تسجيل الدفعات
 * (bank + cash بس، حسب توضيح الباك اند)
 */
export async function getPaymentJournals() {
  const journals = await getJournals();
  return journals.filter((j) => j.type === "bank" || j.type === "cash");
}

/**
 * دفاتر اليومية المستخدمة لفواتير الموردين (purchase بس)
 */
export async function getPurchaseJournals() {
  const journals = await getJournals();
  return journals.filter((j) => j.type === "purchase");
}

/**
 * GET شروط الدفع (payment terms)
 */
export async function getPaymentTerms() {
  const res = await api.get("/accounting/payment-terms");
  return res.data?.payment_terms || [];
}

/**
 * GET طرق الدفع الخاصة بدفتر يومية معيّن
 * كل دفتر يومية (bank/cash) ليه طرق دفع مختلفة، فلازم نبعت الـ journal_id
 * endpoint: GET /accounting/journals/<journal_id>/payment-methods
 *
 * الشكل الفعلي للرد (اتأكد من الباك اند):
 * {
 *   success: true,
 *   data: {
 *     inbound_methods:  [{ id, name }],  // دفعات وارِدة (فواتير بيع - عميل بيدفعلنا)
 *     outbound_methods: [{ id, name }]   // دفعات صادرة (فواتير مورد - إحنا بندفع)
 *   }
 * }
 *
 * فواتير الموردين (bills / in_invoice) إحنا اللي بندفع فيها، يعني دايمًا
 * بنستخدم outbound_methods. لو الشاشة دي هتتستخدم يومًا لفواتير عملاء
 * (in_refund / دفعات واردة) وقتها المفروض تتبعت direction="inbound".
 */
export async function getPaymentMethodsForJournal(journalId, direction = "outbound") {
  if (!journalId) return [];
  const res = await api.get(`/accounting/journals/${journalId}/payment-methods`);
  const data = res.data?.data || {};
  return direction === "inbound" ? (data.inbound_methods || []) : (data.outbound_methods || []);
}