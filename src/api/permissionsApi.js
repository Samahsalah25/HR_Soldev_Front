// src/api/permissionsApi.js

import api from "./axios";

const BASE_URL = "https://undelved-semiacademical-roxann.ngrok-free.dev/api/v1";

// helper يبعت request بـ credentials (session cookie) وBearertoken معاً
async function apiFetch(path, options = {}) {
    const stored = localStorage.getItem("user");
    const token = stored ? JSON.parse(stored)?.id || JSON.parse(stored)?.token : null;
    const res = await fetch(`${BASE_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        ...options,
    });
    return res.json();
}

// =============================
// الأقسام المتاحة في الصلاحيات (تطابق ما يرجعه الـ API)
// =============================
export const PERMISSION_MODULES = [
    { key: "dashboard", label: "لوحة التحكم" },
    { key: "employees", label: "الموظفون" },
    { key: "recruitment", label: "التوظيف" },
    { key: "leaves", label: "الإجازات" },
    { key: "attendance", label: "الحضور" },
    { key: "transfers", label: "حركة النقل" },
    { key: "end_of_service", label: "نهاية الخدمة" },
    { key: "violations", label: "المخالفات" },
    { key: "deductions", label: "الخصومات" },
    { key: "rewards", label: "المكافآت" },
    { key: "missions", label: "المهمات والسفر" },
    { key: "tasks", label: "المهام" },
    { key: "requests", label: "الطلبات" },
    { key: "assets", label: "إدارة الأصول" },
    { key: "meetings", label: "الاجتماعات" },
    { key: "salaries", label: "الرواتب" },
    { key: "financial_reports", label: "التقارير المالية" },
    { key: "company_records", label: "سجلات الشركة" },
    { key: "reports", label: "التقارير" },
    { key: "permissions", label: "الصلاحيات" },
    { key: "legal_affairs", label: "الشؤون القانونية" },
    { key: "policies", label: "السياسات" },
    { key: "branches", label: "الفروع والأقسام" },
    { key: "settings", label: "الإعدادات" },
    { key: "my_portal", label: "بوابتي" },
    { key: "user_management", label: "إدارة المستخدمين" },
];

// =============================
// GET PERMISSION ROLES
// =============================
export const getPermissionRoles = async () => {
    return apiFetch("/permissions/roles");
};

// =============================
// UPDATE ROLE PERMISSIONS
// =============================
export const updateRolePermissions = async (jobGrade, permissions) => {
    return apiFetch("/permissions/roles", {
        method: "POST",
        body: JSON.stringify({ job_grade: jobGrade, permissions }),
    });
};

// =============================
// GET EMPLOYEE PERMISSIONS
// =============================
export const getEmployeePermissions = async (employeeId) => {
    return apiFetch(`/permissions/employees/${employeeId}`);
};

// =============================
// UPDATE EMPLOYEE PERMISSIONS
// =============================
export const updateEmployeePermissions = async (employeeId, hasOverrides, permissions) => {
    return apiFetch(`/permissions/employees/${employeeId}`, {
        method: "POST",
        body: JSON.stringify({ has_overrides: hasOverrides, permissions }),
    });
};

// =============================
// GET PERMISSION LOGS
// =============================
export const getPermissionLogs = async () => {
    return apiFetch("/permissions/logs");
};
