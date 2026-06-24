import api from "./axios";

// ── Employees CRUD ────────────────────────────────────────────────────────────

/**
 * GET /employees  →  list all employees
 * Response: { success, count, total, data: [...] }
 */
export async function getEmployeesList() {
    const res = await api.get("/employees");
    const payload = res.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
}

/**
 * GET /employees/:id  →  single employee
 */
export async function getEmployeeById(id) {
    const res = await api.get(`/employees/${id}`);
    return res.data?.data || res.data;
}

/**
 * POST /employees  →  create employee
 *
 * New API field names (different from old base44 schema):
 *   name_ar, name_en, nationality, employee_category (saudi|resident)
 *   identification_id, residency_end, passport_id, passport_end_date
 *   birthday, gender, marital, children, mobile, email
 *   job_grade, job_title, department_id, job_position
 *   direct_manager, branch (ID), employee_center, project
 *   start_date, contract_type (limited|unlimited), contract_end_date
 *   employee_state (active|vacation|under_review|service_ended)
 *   annual_leave_balance, wage, housing_allowance (not in API — old field)
 *   transport_allowance, food_allowance, communication_allowance, other_allowance
 *   bank_name, iban_number, insurance_number
 *   ticket_entitlement (yearly|biannual|none), ticket_class, ticket_destination, ticket_price
 *   documents: [{ document (base64), filename, notes }]
 */
export async function createEmployee(data) {
    const res = await api.post("/employees", data);
    return res.data;
}

/**
 * PUT /employees/:id  →  update employee
 */
export async function updateEmployee(id, data) {
    const res = await api.put(`/employees/${id}`, data);
    return res.data;
}

/**
 * DELETE /employees/:id  →  delete employee
 */
export async function deleteEmployee(id) {
    const res = await api.delete(`/employees/${id}`);
    return res.data;
}

/**
 * POST /employees/documents/:id  →  upload document for employee
 * Body: { document: base64string, filename: "file.pdf", notes: "..." }
 */
export async function uploadEmployeeDocument(employeeId, { document, filename, notes = "" }) {
    const res = await api.post(`/employees/documents/${employeeId}`, {
        document,
        filename,
        notes,
    });
    return res.data;
}

// ── Field mapping helpers ─────────────────────────────────────────────────────

/** Map new API employee object → UI-friendly shape (keeps old field names for backward compat) */
export function normalizeEmployee(e) {
    return {
        // identity
        id: e.id,
        employee_number: e.employee_number,
        // names
        full_name_ar: e.name_ar || e.name || "",
        full_name_en: e.name_en || e.name || "",
        name: e.name || e.name_ar || "",
        // nationality
        nationality: e.nationality_name || e.nationality || "",
        is_saudi: e.employee_category === "saudi",
        employee_category: e.employee_category || "saudi",
        // ids
        id_number: e.identification_id || "",
        id_expiry: e.residency_end || "",
        passport_number: e.passport_id || "",
        passport_expiry: e.passport_end_date || "",
        // personal
        date_of_birth: e.birthday || "",
        gender: e.gender === "male" ? "ذكر" : e.gender === "female" ? "أنثى" : e.gender || "",
        marital_status: e.marital === "single" ? "أعزب" : e.marital === "married" ? "متزوج" : e.marital || "",
        dependents_count: e.children || 0,
        phone: e.mobile_phone || e.mobile || "",
        email: e.work_email || e.email || "",
        job_title: e.job_title || "",
        job_grade: e.job_grade === "Admin" ? "مدير نظام" :
                   e.job_grade === "HR" ? "موارد بشرية" :
                   e.job_grade === "CEO" ? "مدير تنفيذي" :
                   e.job_grade === "Department manager" ? "مدير قسم" :
                   e.job_grade === "Accountant" ? "محاسب" :
                   e.job_grade === "Employee" ? "موظف عادي" : e.job_grade || "",
        department: e.department_name || "",
        department_id: e.department_id || null,
        branch: e.work_location_name || "",
        branch_id: e.work_location_id || null,
        manager: e.parent_name || "",
        direct_manager: e.parent_id || null,
        job_position: e.job_position || "",
        project: e.project_name || "",
        project_id: e.project_id || null,
        cost_center: e.employee_center || "",
        join_date: e.start_date || "",
        contract_type: e.contract_type === "limited" ? "محدد المدة" : e.contract_type === "unlimited" ? "غير محدد المدة" : e.contract_type || "",
        contract_end_date: e.contract_end_date || "",
        status: normalizeEmployeeState(e.employee_state),
        employee_state: e.employee_state || "active",
        annual_leave_balance: e.annual_leave_balance || 0,
        // salary
        basic_salary: e.wage || 0,
        housing_allowance: e.housing_allowance || 0,
        transport_allowance: e.transport_allowance || 0,
        food_allowance: e.food_allowance || 0,
        communication_allowance: e.communication_allowance || 0,
        other_allowances: e.other_allowance || 0,
        // banking
        bank_name: e.bank_name || "",
        iban: e.iban_number || "",
        gosi_number: e.insurance_number || "",
        // tickets
        ticket_entitlement: e.ticket_entitlement === "yearly" ? "سنوياً" : e.ticket_entitlement === "biannual" ? "كل سنتين" : e.ticket_entitlement === "none" ? "غير مستحق" : e.ticket_entitlement || "غير مستحق",
        ticket_class: e.ticket_class === "economic" ? "اقتصادية" : e.ticket_class === "business" ? "أعمال" : e.ticket_class || "اقتصادية",
        ticket_destination: e.ticket_destination || "",
        ticket_value: e.ticket_price || 0,
        // documents
        documents: e.documents || [],
        active: e.active,
        user_role: e.user_role || "",
    };
}

