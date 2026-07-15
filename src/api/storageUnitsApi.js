// src/api/storageUnitsApi.js
import api from "./axios";

function isAbsoluteUrl(value) {
    return typeof value === "string" && /^https?:\/\//i.test(value);
}

function getApiOrigin() {
    return new URL(api.defaults.baseURL).origin;
}

/** رابط صورة الوحدة في Odoo */
export function getStorageUnitPhotoUrl(id, cacheKey = "") {
    const suffix = cacheKey ? `?unique=${encodeURIComponent(String(cacheKey))}` : "";
    return `${getApiOrigin()}/web/image/storage.unit/${id}/unit_photo${suffix}`;
}

function resolveUnitPhotoUrl(u) {
    const photo = u.unit_photo;
    if (!photo || !u.id) return isAbsoluteUrl(u.image_url) ? u.image_url : "";
    if (isAbsoluteUrl(photo)) return photo;
    if (isAbsoluteUrl(u.image_url)) return u.image_url;
    return getStorageUnitPhotoUrl(u.id, photo);
}

// ─── Value Maps ──────────────────────────────────────────────────────────────

const UNIT_TYPE_TO_API = {
    "مكيف": "ac",
    "غير مكيف": "no_ac",
};
const UNIT_TYPE_FROM_API = {
    "ac": "مكيف",
    "no_ac": "غير مكيف",
};

const STATE_TO_API = {
    "متاحة": "available",
    "محجوزة": "booked",
    "مؤجرة": "rented",
    "خارج الخدمة": "out_of_order",
};
const STATE_FROM_API = {
    "available": "متاحة",
    "booked": "محجوزة",
    "rented": "مؤجرة",
    "out_of_order": "خارج الخدمة",
};

// ─── Normalizers ─────────────────────────────────────────────────────────────

/** تحويل بيانات الـ UI → صيغة الـ API */
export function toApiPayload(form) {
    return {
        unit_number: form.unit_number,
        name: form.unit_name,
        location: form.branch,
        floor: form.floor,
        unit_type: UNIT_TYPE_TO_API[form.unit_type] ?? form.unit_type,
        state: STATE_TO_API[form.status] ?? form.status,
        space: Number(form.area_sqm) || 0,
        length: Number(form.length_m) || 0,
        width: Number(form.width_m) || 0,
        height: Number(form.height_m) || 0,
        monthly_price: Number(form.monthly_price) || 0,
        description: form.description ?? "",
        has_security: !!form.has_security,
        has_cameras: !!form.has_cameras,
        has_easy_arrival: !!form.easy_access,
    };
}

/** بناء FormData لإنشاء/تحديث وحدة مع صورة */
export function buildStorageUnitFormData(form) {
    const fd = new FormData();
    const payload = toApiPayload(form);
    Object.entries(payload).forEach(([key, val]) => {
        fd.append(key, val);
    });
    if (form.imageFile instanceof File) {
        fd.append("unit_photo", form.imageFile);
    }
    return fd;
}

/** تحويل بيانات الـ API → صيغة الـ UI
 *  الـ API بيرجع:
 *  { id, unit_number, name, location, floor,
 *    unit_type, unit_type_ar,
 *    state, state_ar,
 *    space, length, width, height, monthly_price,
 *    description, has_security, has_cameras,
 *    has_easy_arrival, unit_photo }
 */
export function fromApiUnit(u) {
    const photo = u.unit_photo;

    return {
        id: u.id,
        unit_number: u.unit_number,
        unit_name: u.name,
        branch: u.location,
        floor: u.floor,
        // نستخدم الحقل العربي الجاهز من API لو موجود، وإلا نحوّله يدوياً
        unit_type: u.unit_type_ar || UNIT_TYPE_FROM_API[u.unit_type] || u.unit_type,
        status: u.state_ar || STATE_FROM_API[u.state] || u.state,
        area_sqm: u.space,
        length_m: u.length,
        width_m: u.width,
        height_m: u.height,
        monthly_price: u.monthly_price,
        description: u.description ?? "",
        has_security: u.has_security,
        has_cameras: u.has_cameras,
        easy_access: u.has_easy_arrival,
        has_photo: !!photo,
        image_url: resolveUnitPhotoUrl(u),
    };
}

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * GET /storage/units
 * يدعم query param اختياري: state=available|booked|rented|out_of_order
 * مثال: getStorageUnits("available") → يجيب المتاحة فقط
 */
export async function getStorageUnits(stateFilter) {
    const params = stateFilter ? { state: stateFilter } : {};
    const res = await api.get("/storage/units", { params });
    const list = res.data?.data ?? res.data ?? [];
    return list.map(fromApiUnit);
}

/** GET /storage/units/:id — جيب وحدة واحدة */
export async function getStorageUnit(id) {
    const res = await api.get(`/storage/units/${id}`);
    const u = res.data?.data ?? res.data;
    return fromApiUnit(u);
}

/** POST /storage/units */
export async function createStorageUnit(form) {
    const res = form.imageFile instanceof File
        ? await api.post("/storage/units", buildStorageUnitFormData(form), {
            headers: { "Content-Type": "multipart/form-data" },
        })
        : await api.post("/storage/units", toApiPayload(form));
    return res.data;
}

/** PUT /storage/units/:id */
export async function updateStorageUnit(id, form) {
    const res = form.imageFile instanceof File
        ? await api.put(`/storage/units/${id}`, buildStorageUnitFormData(form), {
            headers: { "Content-Type": "multipart/form-data" },
        })
        : await api.put(`/storage/units/${id}`, toApiPayload(form));
    return res.data;
}

/** DELETE /storage/units/:id */
export async function deleteStorageUnit(id) {
    const res = await api.delete(`/storage/units/${id}`);
    return res.data;
}

/**
 * GET /storage/units/export
 * يرجع CSV file مباشرة من الـ Backend ويحفظه تلقائياً
 */
export async function exportStorageUnitsCsv() {
    const res = await api.get("/storage/units/export", {
        responseType: "blob", // مهم عشان الـ response CSV مش JSON
    });

    // استخرج اسم الملف من الـ Content-Disposition header لو موجود
    const disposition = res.headers["content-disposition"] || "";
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    const filename = match?.[1] || "storage-units.csv";

    // أنشئ blob URL وحمّله
    const url = URL.createObjectURL(
        new Blob([res.data], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * POST /storage/units/import
 * بيستقبل form-data مع key "file" (CSV file)
 * @param {File} csvFile - الملف المختار من الـ input
 */
export async function importStorageUnitsCsv(csvFile) {
    const formData = new FormData();
    formData.append("file", csvFile);

    const res = await api.post("/storage/units/import", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return res.data;
}
