// ────────────────────────────────────────────────────────────────────────
// API لنظام "نطاقات" (Nitaqat): الحالة، المحاكاة، الشرائح (Bands)
// نفس نمط باقي ملفات الـ API في المشروع (axios instance من ./axios)
// ────────────────────────────────────────────────────────────────────────
import api from "./axios";

const BASE = "/nitaqat";

/* ───────────── الحالة الحالية ───────────── */

export async function getNitaqatStatus() {
  const { data } = await api.get(`${BASE}/status`);
  return data;
}

/* ───────────── المحاكاة ───────────── */

export async function simulateNitaqat(payload) {
  const { data } = await api.post(`${BASE}/simulate`, payload);
  return data;
}

/* ───────────── الشرائح (Bands) ───────────── */

export async function getNitaqatBands(params = {}) {
  const { data } = await api.get(`${BASE}/bands`, { params });
  // بيرجع { success, pagination, data } كامل عشان نستخدم الـ pagination
  return data;
}

export async function getNitaqatBand(id) {
  const { data } = await api.get(`${BASE}/bands/${id}`);
  return data.data;
}

export async function createNitaqatBand(payload) {
  const { data } = await api.post(`${BASE}/bands`, payload);
  return data.data;
}

export async function updateNitaqatBand(id, payload) {
  // ⚠️ افتراض PUT — بدّليها PATCH لو الباك اند محتاج كده
  const { data } = await api.put(`${BASE}/bands/${id}`, payload);
  return data.data;
}

export async function deleteNitaqatBand(id) {
  const { data } = await api.delete(`${BASE}/bands/${id}`);
  return data.data;
}

/* ───────────── الشركات (لاختيار company_ids) ───────────── */

// ⚠️ شكل الـ response الفعلي لـ /api/v1/companies مش موضّح في البرومبت،
// فبنتعامل معاه بشكل دفاعي (defensive) مع أكتر من احتمال شائع
export async function getCompanies() {
  const { data } = await api.get("/companies");
  if (Array.isArray(data)) return data;
  return data.data || data.companies || [];
}