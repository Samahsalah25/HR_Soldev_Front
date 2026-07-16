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
// الأقسام المتاحة في الصلاحيات (بنفس ترتيب الـ Sidebar)
// =============================
export const PERMISSION_MODULES = [
    // الرئيسية
    { key: "dashboard", label: "لوحة التحكم", group: "الرئيسية" },
    { key: "home", label: "لوحتي الشخصية", group: "الرئيسية" },

    // الموارد البشرية
    { key: "employees", label: "الموظفون", group: "الموارد البشرية" },
    { key: "recruitment", label: "التوظيف", group: "الموارد البشرية" },
    { key: "leaves", label: "الإجازات والتذاكر", group: "الموارد البشرية" },
    { key: "attendance", label: "الحضور والانصراف", group: "الموارد البشرية" },
    { key: "missions", label: "المهمات والسفر", group: "الموارد البشرية" },
    { key: "transfers", label: "حركة النقل", group: "الموارد البشرية" },
    { key: "violations", label: "المخالفات", group: "الموارد البشرية" },
    { key: "deductions", label: "الخصومات", group: "الموارد البشرية" },
    { key: "rewards", label: "المكافآت", group: "الموارد البشرية" },
    { key: "loan_management", label: "السلف والقروض", group: "الموارد البشرية" },
    { key: "end_of_service", label: "إنهاء الخدمة", group: "الموارد البشرية" },

    // المالية
    { key: "salaries", label: "الرواتب والتأمينات", group: "المالية" },
    { key: "accounting", label: "نظام الحسابات", group: "المالية" },
    { key: "financial_reports", label: "التقارير المالية", group: "المالية" },

    // التشغيل
    { key: "tasks", label: "المهام", group: "التشغيل" },
    { key: "requests", label: "طلبات الموظفين", group: "التشغيل" },
    { key: "assets", label: "إدارة الأصول", group: "التشغيل" },
    { key: "meetings", label: "الاجتماعات", group: "التشغيل" },

    // وحدات التخزين
    { key: "storage_dashboard", label: "لوحة التخزين", group: "وحدات التخزين" },
    { key: "storage_units", label: "الوحدات", group: "وحدات التخزين" },
    { key: "storage_bookings", label: "الحجوزات", group: "وحدات التخزين" },
    { key: "storage_contracts", label: "العقود والفواتير", group: "وحدات التخزين" },
    { key: "storage_crm", label: "CRM العملاء", group: "وحدات التخزين" },

    // الإدارة
    { key: "branches", label: "الفروع والأقسام", group: "الإدارة" },
    { key: "company_records", label: "سجلات الشركة", group: "الإدارة" },
    { key: "policies", label: "سياسات الشركة", group: "الإدارة" },
    { key: "legal_affairs", label: "الشؤون القانونية", group: "الإدارة" },
    { key: "reports", label: "التقارير", group: "الإدارة" },
    { key: "permissions", label: "الصلاحيات", group: "الإدارة" },
    { key: "user_management", label: "إدارة المستخدمين", group: "الإدارة" },

    // أخرى
    { key: "settings", label: "الإعدادات", group: "أخرى" },
    { key: "my_portal", label: "بوابتي", group: "أخرى" },
];

// =============================
// GET PERMISSION ROLES
// =============================
export const getPermissionRoles = async () => {
    const result = await apiFetch("/permissions/roles");
  
    return result;
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
