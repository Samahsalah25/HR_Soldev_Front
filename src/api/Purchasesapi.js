// ────────────────────────────────────────────────────────────────────────
// API للمشتريات (Requests for Quotation / Purchase Orders)
// + بيانات مساعدة: الموردين، منتجات الشراء، المشاريع
// نفس نمط باقي ملفات الـ API في المشروع
// ────────────────────────────────────────────────────────────────────────
import api from "./axios";

/* ───────────── بيانات مساعدة (Reference Data) ───────────── */

// الموردين — مطلوب type=vendor عشان نجيب اللي عندهم supplier_rank فقط
export async function getVendors() {
  const { data } = await api.get("/accounting/partners", { params: { type: "vendor" } });
  return data.partners;
}

// منتجات الشراء — type=purchase
export async function getPurchaseProducts() {
  const { data } = await api.get("/accounting/products", { params: { type: "purchase" } });
  return data.products;
}

// المشاريع — كل مشروع معاه analytic_account_id بتاعه (مش نفس الـ id بتاع المشروع)
// وده اللي بيتبعت كـ key جوه analytic_distribution
export async function getProjects() {
  const { data } = await api.get("/projects");
  return data.data;
}

/* ───────────── المشتريات (Purchases) ───────────── */

const BASE = "/purchases";

export async function getPurchases(params = {}) {
  const { data } = await api.get(BASE, { params });
  // بيرجع { success, pagination, data } كامل عشان نستخدم الـ pagination
  return data;
}

export async function getPurchase(id) {
  const { data } = await api.get(`${BASE}/${id}`);
  return data.data;
}

export async function createPurchase(payload) {
  const { data } = await api.post(BASE, payload);
  return data.data;
}

export async function updatePurchase(id, payload) {
  // ⚠️ افتراض PUT — بدّليها PATCH لو الباك اند محتاج كده
  const { data } = await api.put(`${BASE}/${id}`, payload);
  return data.data;
}

export async function deletePurchase(id) {
  const { data } = await api.delete(`${BASE}/${id}`);
  return data.data;
}

// تأكيد الطلب: RFQ → Purchase Order
export async function confirmPurchase(id) {
  const { data } = await api.post(`${BASE}/${id}/confirm`);
  return data.data;
}

// إنشاء فاتورة مورد من أمر الشراء المؤكد
export async function createBillFromPurchase(id) {
  const { data } = await api.post(`${BASE}/${id}/create_bill`);
  return data.data;
}

// إلغاء الطلب بالكامل
export async function cancelPurchase(id) {
  const { data } = await api.post(`${BASE}/${id}/cancel`);
  return data.data;
}