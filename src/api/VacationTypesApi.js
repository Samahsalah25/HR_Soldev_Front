// ────────────────────────────────────────────────────────────────────────
// API لأنواع الإجازات + أرصدة الإجازات + سجل معاملات الإجازات
// نفس نمط Paymenttermsapi.js
// ⚠️ عدّلي مسار الـ axios instance تحت لو مختلف عندك في المشروع
// ────────────────────────────────────────────────────────────────────────
import axiosInstance from "../api/axios";

const BASE = "/requests/vacation";

/* ───────────── أنواع الإجازات (Leave Types) ───────────── */

export async function getLeaveTypes() {
  const { data } = await axiosInstance.get(`${BASE}/types`);
  return data.data;
}

export async function getLeaveType(id) {
  const { data } = await axiosInstance.get(`${BASE}/types/${id}`);
  return data.data;
}

export async function createLeaveType(payload) {
  const { data } = await axiosInstance.post(`${BASE}/types`, payload);
  return data.data;
}

export async function updateLeaveType(id, payload) {
  // ⚠️ افتراض إن التحديث بـ PUT — لو الباك اند بتاعك بيستخدم PATCH بدّليها
  const { data } = await axiosInstance.put(`${BASE}/types/${id}`, payload);
  return data.data;
}

export async function deleteLeaveType(id) {
  const { data } = await axiosInstance.delete(`${BASE}/types/${id}`);
  return data.data;
}

/* ───────────── أرصدة الإجازات (Balances) — Paginated ───────────── */

export async function getLeaveBalances(params = {}) {
  const { data } = await axiosInstance.get(`${BASE}/balances`, { params });
  // بيرجع { success, pagination, data } كامل عشان نستخدم الـ pagination في الواجهة
  return data;
}

/* ───────────── سجل أجازات الموظفين (Transactions) — Paginated ───────────── */

export async function getLeaveTransactions(params = {}) {
  const { data } = await axiosInstance.get(`${BASE}/transactions`, { params });
  return data;
}