/** Map new employee_state values → Arabic status labels used in old UI */
export function normalizeEmployeeState(state) {
    const map = {
        active: "نشط",
        vacation: "في إجازة",
        under_review: "تحت التجربة",
        service_ended: "مُنهي الخدمة",
    };
    return map[state] ?? state ?? "نشط";
}

/** Map UI form fields → new API payload */
export function toApiPayload(form) {
    return {
        name_ar: form.full_name_ar || form.name_ar || "",
        name_en: form.full_name_en || form.name_en || "",
        nationality: form.nationality || "",
        employee_category: form.is_saudi ? "saudi" : "resident",
        identification_id: form.id_number || "",
        residency_end: form.id_expiry || null,
        passport_id: form.passport_number || "",
        passport_end_date: form.passport_expiry || null,
        birthday: form.date_of_birth || null,
        gender: form.gender === "ذكر" ? "male" : form.gender === "أنثى" ? "female" : form.gender || "male",
        marital: form.marital_status === "متزوج" ? "married" : "single",
        children: form.dependents_count || 0,
        mobile: form.phone || "",
        email: form.email || "",
        job_grade: form.job_grade === "مدير نظام" ? "Admin" :
                   form.job_grade === "موارد بشرية" ? "HR" :
                   form.job_grade === "مدير تنفيذي" ? "CEO" :
                   form.job_grade === "مدير قسم" ? "Department manager" :
                   form.job_grade === "محاسب" ? "Accountant" :
                   form.job_grade === "موظف عادي" ? "Employee" : form.job_grade || "Employee",
        job_title: form.job_title || "",
        department_id: form.department_id || null,
        job_position: form.job_position || "",
        direct_manager: form.direct_manager || null,
        branch: form.branch_id || null,
        employee_center: form.cost_center || "",
        project: form.project_id || null,
        start_date: form.join_date || null,
        contract_type: form.contract_type === "محدد المدة" ? "limited" : form.contract_type === "غير محدد المدة" ? "unlimited" : form.contract_type || "unlimited",
        contract_end_date: form.contract_end_date || null,
        employee_state: form.employee_state || toApiState(form.status),
        annual_leave_balance: form.annual_leave_balance || 0,
        wage: form.basic_salary || 0,
        transport_allowance: form.transport_allowance || 0,
        food_allowance: form.food_allowance || 0,
        communication_allowance: form.communication_allowance || 0,
        other_allowance: form.other_allowances || 0,
        bank_name: form.bank_name || "",
        iban_number: form.iban || "",
        insurance_number: form.gosi_number || "",
        ticket_entitlement: form.ticket_entitlement === "سنوياً" ? "yearly" : form.ticket_entitlement === "كل سنتين" ? "biannual" : form.ticket_entitlement === "غير مستحق" ? "none" : form.ticket_entitlement || "none",
        ticket_class: form.ticket_class === "اقتصادية" ? "economic" : form.ticket_class === "أعمال" ? "business" : form.ticket_class || "economic",
        ticket_destination: form.ticket_destination || "",
        ticket_price: form.ticket_value || 0,
        user_role: form.user_role || "employee",
    };
}

function toApiState(status) {
    const map = {
        "نشط": "active",
        "في إجازة": "vacation",
        "تحت التجربة": "under_review",
        "مُنهي الخدمة": "service_ended",
    };
    return map[status] ?? "active";
}
