// src/api/storageCrmApi.js
import api from "./axios";

// ─── Field Mapping (API → UI) ─────────────────────────────────────────────────

/**
 * API Response fields:
 * id, name, company_type (person|company), is_company,
 * email, phone, mobile, website,
 * street, street2, city, state_name, zip, country_name,
 * vat, function (المسمى الوظيفي), comment,
 * active, image, contacts[]
 *
 * CRM UI fields (القديمة في StorageLead):
 * full_name → name
 * phone → mobile (أو phone)
 * email → email
 * customer_type → company_type: person|company
 * company_name → name (لو شركة)
 * pipeline_stage → مش موجود في API (نضيفه locally)
 * interested_in → function (نستخدمه لأقرب معنى)
 * notes → comment
 */
export function fromApiCustomer(c) {
    return {
        id: c.id,
        // الاسم
        full_name: c.name,
        name: c.name,
        // نوع العميل
        customer_type: c.is_company ? "شركة" : "فرد",
        company_type: c.company_type,   // "person" | "company"
        is_company: c.is_company,
        // تواصل
        phone: c.mobile || c.phone,
        mobile: c.mobile,
        landline: c.phone,
        email: c.email,
        website: c.website,
        // عنوان
        street: c.street,
        city: c.city,
        state_name: c.state_name,
        country_name: c.country_name,
        // عمل
        vat: c.vat,
        job_title: c.function,       // المسمى الوظيفي
        // CRM fields
        notes: c.comment,
        comment: c.comment,
        // صورة
        image: c.image || null,
        // sub-contacts
        contacts: c.contacts ?? [],
        // active
        active: c.active,
        // tags
        tags: c.tags ?? [],
    };
}

/**
 * تحويل UI form → API payload
 *
 * Person:  name, company_type:"person", email, phone, mobile,
 *          street, street2, city, zip, country_id, state_id, title_id,
 *          function, comment, active
 * Company: name, company_type:"company", email, phone, mobile,
 *          website, street, city, zip, vat, comment, active
 */
export function toApiCustomerPayload(form) {
    const isCompany = form.company_type === "company" || form.is_company === true;

    const payload = {
        name: form.name || form.full_name || "",
        company_type: isCompany ? "company" : "person",
        email: form.email || "",
        phone: form.phone || "",
        mobile: form.mobile || "",
        street: form.street || "",
        street2: form.street2 || "",
        city: form.city || "",
        zip: form.zip || "",
        comment: form.comment || form.notes || "",
        active: form.active !== false,
    };

    // optional id fields
    if (form.country_id) payload.country_id = form.country_id;
    if (form.state_id) payload.state_id = form.state_id;
    if (form.title_id) payload.title_id = form.title_id;

    if (isCompany) {
        payload.website = form.website || "";
        payload.vat = form.vat || "";
    } else {
        payload.function = form.function || form.job_title || "";
    }

    return payload;
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /customers
 * @param {object} filters
 *   company_type: 'person' | 'company'   (اختياري)
 *   active:       true | false            (default: true)
 *   search:       string                  (يبحث في name, email, phone)
 *   limit:        number                  (default: 40)
 *   offset:       number                  (default: 0)
 */
export async function getCustomers(filters = {}) {
    const params = {
        limit: filters.limit ?? 100,
        offset: filters.offset ?? 0,
        active: filters.active !== undefined ? filters.active : true,
    };
    if (filters.company_type) params.company_type = filters.company_type;
    if (filters.search) params.search = filters.search;

    const res = await api.get("/customers", { params });
    const list = res.data?.data ?? res.data ?? [];
    return Array.isArray(list) ? list.map(fromApiCustomer) : [];
}

/**
 * GET /customers/:id
 */
export async function getCustomer(id) {
    const res = await api.get(`/customers/${id}`);
    const c = res.data?.data ?? res.data;
    return fromApiCustomer(c);
}

/**
 * POST /customers
 */
export async function createCustomer(form) {
    const res = await api.post("/customers", toApiCustomerPayload(form));
    return res.data;
}

/**
 * PUT /customers/:id
 * يستخدم form-data (نفس أسامي الحقول المستخدمة في createCustomer)
 */
export async function updateCustomer(id, form) {
    const fd = new FormData();

    const payload = toApiCustomerPayload(form);
    Object.entries(payload).forEach(([k, v]) => {
        if (v !== null && v !== undefined) {
            fd.append(k, String(v));
        }
    });

    const res = await api.put(`/customers/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
}

/**
 * DELETE /customers/:id  (إذا كان مدعوماً)
 */
export async function deleteCustomer(id) {
    const res = await api.delete(`/customers/${id}`);
    return res.data;
}
