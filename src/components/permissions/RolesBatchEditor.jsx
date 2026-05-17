import { useState, useEffect } from "react";
import { Save, RotateCcw, Check, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ROLE_ACCESS } from "../../lib/useRole";
import { logPermissionChange } from "../../lib/auditLog";

const ROLE_OPTIONS = [
  { value: "employee",        label: "موظف",                    color: "bg-gray-100 text-gray-700" },
  { value: "dept_manager",    label: "مدير قسم",                color: "bg-blue-100 text-blue-700" },
  { value: "hr",              label: "موارد بشرية (HR)",        color: "bg-purple-100 text-purple-700" },
  { value: "general_manager", label: "مدير عام",                color: "bg-amber-100 text-amber-700" },
  { value: "ceo",             label: "الرئيس التنفيذي (CEO)",   color: "bg-green-100 text-green-700" },
  { value: "accountant",      label: "محاسب",                   color: "bg-teal-100 text-teal-700" },
  { value: "admin",           label: "مدير النظام",             color: "bg-red-100 text-red-700" },
];

const SECTIONS = [
  { key: "dashboard",         label: "لوحة التحكم" },
  { key: "employees",         label: "الموظفون" },
  { key: "recruitment",       label: "التوظيف" },
  { key: "leaves",            label: "الإجازات" },
  { key: "attendance",        label: "الحضور" },
  { key: "missions",          label: "المهمات والسفر" },
  { key: "transfers",         label: "حركة النقل" },
  { key: "end-of-service",    label: "نهاية الخدمة" },
  { key: "violations",        label: "المخالفات" },
  { key: "deductions",        label: "الخصومات" },
  { key: "bonuses",           label: "المكافآت" },
  { key: "payroll",           label: "الرواتب" },
  { key: "accounting",        label: "المحاسبة" },
  { key: "financial-reports", label: "التقارير المالية" },
  { key: "tasks",             label: "المهام" },
  { key: "requests",          label: "الطلبات" },
  { key: "assets",            label: "إدارة الأصول" },
  { key: "meetings",          label: "الاجتماعات" },
  { key: "legal",             label: "الشؤون القانونية" },
  { key: "policies",          label: "السياسات" },
  { key: "branches",          label: "الفروع والأقسام" },
  { key: "company-records",   label: "سجلات الشركة" },
  { key: "reports",           label: "التقارير" },
  { key: "permissions",       label: "الصلاحيات" },
  { key: "settings",          label: "الإعدادات" },
  { key: "ess",               label: "بوابتي" },
];

function getDefaultNav(roleValue) {
  const access = ROLE_ACCESS[roleValue] || ROLE_ACCESS.employee;
  if (access.nav.includes("all")) return SECTIONS.map(s => s.key);
  return access.nav;
}

function getPermsForRole(roleValue, users) {
  const usersInRole = users.filter(u => u.role === roleValue);
  const withCustom = usersInRole.find(u => u.custom_permissions?.length > 0);
  return withCustom ? withCustom.custom_permissions : getDefaultNav(roleValue);
}

export default function RolesBatchEditor({ users, onUsersUpdated }) {
  const [selectedRole, setSelectedRole] = useState("employee");
  const [rolePerms, setRolePerms] = useState(() => {
    const init = {};
    ROLE_OPTIONS.forEach(r => { init[r.value] = getPermsForRole(r.value, users); });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRolePerms(prev => {
      const updated = { ...prev };
      ROLE_OPTIONS.forEach(r => {
        const usersInRole = users.filter(u => u.role === r.value);
        const withCustom = usersInRole.find(u => u.custom_permissions?.length > 0);
        if (withCustom) updated[r.value] = withCustom.custom_permissions;
      });
      return updated;
    });
  }, [users]);

  const currentPerms = rolePerms[selectedRole] || [];
  const usersInRole = users.filter(u => u.role === selectedRole);

  const toggle = (key) => {
    setRolePerms(prev => {
      const curr = prev[selectedRole] || [];
      const updated = curr.includes(key) ? curr.filter(k => k !== key) : [...curr, key];
      return { ...prev, [selectedRole]: updated };
    });
    setSaved(false);
  };

  const reset = () => {
    setRolePerms(prev => ({ ...prev, [selectedRole]: getDefaultNav(selectedRole) }));
    setSaved(false);
  };

  const saveForRole = async () => {
    setSaving(true);
    const newPerms = rolePerms[selectedRole];
    await Promise.all(
      usersInRole.map(u => base44.entities.User.update(u.id, { custom_permissions: newPerms }))
    );
    await logPermissionChange({
      changeType:  "role_batch",
      targetRole:  selectedRole,
      oldValue:    null,
      newValue:    newPerms,
      description: `تحديث صلاحيات دور "${selectedRole}" (${usersInRole.length} مستخدم)`,
    });
    onUsersUpdated(users.map(u => u.role === selectedRole ? { ...u, custom_permissions: newPerms } : u));
    setSaving(false);
    setSaved(true);
  };

  const roleOpt = ROLE_OPTIONS.find(r => r.value === selectedRole);

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        اختر دورًا وعدّل صلاحياته — سيتم تطبيق التغييرات على جميع مستخدمي هذا الدور.
      </p>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map(r => {
          const count = users.filter(u => u.role === r.value).length;
          return (
            <button key={r.value} onClick={() => { setSelectedRole(r.value); setSaved(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
                ${selectedRole === r.value
                  ? "border-primary bg-primary/5 text-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.color}`}>{r.label}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />{count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Editor */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              صلاحيات دور: <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mr-1 ${roleOpt?.color}`}>{roleOpt?.label}</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {usersInRole.length} مستخدم في هذا الدور — {currentPerms.length} صلاحية مفعّلة
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" /> إعادة تعيين
            </button>
            <button onClick={saveForRole} disabled={saving || usersInRole.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-50
                ${saved ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
              {saved ? <><Check className="w-3.5 h-3.5" />محفوظ</> : saving ? "جاري الحفظ..." : <><Save className="w-3.5 h-3.5" />حفظ للجميع</>}
            </button>
          </div>
        </div>

        {usersInRole.length === 0 && (
          <div className="p-4 bg-muted/30 rounded-lg text-sm text-muted-foreground text-center">
            لا يوجد مستخدمون بهذا الدور حالياً
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {SECTIONS.map(sec => {
            const active = currentPerms.includes(sec.key);
            return (
              <button key={sec.key} onClick={() => toggle(sec.key)}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-center select-none
                  ${active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                  }`}>
                {active ? "✓ " : "✗ "}{sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users affected */}
      {usersInRole.length > 0 && (
        <div className="bg-muted/30 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">المستخدمون المتأثرون بالحفظ:</p>
          <div className="flex flex-wrap gap-2">
            {usersInRole.map(u => (
              <span key={u.id} className="flex items-center gap-1.5 px-2 py-1 bg-card border border-border rounded-lg text-xs text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {u.full_name?.charAt(0)}
                </span>
                {u.full_name}
                {u.custom_permissions?.length > 0 && <span className="text-amber-500 text-xs">•</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}