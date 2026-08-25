import api from "./axios";

/* ===========================
   Expenses (بنود المصروفات الفردية)
=========================== */

// جلب كل المصروفات
export async function getExpenses() {
  const res = await api.get("/expenses");
  return res.data; // { success, total_count, expenses }
}

// إنشاء مصروف جديد
// payload: { name, total_amount, product_id, date, payment_mode, expense_category, receipt_number }
export async function createExpense(payload) {
  const res = await api.post("/expenses", payload);
  return res.data;
}

// تعديل مصروف
export async function updateExpense(id, payload) {
  const res = await api.put(`/expenses/${id}`, payload);
  return res.data;
}

// حذف مصروف
export async function deleteExpense(id) {
  const res = await api.delete(`/expenses/${id}`);
  return res.data;
}

// رفع إيصال لمصروف
export async function attachExpenseReceipt(id, file, fileName) {
  const formData = new FormData();
  formData.append("file_name", fileName || file.name);
  formData.append("file", file);
  const res = await api.post(`/expenses/${id}/attach-receipt`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// جلب مرفق مصروف (الإيصال المرفوع) — بيرجع الملف نفسه (blob)
export async function getExpenseAttachment(id) {
  const res = await api.get(`/expenses/${id}/attachment`, {
    responseType: "blob",
  });
  return res.data;
}

/* ===========================
   Expense Reports (تقارير المصروفات)
=========================== */

// جلب كل تقارير المصروفات
export async function getExpenseReports() {
  const res = await api.get("/expense-reports");
  return res.data; // { success, total_count, reports }
}

// جلب تقرير واحد بالتفصيل
export async function getExpenseReport(id) {
  const res = await api.get(`/expense-reports/${id}`);
  return res.data;
}

// إنشاء وتقديم تقرير مصروفات جديد من مجموعة مصروفات
// payload: { name, expense_ids: [16, 17] }
export async function submitExpenseReport(payload) {
  const res = await api.post("/expense-reports/submit", payload);
  return res.data;
}

// اعتماد تقرير
export async function approveExpenseReport(id) {
  const res = await api.post(`/expense-reports/${id}/approve`);
  return res.data;
}

// رفض تقرير
// payload: { reason }
export async function refuseExpenseReport(id, reason) {
  const res = await api.post(`/expense-reports/${id}/refuse`, { reason });
  return res.data;
}

// ترحيل التقرير للمحاسب
export async function postExpenseReportToAccountant(id) {
  const res = await api.post(`/expense-reports/${id}/post`);
  return res.data;
}

// تسجيل دفعة سداد للتقرير
// payload: { journal_id, amount, payment_date }
export async function registerExpenseReportPayment(id, payload) {
  const res = await api.post(`/expense-reports/${id}/register-payment`, payload);
  return res.data;
}
