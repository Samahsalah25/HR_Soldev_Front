/**
 * CRUD Permissions System
 * Defines per-module CRUD+Approve permissions with role defaults.
 * User-level overrides in user.crud_permissions take precedence.
 */

export const CRUD_MODULES = [
  { key: "employees",   label: "الموظفون",           hasApprove: false },
  { key: "attendance",  label: "الحضور",              hasApprove: true  },
  { key: "leaves",      label: "الإجازات",            hasApprove: true  },
  { key: "payroll",     label: "الرواتب",             hasApprove: true  },
  { key: "violations",  label: "المخالفات",           hasApprove: true  },
  { key: "deductions",  label: "الخصومات",            hasApprove: true  },
  { key: "bonuses",     label: "المكافآت",            hasApprove: true  },
  { key: "missions",    label: "المهمات والسفر",      hasApprove: true  },
  { key: "transfers",   label: "حركة النقل",          hasApprove: true  },
  { key: "recruitment", label: "التوظيف",             hasApprove: true  },
  { key: "tasks",       label: "المهام",              hasApprove: false },
  { key: "meetings",    label: "الاجتماعات",          hasApprove: false },
  { key: "reports",     label: "التقارير",            hasApprove: false },
  { key: "finance",     label: "المالية",             hasApprove: true  },
  { key: "settings",    label: "الإعدادات",           hasApprove: false },
  { key: "legal",       label: "الشؤون القانونية",    hasApprove: false },
];

export const CRUD_OPS = ["view", "create", "edit", "delete", "approve"];
export const CRUD_OP_LABELS = {
  view:    "عرض",
  create:  "إضافة",
  edit:    "تعديل",
  delete:  "حذف",
  approve: "اعتماد",
};

