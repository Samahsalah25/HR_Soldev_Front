import { useState, useEffect } from "react";
import { getCurrentUser } from '../api/authApi';
import { getEmployeePermissions, getPermissionRoles } from '../api/permissionsApi';
import { getEffectiveCrudPermissions } from './crudPermissions';

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
    nav: ["ess", "leaves", "attendance", "violations", "deductions", "bonuses", "tasks", "requests", "meetings", "assets", "loan-management"],
    canSeePayroll: false, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: false, isEmployee: true,
  },
  dept_manager: {
    nav: ["dashboard", "employees", "leaves", "attendance", "missions", "violations", "deductions", "bonuses", "tasks", "requests", "meetings", "transfers", "recruitment", "ess", "assets", "loan-management"],
    canSeePayroll: false, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: false, isDeptManager: true,
  },
  hr: {
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "termination", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management"],
    canSeePayroll: true, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: true, isHR: true,
  },
  general_manager: {
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "termination", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management"],
    canSeePayroll: true, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: true, isGM: true,
  },
  ceo: {
    nav: ["all"],
    canSeePayroll: true, canSeeAccounting: true, canSeeSettings: true, canSeeAllEmployees: true, isCEO: true,
  },
  accountant: {
    nav: ["accounting", "financial-reports", "assets", "loan-management"],
    canSeePayroll: false, canSeeAccounting: true, canSeeSettings: false, canSeeAllEmployees: false, isAccountant: true,
  },
  admin: {
    nav: ["all"],
    canSeePayroll: true, canSeeAccounting: true, canSeeSettings: true, canSeeAllEmployees: true, isAdmin: true,
  },
  user: {
    nav: ["ess", "assets"],
    canSeePayroll: false, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: false, isEmployee: true,
  },
};

// Map: permissions API key → sidebar nav path
const PERMISSION_KEY_TO_NAV = {
  dashboard: "dashboard",
  employees: "employees",
  recruitment: "recruitment",
  leaves: "leaves",
  attendance: "attendance",
  transfers: "transfers",
  end_of_service: "termination",
  violations: "violations",
  deductions: "deductions",
  rewards: "bonuses",
  missions: "missions",
  tasks: "tasks",
  requests: "requests",
  assets: "assets",
  meetings: "meetings",
  salaries: "payroll",
  financial_reports: "financial-reports",
  company_records: "company-records",
  reports: "reports",
  permissions: "permissions",
  legal_affairs: "legal",
  policies: "policies",
  branches: "branches",
  settings: "settings",
  my_portal: "ess",
};

// Map عكسي: nav path → permissions API key
const NAV_TO_PERMISSION_KEY = Object.fromEntries(
  Object.entries(PERMISSION_KEY_TO_NAV).map(([k, v]) => [v, k])
);

export function getRoleAccess(role) {
  return ROLE_ACCESS[role] || ROLE_ACCESS.employee;
}

export function useRole() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [employeePerms, setEmployeePerms] = useState(null);
  const [rolePerms, setRolePerms] = useState(null);
  const [hasOverrides, setHasOverrides] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        // 1. جيب بيانات اليوزر
        const res = await getCurrentUser();
        const u = res?.data ?? res;
        if (cancelled) return;

        setUser(u);
        const rawRole = u?.role || "Employee";
        setRole(rawRole.toLowerCase().trim());

        // 2. جيب صلاحيات الدور من الـ API
        try {
          const rolesData = await getPermissionRoles();
          if (cancelled) return;

          // الـ response: { success, data: { Admin: { dashboard: true, ... }, HR: {...}, ... } }
          const payload = rolesData?.data ?? rolesData;

          if (payload && typeof payload === "object" && !Array.isArray(payload)) {
            const matchedKey = Object.keys(payload).find(
              k => k.toLowerCase().trim() === rawRole.toLowerCase().trim()
            );
            setRolePerms(matchedKey ? payload[matchedKey] : null);
          } else {
            setRolePerms(null);
          }
        } catch {
          if (!cancelled) setRolePerms(null);
        }

        // 3. جيب صلاحيات الموظف المخصصة
        const employeeId = u?.employee_id;
        if (employeeId) {
          try {
            const permData = await getEmployeePermissions(employeeId);
            if (cancelled) return;

            const permPayload = permData?.data ?? permData;
            const overrides = permPayload?.has_overrides ?? false;
            setHasOverrides(overrides);
            setEmployeePerms(overrides ? (permPayload?.permissions ?? null) : null);
          } catch {
            if (!cancelled) {
              setHasOverrides(false);
              setEmployeePerms(null);
            }
          }
        }
      } catch (err) {
        console.log("useRole load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  const access = getRoleAccess(role);

  const canSee = (path) => {
    const permKey = NAV_TO_PERMISSION_KEY[path];

    if (hasOverrides && employeePerms) {
      if (permKey && permKey in employeePerms) {
        return employeePerms[permKey]?.is_active === true;
      }
      return false;
    }

    if (rolePerms) {
      if (permKey && permKey in rolePerms) {
        return rolePerms[permKey] === true;
      }
      return false;
    }

    if (!access) return false;
    if (access.nav.includes("all")) return true;
    return access.nav.includes(path);
  };

  /**
   * تحقق من صلاحية CRUD داخل صفحة معينة
   * module: employees | leaves | attendance | ...
   * action: create | edit | delete | view | approve
   */
  const canDo = (module, action) => {
    // Map من action → API field في employeePerms
    const fieldMap = {
      view: "can_read",
      read: "can_read",
      create: "can_create",
      edit: "can_update",
      update: "can_update",
      delete: "can_delete",
      approve: "can_create",
    };
    const apiField = fieldMap[action] || `can_${action}`;

    // الأولوية 1: صلاحيات مخصصة للموظف
    if (hasOverrides && employeePerms && module in employeePerms) {
      return employeePerms[module]?.[apiField] === true;
    }

    // الأولوية 2: role defaults ثابتة في الكود
    const perms = getEffectiveCrudPermissions(user);
    return (perms[module] || []).includes(action);
  };

  return { role, user, access, loading, canSee, canDo };
}
