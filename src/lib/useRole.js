import { useState, useEffect } from "react";
import { getCurrentUser } from '../api/authApi';
import { getEmployeePermissions, getPermissionRoles } from '../api/permissionsApi';

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
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "end-of-service", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management"],
    canSeePayroll: true, canSeeAccounting: false, canSeeSettings: false, canSeeAllEmployees: true, isHR: true,
  },
  general_manager: {
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "end-of-service", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management"],
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
    const loadUser = async () => {
      try {
        const res = await getCurrentUser();
        const u = res?.data ?? res;
        setUser(u);

        const rawRole = u?.role || "Employee";
        setRole(rawRole.toLowerCase().trim());

        // جيب صلاحيات الدور من الـ API
        try {
          const rolesData = await getPermissionRoles();

          // === DEBUG: اطبع الـ response عشان نفهم شكله ===
          console.log("🔴 /permissions/roles response:", JSON.stringify(rolesData).slice(0, 500));
          console.log("🔴 rawRole from /auth/me:", rawRole);

          const payload = rolesData?.data ?? rolesData;
          const keys = Object.keys(payload || {});
          console.log("🔴 payload keys:", keys);

          if (payload && typeof payload === "object" && !Array.isArray(payload)) {
            const matchedKey = keys.find(
              k => k.toLowerCase().trim() === rawRole.toLowerCase().trim()
            );
            console.log("🔴 matchedKey:", matchedKey);

            if (matchedKey && payload[matchedKey]) {
              console.log("🔴 rolePerms found:", JSON.stringify(payload[matchedKey]).slice(0, 300));
              setRolePerms(payload[matchedKey]);
            } else {
              console.warn("🔴 NO MATCH — rawRole:", rawRole, "available keys:", keys);
            }
          }
        } catch (e) {
          console.warn("Could not load role permissions:", e);
        }

        // جيب صلاحيات الموظف المخصصة
        const employeeId = u?.employee_id;
        if (employeeId) {
          try {
            const permData = await getEmployeePermissions(employeeId);
            const permPayload = permData?.data ?? permData;
            const overrides = permPayload?.has_overrides ?? false;
            setHasOverrides(overrides);
            if (overrides && permPayload?.permissions) {
              setEmployeePerms(permPayload.permissions);
            }
          } catch (e) {
            console.warn("Could not load employee permissions:", e);
          }
        }
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const access = getRoleAccess(role);

  const canSee = (path) => {
    const permKey = Object.entries(PERMISSION_KEY_TO_NAV).find(
      ([, navPath]) => navPath === path
    )?.[0];

    // الأولوية 1: صلاحيات مخصصة للموظف
    if (hasOverrides && employeePerms && permKey) {
      return employeePerms[permKey]?.is_active === true;
    }

    // الأولوية 2: صلاحيات الدور من الـ API
    if (rolePerms && permKey) {
      return rolePerms[permKey] === true;
    }

    // الأولوية 3: fallback ثابت في الكود
    if (!access) return false;
    if (access.nav.includes("all")) return true;
    return access.nav.includes(path);
  };

  return { role, user, access, loading, canSee };
}
