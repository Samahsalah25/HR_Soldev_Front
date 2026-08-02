// src/services/partnersApi.js
import api from "./axios";

const partnersApi = api;

/* ===========================
   Partners (عملاء / موردين)
   Base: /accounting/partners
=========================== */

/**
 * GET كل الشركاء بحسب النوع
 * @param {"customer"|"vendor"} type
 * params إضافية ممكنة زي search, limit, offset لو الباك إند بيدعمها
 */
export async function getPartners(type, params = {}) {
  const res = await partnersApi.get("/accounting/partners", {
    params: { type, ...params },
  });
  return res.data?.partners || [];
}

/**
 * GET الموردين فقط (اختصار)
 */
export async function getVendors(params = {}) {
  return getPartners("vendor", params);
}

/**
 * GET العملاء فقط (اختصار)
 */
export async function getCustomers(params = {}) {
  return getPartners("customer", params);
}

/**
 * GET شريك واحد بالـ id
 */
export async function getPartnerById(id) {
  const res = await partnersApi.get(`/accounting/partners/${id}`);
  return res.data?.partner || null;
}

/**
 * CREATE شريك جديد (عميل أو مورد)
 * payload: {
 *   name, email, phone, mobile, website, vat,
 *   street, street2, city, zip, country_id, state_id,
 *   is_company, type: "customer" | "vendor"
 * }
 */
export async function createPartner(payload) {
  const res = await partnersApi.post("/accounting/partners", payload);
  return res.data;
}

/**
 * إنشاء مورد (اختصار بيثبت type = vendor)
 */
export async function createVendor(payload) {
  return createPartner({ ...payload, type: "vendor" });
}

/**
 * إنشاء عميل (اختصار بيثبت type = customer)
 */
export async function createCustomer(payload) {
  return createPartner({ ...payload, type: "customer" });
}

/**
 * UPDATE شريك (عميل أو مورد)
 */
export async function updatePartner(id, payload) {
  const res = await partnersApi.put(`/accounting/partners/${id}`, payload);
  return res.data;
}

/**
 * DELETE شريك
 */
export async function deletePartner(id) {
  const res = await partnersApi.delete(`/accounting/partners/${id}`);
  return res.data;
}