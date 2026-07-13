// src/api/storageRentalsApi.js
import api from "./axios";

// ─── Field Mappings (API → UI) ────────────────────────────────────────────────

// customer_type
export const CUSTOMER_TYPE_API = { SINGLE: "single", COMPANY: "company" };
export const CUSTOMER_TYPE_UI = { single: "فرد", company: "شركة" };

// state
export const RENTAL_STATE_API = {
    DRAFT: "draft",
    WAITING_APPROVAL: "waiting_approval",
    WAITING_SIGNATURE: "waiting_signature",
    WAITING_PAYMENT: "waiting_payment",
    APPROVED: "approved",
    CANCELLED: "cancelled",
    ENDED: "ended",
};
export const RENTAL_STATE_AR = {
    draft: "مسودة",
    waiting_approval: "بانتظار الموافقة",
    waiting_signature: "بانتظار التوقيع",
    waiting_payment: "بانتظار الدفع",
    approved: "مؤكد",
    cancelled: "ملغي",
    ended: "منتهي",
};

// payment_type (payment_method في الـ UI القديم)
export const PAYMENT_TYPE_API = {
    VISA: "visa",
    MADA: "mada",
    APPLE_PAY: "apple_pay",
    BANK_TRANSFER: "bank_transfer",
};
export const PAYMENT_TYPE_AR = {
    visa: "بطاقة ائتمانية",
    mada: "مدى",
    apple_pay: "Apple Pay",
    bank_transfer: "تحويل بنكي",
};

// payment_option
export const PAYMENT_OPTION_API = { FULL: "full", DOWN_PAYMENT: "down_payment" };

// ─── Normalizer: API → UI ─────────────────────────────────────────────────────
export function fromApiRental(r) {
    return {
        id: r.id,
        state: r.state,
        stateAr: RENTAL_STATE_AR[r.state] || r.state,

        // وحدة
        unit_id: r.unit_id,
        unit_number: r.unit_number,
        branch: r.location,          // API: location → UI: branch
        monthly_price: r.monthly_price,

        // مدة العقد
        contract_start_date: r.contract_start_date,
        contract_duration_id: r.contract_duration_id,
        duration_name: r.contract_duration_name,
        duration_months: r.duration_months,
        total_price: r.total_price,

        // بيانات عميل مشتركة
        customer_type: r.customer_type,
        customer_type_ar: CUSTOMER_TYPE_UI[r.customer_type] || r.customer_type,
        customer_name: r.customer_name,
        customer_mobile: r.customer_mobile,
        customer_email: r.customer_email,
        customer_id_number: r.customer_id_number,
        customer_dob: r.customer_dob,
        stored_objects_type: r.stored_objects_type,

        // بيانات شركة
        company_name: r.company_name,
        company_rep_name: r.company_rep_name,
        company_mobile: r.company_mobile,
        company_cr_number: r.company_cr_number,

        // توقيع وشروط
        is_terms_agreed: r.is_terms_agreed,
        signature_name: r.signature_name,
        // signature_image: يُجلب بـ getFile()

        // دفع
        payment_option: r.payment_option,
        payment_type: r.payment_type,
        payment_type_ar: PAYMENT_TYPE_AR[r.payment_type] || r.payment_type,
        visa_cardholder_name: r.visa_cardholder_name,
        visa_card_number: r.visa_card_number,
        visa_expiry: r.visa_expiry,
        // visa_cvc: لا نحفظه في الـ state
    };
}

// ─── Payload builders (UI → API) ─────────────────────────────────────────────

/**
 * بناء FormData لإنشاء حجز جديد (فرد)
 * POST /storage/rentals
 */
export function buildSingleRentalFormData(form) {
    const fd = new FormData();
    fd.append("customer_type", "single");
    fd.append("unit_id", form.unit_id);
    fd.append("contract_start_date", form.contract_start_date);
    fd.append("contract_duration_id", form.contract_duration_id);
    fd.append("customer_name", form.customer_name);
    fd.append("customer_mobile", form.customer_mobile);
    fd.append("customer_email", form.customer_email);
    fd.append("customer_id_number", form.customer_id_number);
    fd.append("customer_dob", form.customer_dob || "");
    fd.append("stored_objects_type", form.stored_objects_type);
    fd.append("state", form.state || RENTAL_STATE_API.DRAFT);
    if (form.customer_id_photo) fd.append("customer_id_photo", form.customer_id_photo);
    return fd;
}

/**
 * بناء FormData لإنشاء حجز جديد (شركة)
 * POST /storage/rentals
 */
