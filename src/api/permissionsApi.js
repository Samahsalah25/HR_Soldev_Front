// src/api/permissionsApi.js

import api from "./axios";

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
];

// =============================
// GET PERMISSION ROLES
// يرجع: [ { job_grade, permissions: { dashboard: true, employees: true, ... } }, ... ]
// =============================
export const getPermissionRoles = async () => {
    const res = await api.get("/permissions/roles");
    return res.data;
};

// =============================
// UPDATE ROLE PERMISSIONS
// body: { job_grade: "Admin", permissions: { dashboard: true, employees: true, ... } }
// =============================
export const updateRolePermissions = async (jobGrade, permissions) => {
    const res = await api.post("/permissions/roles", {
        job_grade: jobGrade,
        permissions,
    });
    return res.data;
};

// =============================
// GET EMPLOYEE PERMISSIONS
// GET /permissions/employees/:id
// يرجع: { has_overrides: true, permissions: { leaves: { is_active, can_create, can_read, can_update, can_delete }, ... } }
// =============================
export const getEmployeePermissions = async (employeeId) => {
    const res = await api.get(`/permissions/employees/${employeeId}`);
    return res.data;
};

// =============================
// UPDATE EMPLOYEE PERMISSIONS
// POST /permissions/employees/:id
// body: {
//   has_overrides: true,
//   permissions: {
//     leaves: { is_active: true, can_create: false, can_read: true, can_update: false, can_delete: false },
//     attendance: { is_active: false, can_create: true, can_read: true, can_update: true, can_delete: false },
//     ...
//   }
// }
// =============================
export const updateEmployeePermissions = async (employeeId, hasOverrides, permissions) => {
    const res = await api.post(`/permissions/employees/${employeeId}`, {
        has_overrides: hasOverrides,
        permissions,
    });
    return res.data;
};

// =============================
// GET PERMISSION LOGS
// GET /permissions/logs
// =============================
export const getPermissionLogs = async () => {
    const res = await api.get("/permissions/logs");
    return res.data;
};
