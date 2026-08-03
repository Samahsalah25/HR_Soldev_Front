// src/services/billsApi.js
import api from "./axios";

const billsApi = api;

/* ===========================
   Bills (فواتير الموردين - in_invoice)
   Base: /accounting/bills
=========================== */

export async function getBills(params = {}) {
  const res = await billsApi.get("/accounting/bills", {
    params: { type: "in_invoice", ...params },
  });
  return res.data?.invoices || [];
}

/**
 * GET فاتورة مورد واحدة بالـ id
 * مضفت fallback على أشكال ردود مختلفة لأن الـ endpoint الفردي ممكن يرجّع
 * الفاتورة تحت مفتاح مختلف عن اللي في اللستة (invoice / bill / invoices[0] / data نفسها)
 */
export async function getBillById(id) {
  const res = await billsApi.get(`/accounting/bills/${id}`);
  const d = res.data;
  return d?.invoice || d?.bill || d?.data || (Array.isArray(d?.invoices) ? d.invoices[0] : null) || d || null;
}

export async function createBill(payload) {
  const res = await billsApi.post("/accounting/bills", payload);
  return res.data;
}

export async function updateBill(id, payload) {
  const res = await billsApi.put(`/accounting/bills/${id}`, payload);
  return res.data;
}

export async function deleteBill(id) {
  const res = await billsApi.delete(`/accounting/bills/${id}`);
  return res.data;
}

export async function confirmBill(id) {
  const res = await billsApi.post(`/accounting/bills/${id}/post`);
  return res.data;
}

export async function resetBillToDraft(id) {
  const res = await billsApi.post(`/accounting/bills/${id}/reset-to-draft`);
  return res.data;
}

export async function cancelBill(id) {
  const res = await billsApi.post(`/accounting/bills/${id}/cancel`);
  return res.data;
}

/**
 * تسجيل دفعة على الفاتورة
 * payload: { journal_id, amount, memo, payment_method_line_id }
 *
 * ملحوظة: لو payment_method_line_id مش موجود، بنبعتها null بدل ما نسيبها
 * undefined، عشان لو الـ backend عنده validation بيتوقع المفتاح موجود
 * حتى لو فاضي (بعض الـ APIs بترفض الطلب لو المفتاح مش موجود خالص).
 */
export async function registerBillPayment(id, payload) {
  const cleanPayload = {
    journal_id: payload.journal_id,
    amount: payload.amount,
    memo: payload.memo ?? "",
    payment_method_line_id: payload.payment_method_line_id ?? null,
  };
  const res = await billsApi.post(`/accounting/bills/${id}/register-payment`, cleanPayload);
  return res.data;
}

export async function createBillCreditNote(id, payload) {
  const res = await billsApi.post(`/accounting/bills/${id}/credit-note`, payload);
  return res.data;
}

/**
 * طباعة الفاتورة (PDF) — بترجع { blob, contentType }
 * بتتأكد إن اللي راجع فعلاً PDF مش صفحة JSON/HTML للخطأ (اللي بيحصل لو
 * الـ endpoint رجّع 404/500 برد نصي والـ blob اتلقفها عادي من غير reject)
 * — أي حد بينادي الدالة دي (طباعة أو تحميل) بياخد الحماية دي تلقائيًا.
 */
export async function printBill(id) {
  const res = await billsApi.get(`/accounting/bills/${id}/print`, {
    responseType: "blob",
  });
  const blob = res.data;
  const contentType = res.headers?.["content-type"] || blob?.type || "";

  if (contentType && !contentType.includes("pdf")) {
    const text = await blob.text();
    let message = "تعذر تجهيز ملف الطباعة";
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
    } catch {
      // مش JSON، سيبي الرسالة الافتراضية
    }
    throw new Error(message);
  }

  return { blob, contentType };
}

/**
 * فتح PDF الفاتورة في تاب جديد
 *
 * الإصلاح هنا: بنفتح التاب الجديد فورًا وبشكل متزامن (sync) وقت الضغطة نفسها،
 * قبل أي await. ده مهم جدًا لأن المتصفحات (Chrome/Safari) بتحظر window.open
 * لو اتنادت بعد await — لأنها بتبقى مش جزء من "user gesture" الأصلي، فكانت
 * الطباعة بتفشل بصمت من غير أي error ظاهر.
 * (فحص إن الرد فعلاً PDF مش JSON خطأ متنكر بقى جوه printBill نفسها.)
 */
export async function openBillPrint(id) {
  const newTab = window.open("", "_blank");
  try {
    const { blob } = await printBill(id);
    const url = window.URL.createObjectURL(blob);
    if (newTab) {
      newTab.location.href = url;
    } else {
      // لو المتصفح رفض حتى فتح التاب الفاضي (حظر صارم للـ popups)
      window.location.href = url;
    }
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  } catch (err) {
    if (newTab && !newTab.closed) newTab.close();
    throw err;
  }
}