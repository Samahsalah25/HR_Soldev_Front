/**
 * useRole Hook
 * ============
 * Wrapper hook للوصول لـ PermissionsContext
 * يستخدم نفس الصلاحيات المشتركة في كل التطبيق
 */

import { usePermissions } from './PermissionsContext';

export const ROLES = {
  EMPLOYEE: "employee",
  DEPT_MANAGER: "dept_manager",
  HR: "hr",
  GENERAL_MANAGER: "general_manager",
  CEO: "ceo",
  ACCOUNTANT: "accountant",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  employee: "موظف",
  dept_manager: "مدير قسم",
  hr: "موارد بشرية (HR)",
  general_manager: "مدير عام",
  ceo: "الرئيس التنفيذي (CEO)",
  accountant: "محاسب",
  admin: "مدير النظام",
  user: "مستخدم",
};

export const ROLE_ACCESS = {
  employee: {
    nav: ["ess", "leaves", "attendance", "violations", "deductions", "bonuses", "tasks", "requests", "meetings", "assets", "loan-management", "expenses"],
    canSeePayroll: false, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: false, isEmployee: true,
  },
  dept_manager: {
    nav: ["dashboard", "employees", "leaves", "attendance", "missions", "violations", "deductions", "bonuses", "tasks", "requests", "meetings", "transfers", "recruitment", "ess", "assets", "loan-management", "expenses"],
    canSeePayroll: false, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: false, isDeptManager: true,
  },
  hr: {
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "termination", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management", "expenses"],
    canSeePayroll: true, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: true, isHR: true,
  },
  general_manager: {
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "termination", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management", "expenses"],
    canSeePayroll: true, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: true, isGM: true,
  },
  ceo: {
    nav: ["all"],
    canSeePayroll: true, canSeeAccounting: true, canSeeSettings: true, canSeeAllEmployees: true, isCEO: true,
  },
  accountant: {
    nav: ["accounting", "financial-reports", "assets", "loan-management", "expenses"],
    canSeePayroll: false, canSeeAccounting: true, canSeeSettings: false, canSeeAllEmployees: false, isAccountant: true,
  },
  admin: {
    nav: ["all"],
    canSeePayroll: true, canSeeAccounting: true, canSeeSettings: true, canSeeAllEmployees: true, isAdmin: true,
  },
  user: {
    nav: ["ess", "assets", "expenses"],
    canSeePayroll: false, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: false, isEmployee: true,
  },
};

export function getRoleAccess(role) {
  return ROLE_ACCESS[role] || ROLE_ACCESS.employee;
}

/**
 * Main Hook — يستخدم PermissionsContext مباشرةً
 * يرجع: { role, user, access, loading, canSee, canDo, refreshPermissions }
 */
export function useRole() {
  return usePermissions();
}
