import { useState, useEffect, Fragment } from "react";
import { Shield, Search, Check, Save, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { ROLE_ACCESS } from "../lib/useRole";
import RolesBatchEditor from "../components/permissions/RolesBatchEditor";
import CrudPermissionsEditor from "../components/permissions/CrudPermissionsEditor";
import AuditLogViewer from "../components/permissions/AuditLogViewer";
import { logPermissionChange } from "../lib/auditLog";

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
  { key: "meetings",          label: "الاجتماعات" },
  { key: "legal",             label: "الشؤون القانونية" },
  { key: "policies",          label: "السياسات" },
  { key: "branches",          label: "الفروع والأقسام" },
  { key: "company-records",   label: "سجلات الشركة" },
  { key: "reports",           label: "التقارير" },
  { key: "permissions",       label: "الصلاحيات" },
  { key: "settings",          label: "الإعدادات" },
  { key: "ess",               label: "بوابتي" },
  { key: "assets",            label: "إدارة الأصول" },
  { key: "loan-management",   label: "السلف والقروض" },
  { key: "storage-dashboard", label: "لوحة التخزين" },
  { key: "storage-units",     label: "وحدات التخزين" },
  { key: "storage-bookings",  label: "حجوزات التخزين" },
  { key: "storage-contracts", label: "عقود التخزين" },
  { key: "storage-crm",       label: "CRM العملاء" },
  { key: "user-management",   label: "إدارة المستخدمين" },
];

function getRoleNav(role) {
  const access = ROLE_ACCESS[role] || ROLE_ACCESS.employee;
  if (access.nav.includes("all")) return SECTIONS.map(s => s.key);
  return access.nav;
}

function UserPermissionsEditor({ user, onSaved }) {
  const [perms, setPerms] = useState(
    user.custom_permissions?.length ? user.custom_permissions : getRoleNav(user.role || "employee")
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPerms(user.custom_permissions?.length ? user.custom_permissions : getRoleNav(user.role || "employee"));
    setSaved(false);
  }, [user.id, user.role]);

  const toggle = (key) => {
    setPerms(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);
    setSaved(false);
  };

  const reset = () => {
    setPerms(getRoleNav(user.role || "employee"));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    const old = user.custom_permissions;
    await base44.entities.User.update(user.id, { custom_permissions: perms });
    await logPermissionChange({
      changeType:     "nav_permissions",
      targetUserId:   user.id,
      targetUserName: user.full_name,
      oldValue:       old,
      newValue:       perms,
      description:    `تعديل صلاحيات التنقل للمستخدم ${user.full_name}`,
    });
    setSaving(false);
    setSaved(true);
    onSaved(user.id, perms);
  };

  return (
    <div className="bg-background rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm text-foreground">صلاحيات التنقل</h3>
          <p className="text-xs text-muted-foreground mt-0.5">اضغط على القسم لتفعيل أو إلغاء الوصول إليه</p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />إعادة تعيين
          </button>
          <button onClick={save} disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${saved ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            {saved ? <><Check className="w-3.5 h-3.5" />محفوظ</> : saving ? "حفظ..." : <><Save className="w-3.5 h-3.5" />حفظ</>}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
        {SECTIONS.map(sec => {
          const active = perms.includes(sec.key);
          return (
            <button key={sec.key} onClick={() => toggle(sec.key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center select-none
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
  );
}

export default function Permissions() {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [savingRole, setSavingRole] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [activeView, setActiveView] = useState("users");

  useEffect(() => {
    base44.entities.User.list().then(us => { setUsers(us); setLoading(false); });
  }, []);

  const updateRole = async (userId, role) => {
    setSavingRole(s => ({ ...s, [userId]: true }));
    const target = users.find(u => u.id === userId);
    const oldRole = target?.role;
    await base44.entities.User.update(userId, { role, custom_permissions: [], crud_permissions: {} });
    setUsers(us => us.map(u => u.id === userId ? { ...u, role, custom_permissions: [], crud_permissions: {} } : u));
    await logPermissionChange({
      changeType:     "role_change",
      targetUserId:   userId,
      targetUserName: target?.full_name || "",
      oldValue:       oldRole,
      newValue:       role,
      description:    `تغيير دور ${target?.full_name || userId} من ${oldRole} إلى ${role}`,
    });
    setSavingRole(s => ({ ...s, [userId]: false }));
  };

  const onPermsSaved = (userId, perms) => {
    setUsers(us => us.map(u => u.id === userId ? { ...u, custom_permissions: perms } : u));
  };

  const onCrudSaved = (userId, crudPerms) => {
    setUsers(us => us.map(u => u.id === userId ? { ...u, crud_permissions: crudPerms } : u));
  };

  const filtered = users.filter(u => !search || u.full_name?.includes(search) || u.email?.includes(search));

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />إدارة الصلاحيات
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">تحكم كامل بصلاحيات كل مستخدم في النظام</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "users", label: "المستخدمون" },
          { id: "roles", label: "تفاصيل الأدوار" },
          { id: "audit", label: "سجل التدقيق" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveView(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
              ${activeView === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeView === "users" && (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم أو بريد..."
              className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["المستخدم","البريد الإلكتروني","الدور الحالي","تغيير الدور","تعديل الصلاحيات"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                  : filtered.map(u => {
                    const roleOpt = ROLE_OPTIONS.find(r => r.value === u.role);
                    const isExpanded = expandedId === u.id;
                    const hasCustom = u.custom_permissions?.length > 0;
                    return (
                      <Fragment key={u.id}>
                        <tr className="border-b border-border hover:bg-muted/20">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">{u.full_name?.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{u.full_name}</p>
                                {hasCustom && <span className="text-xs text-amber-600">صلاحيات مخصصة</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground" dir="ltr">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleOpt?.color || "bg-gray-100 text-gray-700"}`}>
                              {roleOpt?.label || u.role || "غير محدد"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <select value={u.role || "employee"} onChange={e => updateRole(u.id, e.target.value)}
                                className="px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none">
                                {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                              </select>
                              {savingRole[u.id] && <span className="text-xs text-muted-foreground">...</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : u.id)}
                              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium
                                ${isExpanded
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}>
                              {isExpanded ? "▲ إخفاء" : "▼ تعديل الصلاحيات"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-muted/5">
                            <td colSpan={5} className="px-4 py-5">
                              <div className="space-y-4">
                                <UserPermissionsEditor key={`nav-${u.id}`} user={u} onSaved={onPermsSaved} />
                                <div className="bg-background rounded-xl border border-border p-4">
                                  <h3 className="font-semibold text-sm text-foreground mb-4">
                                    صلاحيات العمليات (CRUD) — <span className="text-primary">{u.full_name}</span>
                                  </h3>
                                  <CrudPermissionsEditor key={`crud-${u.id}`} user={u} onSaved={onCrudSaved} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeView === "roles" && (
        <RolesBatchEditor users={users} onUsersUpdated={setUsers} />
      )}

      {activeView === "audit" && <AuditLogViewer />}
    </div>
  );
}

