import api from "./axios";

// Re-use the shared axios instance (same base URL + session cookies)
const assetsApi = api;


export const CATEGORY_TYPE_OPTIONS = [
    { value: "Electronic Devices", label: "أجهزة إلكترونية" },
    { value: "Stationery", label: "أدوات مكتبية" },
    { value: "Operation Equipment", label: "معدات تشغيل" },
    { value: "Other", label: "أخرى" },
];

export const STATE_OPTIONS = [
    { value: "available", label: "متاح" },
    { value: "assigned", label: "مخصص" },
    { value: "maintenance", label: "صيانة" },
];

const STATE_ALIAS = { in_use: "assigned" };

export const CONDITION_OPTIONS = [
    { value: "new", label: "جديد" },
    { value: "good", label: "جيد" },
    { value: "damaged", label: "تالف" },
];

export const REQUEST_TYPE_OPTIONS = [
    { value: "custody_request", label: "طلب أصل" },
    { value: "custody_return", label: "إعادة أصل" },
];

export function stateLabel(state) {
    const normalized = STATE_ALIAS[state] || state;
    return STATE_OPTIONS.find(o => o.value === normalized)?.label ?? state ?? "—";
}

export function categoryTypeLabel(cat) {
    return CATEGORY_TYPE_OPTIONS.find(o => o.value === cat)?.label ?? cat ?? "—";
}

export function conditionLabel(cond) {
    return CONDITION_OPTIONS.find(o => o.value === cond)?.label ?? cond ?? "—";
}

export function requestTypeLabel(rt) {
    return REQUEST_TYPE_OPTIONS.find(o => o.value === rt)?.label ?? rt ?? "—";
}

export const REQUEST_STATUS_COLORS = {
    pending: "bg-amber-100 text-amber-700",
    under_review: "bg-amber-100 text-amber-700",
    accepted: "bg-blue-100 text-blue-700",
    approved: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    done: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    delivered: "bg-green-100 text-green-700",
    received: "bg-green-100 text-green-700",
};

export function requestStatusLabel(s) {
    const map = {
        pending: "قيد المراجعة",
        under_review: "قيد المراجعة",
        accepted: "مقبول",
        approved: "مقبول",
        rejected: "مرفوض",
        done: "منجز",
        completed: "منجز",
        delivered: "تم التسليم",
        received: "تم الاستلام",
    };
    return map[s] ?? s ?? "—";
}

function toArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (payload?.data && !Array.isArray(payload.data)) return [payload.data]; // single object
    return [];
}


export async function getEmployees() {
    const res = await assetsApi.get("/employees");
    return toArray(res.data).map(e => ({
        id: e.id,
        name: e.name || "",
        department: e.department_name || "",
        email: e.work_email || "",
        employee_number: e.employee_number || "",
    }));
}


export async function getAssets() {
    const res = await assetsApi.get("/custodies");
    return toArray(res.data);
}

// نسخة بـ pagination من الباك (page/limit) — بترجع الـ envelope كامل { success, pagination, data }
export async function getAssetsPaged(params = {}) {
    const res = await assetsApi.get("/custodies", { params });
    return res.data;
}

export async function getAssetById(id) {
    const res = await assetsApi.get(`/custodies/${id}`);
    return res.data;
}

/**
 * GET /custodies/:id/history  →  asset history/logs
 * Falls back gracefully if endpoint doesn't exist
 */
export async function getAssetHistory(id) {
    // Try common history endpoint paths
    const paths = [
        `/custodies/${id}/history`,
        `/custodies/${id}/logs`,
        `/custodies/${id}/tracking`,
        `/custody_logs?custody_id=${id}`,
    ];
    for (const path of paths) {
        try {
            const res = await assetsApi.get(path);
            const data = res.data;
            const list = Array.isArray(data) ? data
                : Array.isArray(data?.data) ? data.data
                    : Array.isArray(data?.logs) ? data.logs
                        : Array.isArray(data?.history) ? data.history
                            : null;
            if (list !== null) return list;
        } catch {
            // try next path
        }
    }
    return null; // no history endpoint found
}

export async function createAsset(data) {
    const res = await assetsApi.post("/custodies", data);
    return res.data;
}

export async function updateAsset(id, data) {
    const res = await assetsApi.put(`/custodies/${id}`, data);
    return res.data;
}

export async function deleteAsset(id) {
    const res = await assetsApi.delete(`/custodies/${id}`);
    return res.data;
}


/**
 * GET /custody_requests  →  all requests
 */
export async function getCustodyRequests() {
    const res = await assetsApi.get("/custody_requests");
    return toArray(res.data);
}

/**
 * POST /custody_requests
 * Body: { employee_id, equipment_id, request_type: "custody_request"|"custody_return", reason }
 */
export async function createCustodyRequest({ employee_id, equipment_id, request_type, reason }) {
    const res = await assetsApi.post("/custody_requests", {
        employee_id,
        equipment_id,
        request_type,
        reason,
    });
    return res.data;
}

/**
 * POST /custody_requests/:id/accept
 */
export async function acceptCustodyRequest(id) {
    const res = await assetsApi.post(`/custody_requests/${id}/accept`);
    return res.data;
}

/**
 * POST /custody_requests/:id/reject
 */
export async function rejectCustodyRequest(id) {
    const res = await assetsApi.post(`/custody_requests/${id}/reject`);
    return res.data;
}

/**
 * POST /custody_returns/:id/accept  (for return requests)
 */
export async function acceptCustodyReturn(id) {
    try {
        const res = await assetsApi.post(`/custody_returns/${id}/accept`);
        return res.data;
    } catch {
        // Fallback: some backends use the same custody_requests endpoint
        const res = await assetsApi.post(`/custody_requests/${id}/accept`);
        return res.data;
    }
}

/**
 * POST /custody_returns/:id/reject  (for return requests)
 */
export async function rejectCustodyReturn(id) {
    try {
        const res = await assetsApi.post(`/custody_returns/${id}/reject`);
        return res.data;
    } catch {
        // Fallback: some backends use the same custody_requests endpoint
        const res = await assetsApi.post(`/custody_requests/${id}/reject`);
        return res.data;
    }
}

/**
 * POST /custody_requests/:id/deliver
 * Body: { delivered_by, delivery_date, condition_at_delivery }
 */
export async function deliverCustodyRequest(id, data) {
    const res = await assetsApi.post(`/custody_requests/${id}/deliver`, data);
    return res.data;
}

/**
 * POST /custody_requests/:id/receive  (return/receive back)
 */
export async function receiveCustodyRequest(id, data) {
    const res = await assetsApi.post(`/custody_requests/${id}/receive`, data);
    return res.data;
}

// ── Custody returns ───────────────────────────────────────────────────────────

/**
 * GET /custody_returns  →  all return records
 */
export async function getCustodyReturns() {
    const res = await assetsApi.get("/custody_returns");
    return toArray(res.data);
}

// نسخة بـ pagination من الباك (page/limit) — بترجع الـ envelope كامل { success, pagination, data }
export async function getCustodyReturnsPaged(params = {}) {
    const res = await assetsApi.get("/custody_returns", { params });
    return res.data;
}