export function buildCompanyRentalFormData(form) {
    const fd = new FormData();
    fd.append("customer_type", "company");
    fd.append("unit_id", form.unit_id);
    fd.append("contract_start_date", form.contract_start_date);
    fd.append("contract_duration_id", form.contract_duration_id);
    fd.append("company_name", form.company_name);
    fd.append("company_rep_name", form.company_rep_name);
    fd.append("company_mobile", form.company_mobile);
    fd.append("customer_email", form.customer_email);
    fd.append("company_cr_number", form.company_cr_number);
    fd.append("stored_objects_type", form.stored_objects_type);
    fd.append("state", form.state || RENTAL_STATE_API.DRAFT);
    if (form.company_cr_file) fd.append("company_cr_file", form.company_cr_file);
    if (form.company_tax_cert_file) fd.append("company_tax_cert_file", form.company_tax_cert_file);
    if (form.company_auth_doc_file) fd.append("company_auth_doc_file", form.company_auth_doc_file);
    return fd;
}

/**
 * بناء FormData لتحديث حجز (Step 3+4: توقيع + دفع)
 * PUT /storage/rentals/:id
 */
export function buildUpdateRentalFormData(updates) {
    const fd = new FormData();
    // الشروط والتوقيع
    if (updates.is_terms_agreed !== undefined) fd.append("is_terms_agreed", String(updates.is_terms_agreed));
    if (updates.signature_name) fd.append("signature_name", updates.signature_name);
    if (updates.signature_image) fd.append("signature_image", updates.signature_image);  // File or Blob
    // الدفع
    if (updates.payment_option) fd.append("payment_option", updates.payment_option);
    if (updates.payment_type) fd.append("payment_type", updates.payment_type);
    if (updates.visa_cardholder_name) fd.append("visa_cardholder_name", updates.visa_cardholder_name);
    if (updates.visa_card_number) fd.append("visa_card_number", updates.visa_card_number.replace(/\s/g, ""));
    if (updates.visa_expiry) fd.append("visa_expiry", updates.visa_expiry);
    if (updates.visa_cvc) fd.append("visa_cvc", updates.visa_cvc);
    // الحالة
    if (updates.state) fd.append("state", updates.state);
    return fd;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /storage/rentals/durations
 * يرجع: [{ id, name, duration, unit }]
 * مثال: [{ id: 4, name: "1 Month", duration: 1, unit: "months" }]
 */
export async function getRentalDurations() {
    const res = await api.get("/storage/rentals/durations");
    return res.data?.data ?? res.data ?? [];
}

/**
 * GET /storage/rentals/available-units
 * query params (كلها اختيارية): branch, unit_type (ac|no_ac), unit_number
 */
export async function getAvailableUnits(filters = {}) {
    const params = {};
    if (filters.branch) params.branch = filters.branch;
    if (filters.unit_type) params.unit_type = filters.unit_type;  // "ac" أو "no_ac"
    if (filters.unit_number) params.unit_number = filters.unit_number;

    const res = await api.get("/storage/rentals/available-units", { params });
    const list = res.data?.data ?? res.data ?? [];
    // الـ response شكله زي StorageUnit عادي — نستخدم fromApiUnit منه
    return list;
}

/**
 * POST /storage/rentals
 * بيستقبل form-data
 * @param {FormData} formData — من buildSingleRentalFormData أو buildCompanyRentalFormData
 */
export async function createRental(formData) {
    const res = await api.post("/storage/rentals", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

/**
 * GET /storage/rentals
 * query params (كلها اختيارية):
 *   state:  draft | waiting_approval | waiting_signature | waiting_payment | approved | cancelled | ended
 *   search: بيبحث في customer_name, company_name, unit_number
 */
export async function getRentals(filters = {}) {
    const params = {};
    if (filters.state) params.state = filters.state;
    if (filters.search) params.search = filters.search;

    const res = await api.get("/storage/rentals", { params });
    const list = res.data?.data ?? res.data ?? [];
    return list.map(fromApiRental);
}

/**
 * PUT /storage/rentals/:id
 * بيستقبل form-data
 * @param {number|string} id
 * @param {FormData} formData — من buildUpdateRentalFormData
 */
export async function updateRental(id, formData) {
    const res = await api.put(`/storage/rentals/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

/**
 * GET /storage/rentals/:id/file/:field
 * يرجع binary (blob) للملف
 * @param {number|string} id
 * @param {"customer_id_photo"|"company_cr_file"|"company_tax_cert_file"|"company_auth_doc_file"|"signature_image"} field
 * @returns {string} object URL للعرض
 */
export async function getRentalFile(id, field) {
    const res = await api.get(`/storage/rentals/${id}/file/${field}`, {
        responseType: "blob",
    });
    return URL.createObjectURL(res.data);
}
