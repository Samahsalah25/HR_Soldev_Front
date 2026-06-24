import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {getCurrentUser} from '../api/authApi'
// Role definitions
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
    canSeePayroll: false,
    canSeeAccounting: false,
    canSeeSettings: false,
    canSeeAllEmployees: false,
    isEmployee: true,
  },
  dept_manager: {
    nav: ["dashboard", "employees", "leaves", "attendance", "missions", "violations", "deductions", "bonuses", "tasks", "requests", "meetings", "transfers", "recruitment", "ess", "assets", "loan-management"],
    canSeePayroll: false,
    canSeeAccounting: false,
    canSeeSettings: false,
    canSeeAllEmployees: false,
    isDeptManager: true,
  },
  hr: {
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "end-of-service", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management"],
    canSeePayroll: true,
    canSeeAccounting: false,
    canSeeSettings: false,
    canSeeAllEmployees: true,
    isHR: true,
  },
  general_manager: {
    nav: ["dashboard", "employees", "recruitment", "leaves", "attendance", "missions", "end-of-service", "violations", "deductions", "bonuses", "transfers", "tasks", "requests", "meetings", "payroll", "legal", "policies", "branches", "company-records", "reports", "ess", "assets", "loan-management"],
    canSeePayroll: true,
    canSeeAccounting: false,
    canSeeSettings: false,
    canSeeAllEmployees: true,
    isGM: true,
  },
  ceo: {
    nav: ["all"],
    canSeePayroll: true,
    canSeeAccounting: true,
    canSeeSettings: true,
    canSeeAllEmployees: true,
    isCEO: true,
  },
  accountant: {
    nav: ["accounting", "financial-reports", "assets", "loan-management"],
    canSeePayroll: false,
    canSeeAccounting: true,
    canSeeSettings: false,
    canSeeAllEmployees: false,
    isAccountant: true,
  },
  admin: {
    nav: ["all"],
    canSeePayroll: true,
    canSeeAccounting: true,
    canSeeSettings: true,
    canSeeAllEmployees: true,
    isAdmin: true,
  },
  user: {
    nav: ["ess", "assets"],
    canSeePayroll: false,
    canSeeAccounting: false,
    canSeeSettings: false,
    canSeeAllEmployees: false,
    isEmployee: true,
  },
};

export function getRoleAccess(role) {
  return ROLE_ACCESS[role] || ROLE_ACCESS.employee;
}

export function useRole() {
  const [role, setRole] = useState(null);
  const [user, setUser] = useState(null);
  const [customPerms, setCustomPerms] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await getCurrentUser();

        // حسب الـ API عندك
        const u = res?.data || res;

        setUser(u);
        setRole(u?.role?.toLowerCase() || "user");
        setCustomPerms(u?.custom_permissions?.length ? u.custom_permissions : null);
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
    // admin always sees everything regardless of custom permissions
    if (role === "admin") return true;
    if (customPerms) return customPerms.includes(path);
    if (!access) return false;
    if (access.nav.includes("all")) return true;
    return access.nav.includes(path);
  };

  return { role, user, access, loading, canSee };
}