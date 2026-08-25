/**
 * PermissionsContext
 * ==================
 * Global context يحمل صلاحيات المستخدم الحالي ويوفّر:
 * - canSee(path)          → هل يظهر القسم في Sidebar؟
 * - canDo(module, action) → هل يمكن تنفيذ عملية CRUD؟
 * - refreshPermissions()  → تحديث الصلاحيات بدون reload للصفحة
 *
 * ⚠️  BACKEND NOTE:
 * الـ Backend الحالي يدعم 25 key فقط ولا يحفظ:
 *   home, accounting, loan_management, user_management,
 *   storage_dashboard, storage_units, storage_bookings,
 *   storage_contracts, storage_crm
 * هذه الـ keys يتم التعامل معها عبر ROLE_ACCESS fallback.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getCurrentUser } from "../api/authApi";
import { getEmployeePermissions, getPermissionRoles } from "../api/permissionsApi";
import { getEffectiveCrudPermissions } from "./crudPermissions";

// ─── Backend role string → internal snake_case role key ────────────────────
// الباك إند بيرجع الرول كنص وصفي (زي "Department manager" أو "General Manager")
// مش بصيغة الـ key اللي باقي الكود بيستخدمها (dept_manager, general_manager...).
// لازم نطابقهم هنا صراحة — مجرد .toLowerCase() مش كفاية لأن فيه مسافات
// وفروق تسمية ("Department" مقابل "dept").
const BACKEND_ROLE_TO_KEY = {
    "admin": "admin",
    "ceo": "ceo",
    "general manager": "general_manager",
    "hr": "hr",
    "department manager": "dept_manager",
    "accountant": "accountant",
    "employee": "employee",
    "user": "user",
};

function normalizeRole(rawRole) {
    const normalized = (rawRole || "").toLowerCase().trim();
    return BACKEND_ROLE_TO_KEY[normalized] || normalized;
}

// ─── API key → sidebar nav path ─────────────────────────────────────────────

const PERMISSION_KEY_TO_NAV = {
    dashboard: "dashboard",
    home: "home",
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
    loan_management: "loan-management",
    tasks: "tasks",
    requests: "requests",
    assets: "assets",
    expenses: "expenses",
    meetings: "meetings",
    salaries: "payroll",
    accounting: "accounting",
    financial_reports: "financial-reports",
    company_records: "company-records",
    reports: "reports",
    permissions: "permissions",
    legal_affairs: "legal",
    policies: "policies",
    branches: "branches",
    settings: "settings",
    my_portal: "ess",
    user_management: "user-management",
    storage_dashboard: "storage-dashboard",
    storage_units: "storage-units",
    storage_bookings: "storage-bookings",
    storage_contracts: "storage-contracts",
    storage_crm: "storage-crm",
};

const NAV_TO_PERMISSION_KEY = Object.fromEntries(
    Object.entries(PERMISSION_KEY_TO_NAV).map(([k, v]) => [v, k])
);

// ─── Keys الـ Backend لا يحفظها حالياً ───────────────────────────────────────
// لو key مش موجود في rolePerms وكان في القائمة دي →
// نرجع للـ ROLE_ACCESS fallback بدل ما نخفيه
const BACKEND_UNSUPPORTED_KEYS = new Set([
    "home",
    "accounting",
    "loan_management",
    "user_management",
    "storage_dashboard",
    "storage_units",
    "storage_bookings",
    "storage_contracts",
    "storage_crm",
    "expenses",
]);

// localStorage key مشترك مع RolesBatchEditor
const LS_OVERRIDES_KEY = "rolePermsOverrides";

function getStoredRoleOverrides(roleName) {
    try {
        const raw = localStorage.getItem(LS_OVERRIDES_KEY);
        if (!raw) return null;
        const all = JSON.parse(raw);
        // ابحث عن الـ role بغض النظر عن الـ case
        const matchedKey = Object.keys(all).find(
            (k) => k.toLowerCase() === roleName?.toLowerCase()
        );
        return matchedKey ? all[matchedKey] : null;
    } catch { return null; }
}

// ─── Fallback ثابت لو API فشل أو key غير مدعوم ──────────────────────────────
const ROLE_ACCESS = {
    employee: {
        nav: ["home", "ess", "leaves", "attendance", "violations", "deductions",
            "bonuses", "tasks", "requests", "meetings", "assets", "loan-management"],
    },
    dept_manager: {
        nav: ["home", "dashboard", "employees", "leaves", "attendance", "missions",
            "violations", "deductions", "bonuses", "tasks", "requests", "meetings",
            "transfers", "recruitment", "ess", "assets", "loan-management"],
    },
    hr: {
        nav: ["home", "dashboard", "employees", "recruitment", "leaves", "attendance",
            "missions", "termination", "violations", "deductions", "bonuses",
            "transfers", "tasks", "requests", "meetings", "payroll", "legal",
            "policies", "branches", "company-records", "reports", "ess",
            "assets", "loan-management"],
    },
    general_manager: {
        nav: ["home", "dashboard", "employees", "recruitment", "leaves", "attendance",
            "missions", "termination", "violations", "deductions", "bonuses",
            "transfers", "tasks", "requests", "meetings", "payroll", "legal",
            "policies", "branches", "company-records", "reports", "ess",
            "assets", "loan-management"],
    },
    ceo: { nav: ["all"] },
    accountant: { nav: ["home", "accounting", "financial-reports", "assets", "loan-management"] },
    admin: { nav: ["all"] },
    user: { nav: ["home", "ess", "assets"] },
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function normalizeKey(k) {
    return k?.replace(/-/g, "_").toLowerCase().trim() ?? "";
}

// ─── Context ─────────────────────────────────────────────────────────────────

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [rolePerms, setRolePerms] = useState(null);
    const [employeePerms, setEmployeePerms] = useState(null);
    const [hasOverrides, setHasOverrides] = useState(false);
    const [loading, setLoading] = useState(true);

    const isLoadingRef = useRef(false);

    // ─── loadPermissions ─────────────────────────────────────────────────────

    const loadPermissions = useCallback(async () => {
        // منع double-call
        if (isLoadingRef.current) return;
        isLoadingRef.current = true;
        setLoading(true);

        try {
            // 1. بيانات اليوزر
            const res = await getCurrentUser();
            const u = res?.data ?? res;
            if (!u) return;

            setUser(u);
            const rawRole = u?.role || "Employee";
            const normRole = normalizeRole(rawRole);
            setRole(normRole);

            // 2. صلاحيات الدور من API
            try {
                const rolesData = await getPermissionRoles();
                const payload = rolesData?.data ?? rolesData;

                if (payload && typeof payload === "object" && !Array.isArray(payload)) {
                    // match role name بغض النظر عن الـ case
                    const matchedKey = Object.keys(payload).find(
                        (k) => k.toLowerCase().trim() === rawRole.toLowerCase().trim()
                    );

                    if (matchedKey) {
                        const normalizedPerms = {};
                        Object.entries(payload[matchedKey] || {}).forEach(([k, v]) => {
                            normalizedPerms[normalizeKey(k)] = v;
                        });

                        // ✨ اقرأ الـ unsupported keys من localStorage
                        const storedOverrides = getStoredRoleOverrides(matchedKey);
                        if (storedOverrides) {
                            Object.entries(storedOverrides).forEach(([k, v]) => {
                                normalizedPerms[normalizeKey(k)] = v;
                            });
                        }

                        setRolePerms(normalizedPerms);
                    } else {
                        setRolePerms(null);
                    }
                } else {
                    setRolePerms(null);
                }
            } catch {
                setRolePerms(null);
            }

            // 3. صلاحيات الموظف المخصصة (overrides)
            const employeeId = u?.employee_id;
            if (employeeId) {
                try {
                    const permData = await getEmployeePermissions(employeeId);
                    const permPayload = permData?.data ?? permData;
                    const overrides = permPayload?.has_overrides ?? false;

                    setHasOverrides(overrides);
                    setEmployeePerms(overrides ? (permPayload?.permissions ?? null) : null);
                } catch {
                    setHasOverrides(false);
                    setEmployeePerms(null);
                }
            }
        } catch (err) {
            console.error("PermissionsContext load error:", err);
        } finally {
            setLoading(false);
            isLoadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        loadPermissions();
    }, [loadPermissions]);

    // ─── refreshPermissions ───────────────────────────────────────────────────

    const refreshPermissions = useCallback(async () => {
        isLoadingRef.current = false;  // reset lock
        await loadPermissions();
    }, [loadPermissions]);

    // ─── canSee ───────────────────────────────────────────────────────────────

    const canSee = useCallback(
        (path) => {
            const permKey = normalizeKey(NAV_TO_PERMISSION_KEY[path] ?? "");

            // ── Priority 1: Employee-level overrides ──
            if (hasOverrides && employeePerms) {
                const normalizedEmpPerms = {};
                Object.entries(employeePerms).forEach(([k, v]) => {
                    normalizedEmpPerms[normalizeKey(k)] = v;
                });
                if (permKey && permKey in normalizedEmpPerms) {
                    return normalizedEmpPerms[permKey]?.is_active === true;
                }
            }

            // ── Priority 2: Role permissions from API ──
            if (rolePerms && Object.keys(rolePerms).length > 0) {
                // الـ key موجود في API → استخدم قيمته مباشرة
                if (permKey && permKey in rolePerms) {
                    return rolePerms[permKey] === true;
                }

                // الـ key غير موجود في API:
                //   (a) لو ده key الـ Backend لا يدعمه → fallback للـ ROLE_ACCESS
                if (BACKEND_UNSUPPORTED_KEYS.has(permKey)) {
                    const access = ROLE_ACCESS[role] || ROLE_ACCESS.employee;
                    if (access.nav.includes("all")) return true;
                    return access.nav.includes(path);
                }

                //   (b) key مدعوم لكن مش موجود → الـ Backend قرر إخفاؤه
                return false;
            }

            // ── Priority 3: Hardcoded fallback (API unavailable) ──
            const access = ROLE_ACCESS[role] || ROLE_ACCESS.employee;
            if (access.nav.includes("all")) return true;
            return access.nav.includes(path);
        },
        [hasOverrides, employeePerms, rolePerms, role]
    );

    // ─── canDo ────────────────────────────────────────────────────────────────

    const canDo = useCallback(
        (module, action) => {
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

            // Priority 1: employee overrides
            if (hasOverrides && employeePerms && module in employeePerms) {
                return employeePerms[module]?.[apiField] === true;
            }

            // Priority 2: role defaults (hardcoded)
            const perms = getEffectiveCrudPermissions(user);
            return (perms[module] || []).includes(action);
        },
        [hasOverrides, employeePerms, user]
    );

    // ─── value ────────────────────────────────────────────────────────────────

    return (
        <PermissionsContext.Provider value={{
            user,
            role,
            loading,
            canSee,
            canDo,
            refreshPermissions,
            access: ROLE_ACCESS[role] || ROLE_ACCESS.employee,
        }}>
            {children}
        </PermissionsContext.Provider>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePermissions() {
    const ctx = useContext(PermissionsContext);
    if (!ctx) throw new Error("usePermissions must be used inside <PermissionsProvider>");
    return ctx;
}