/** Default CRUD permissions per role */
const ROLE_CRUD_DEFAULTS = {
  employee: {
    employees:   ["view"],
    attendance:  ["view", "create"],
    leaves:      ["view", "create"],
    payroll:     [],
    violations:  [],
    deductions:  [],
    bonuses:     [],
    missions:    ["view", "create"],
    transfers:   [],
    recruitment: [],
    tasks:       ["view"],
    meetings:    ["view"],
    reports:     [],
    finance:     [],
    settings:    [],
    legal:       [],
  },
  dept_manager: {
    employees:   ["view"],
    attendance:  ["view", "create", "edit", "approve"],
    leaves:      ["view", "create", "edit", "approve"],
    payroll:     ["view"],
    violations:  ["view", "create"],
    deductions:  ["view"],
    bonuses:     ["view", "create"],
    missions:    ["view", "create", "edit", "approve"],
    transfers:   ["view", "create"],
    recruitment: ["view", "create"],
    tasks:       ["view", "create", "edit", "delete"],
    meetings:    ["view", "create", "edit", "delete"],
    reports:     ["view"],
    finance:     [],
    settings:    [],
    legal:       ["view"],
  },
  hr: {
    employees:   ["view", "create", "edit", "delete"],
    attendance:  ["view", "create", "edit", "delete", "approve"],
    leaves:      ["view", "create", "edit", "delete", "approve"],
    payroll:     ["view", "create", "edit", "approve"],
    violations:  ["view", "create", "edit", "delete", "approve"],
    deductions:  ["view", "create", "edit", "delete", "approve"],
    bonuses:     ["view", "create", "edit", "approve"],
    missions:    ["view", "create", "edit", "delete", "approve"],
    transfers:   ["view", "create", "edit", "delete", "approve"],
    recruitment: ["view", "create", "edit", "delete", "approve"],
    tasks:       ["view", "create", "edit", "delete"],
    meetings:    ["view", "create", "edit", "delete"],
    reports:     ["view", "create"],
    finance:     [],
    settings:    ["view"],
    legal:       ["view", "create", "edit", "delete"],
  },
  general_manager: {
    employees:   ["view", "create", "edit"],
    attendance:  ["view", "create", "edit", "approve"],
    leaves:      ["view", "create", "edit", "approve"],
    payroll:     ["view", "approve"],
    violations:  ["view", "create", "edit", "approve"],
    deductions:  ["view", "create", "edit", "approve"],
    bonuses:     ["view", "create", "edit", "delete", "approve"],
    missions:    ["view", "create", "edit", "approve"],
    transfers:   ["view", "create", "edit", "approve"],
    recruitment: ["view", "create", "edit", "approve"],
    tasks:       ["view", "create", "edit", "delete"],
    meetings:    ["view", "create", "edit", "delete"],
    reports:     ["view", "create"],
    finance:     ["view"],
    settings:    ["view"],
    legal:       ["view", "create", "edit", "delete"],
  },
  ceo: {
    employees:   ["view", "create", "edit", "delete", "approve"],
    attendance:  ["view", "create", "edit", "delete", "approve"],
    leaves:      ["view", "create", "edit", "delete", "approve"],
    payroll:     ["view", "create", "edit", "delete", "approve"],
    violations:  ["view", "create", "edit", "delete", "approve"],
    deductions:  ["view", "create", "edit", "delete", "approve"],
    bonuses:     ["view", "create", "edit", "delete", "approve"],
    missions:    ["view", "create", "edit", "delete", "approve"],
    transfers:   ["view", "create", "edit", "delete", "approve"],
    recruitment: ["view", "create", "edit", "delete", "approve"],
    tasks:       ["view", "create", "edit", "delete"],
    meetings:    ["view", "create", "edit", "delete"],
    reports:     ["view", "create", "edit", "delete"],
    finance:     ["view", "create", "edit", "delete", "approve"],
    settings:    ["view", "create", "edit", "delete"],
    legal:       ["view", "create", "edit", "delete"],
  },
  accountant: {
    employees:   ["view"],
    attendance:  ["view"],
    leaves:      ["view"],
    payroll:     ["view", "create", "edit"],
    violations:  ["view"],
    deductions:  ["view"],
    bonuses:     ["view"],
    missions:    ["view"],
    transfers:   ["view"],
    recruitment: [],
    tasks:       ["view"],
    meetings:    ["view"],
    reports:     ["view", "create"],
    finance:     ["view", "create", "edit", "delete", "approve"],
    settings:    ["view"],
    legal:       ["view"],
  },
  admin: {
    employees:   ["view", "create", "edit", "delete", "approve"],
    attendance:  ["view", "create", "edit", "delete", "approve"],
    leaves:      ["view", "create", "edit", "delete", "approve"],
    payroll:     ["view", "create", "edit", "delete", "approve"],
    violations:  ["view", "create", "edit", "delete", "approve"],
    deductions:  ["view", "create", "edit", "delete", "approve"],
    bonuses:     ["view", "create", "edit", "delete", "approve"],
    missions:    ["view", "create", "edit", "delete", "approve"],
    transfers:   ["view", "create", "edit", "delete", "approve"],
    recruitment: ["view", "create", "edit", "delete", "approve"],
    tasks:       ["view", "create", "edit", "delete"],
    meetings:    ["view", "create", "edit", "delete"],
    reports:     ["view", "create", "edit", "delete"],
    finance:     ["view", "create", "edit", "delete", "approve"],
    settings:    ["view", "create", "edit", "delete"],
    legal:       ["view", "create", "edit", "delete"],
  },
  user: {
    employees:   ["view"],
    attendance:  ["view", "create"],
    leaves:      ["view", "create"],
    payroll:     [],
    violations:  [],
    deductions:  [],
    bonuses:     [],
    missions:    ["view", "create"],
    transfers:   [],
    recruitment: [],
    tasks:       ["view"],
    meetings:    ["view"],
    reports:     [],
    finance:     [],
    settings:    [],
    legal:       [],
  },
};

/**
 * Resolve effective CRUD permissions for a user.
 * User-level crud_permissions override role defaults per module.
 */
export function getEffectiveCrudPermissions(user) {
  const role = user?.role || "employee";
  const defaults = ROLE_CRUD_DEFAULTS[role] || ROLE_CRUD_DEFAULTS.employee;
  const overrides = user?.crud_permissions || {};

  const result = {};
  CRUD_MODULES.forEach(mod => {
    // If user has an explicit override for this module, use it; else use role default
    result[mod.key] = overrides[mod.key] !== undefined
      ? overrides[mod.key]
      : (defaults[mod.key] || []);
  });
  return result;
}

/**
 * Check if user can perform an action on a module.
 */
export function canDo(user, module, action) {
  const perms = getEffectiveCrudPermissions(user);
  return (perms[module] || []).includes(action);
}

export function getRoleCrudDefaults(role) {
  return ROLE_CRUD_DEFAULTS[role] || ROLE_CRUD_DEFAULTS.employee;
}