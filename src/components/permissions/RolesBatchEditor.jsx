import { useState, useEffect } from "react";
import { Save, RotateCcw, Check, Loader2 } from "lucide-react";
import {
  getPermissionRoles,
  updateRolePermissions,
  PERMISSION_MODULES,
} from "@/api/permissionsApi";

// القيم بالظبط كما يرجعها الـ API في data keys
const ROLE_OPTIONS = [
  { value: "Admin", label: "مدير النظام", color: "bg-red-100 text-red-700" },
  { value: "CEO", label: "الرئيس التنفيذي (CEO)", color: "bg-green-100 text-green-700" },
  { value: "General Manager", label: "مدير عام", color: "bg-amber-100 text-amber-700" },
  { value: "HR", label: "موارد بشرية (HR)", color: "bg-purple-100 text-purple-700" },
  { value: "Department manager", label: "مدير قسم", color: "bg-blue-100 text-blue-700" },
  { value: "Accountant", label: "محاسب", color: "bg-teal-100 text-teal-700" },
  { value: "Employee", label: "موظف", color: "bg-gray-100 text-gray-700" },
];

function buildEmptyPerms() {
  const perms = {};
  PERMISSION_MODULES.forEach((m) => { perms[m.key] = false; });
  return perms;
}

// يحول الـ API response لـ map: { "Admin": { dashboard: true, ... }, ... }
// الـ response شكله: { success: true, data: { Admin: {...}, HR: {...}, ... } }
function parseRolesResponse(data) {
  const map = {};

  // استخرج الـ object الفعلي — إما data.data أو data مباشرة
  let rolesObj = null;

  if (data && typeof data === "object") {
    if (data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
      // { success: true, data: { Admin: {...}, ... } }
      rolesObj = data.data;
    } else if (Array.isArray(data.data)) {
      // { data: [{ job_grade, permissions }, ...] }
      data.data.forEach((item) => {
        if (item?.job_grade) map[item.job_grade] = item.permissions ?? buildEmptyPerms();
      });
      return map;
    } else if (Array.isArray(data)) {
      // [{ job_grade, permissions }, ...]
      data.forEach((item) => {
        if (item?.job_grade) map[item.job_grade] = item.permissions ?? buildEmptyPerms();
      });
      return map;
    } else {
      // object مباشر { Admin: {...}, ... }
      rolesObj = data;
    }
  }

  if (rolesObj) {
    Object.entries(rolesObj).forEach(([key, val]) => {
      if (val && typeof val === "object") {
        // الـ API بيرجع permissions مباشرة كـ { dashboard: true, employees: false, ... }
        // مش nested تحت "permissions" key
        map[key] = val;
      }
    });
  }

  return map;
}

export default function RolesBatchEditor() {
  const [rolesData, setRolesData] = useState({});
  const [selectedRole, setSelectedRole] = useState(ROLE_OPTIONS[0].value);
  const [localPerms, setLocalPerms] = useState(buildEmptyPerms());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const loadRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPermissionRoles();
      const map = parseRolesResponse(data);
      setRolesData(map);
      // نضبط localPerms مباشرة من map — مش من state عشان تجنب stale closure
      setLocalPerms(map[selectedRole] ?? buildEmptyPerms());
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "خطأ غير معروف";
      const status = e?.response?.status ? ` (${e.response.status})` : "";
      setError(`تعذّر تحميل الأدوار${status}: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  useEffect(() => {
    setLocalPerms(rolesData[selectedRole] ?? buildEmptyPerms());
    setSaved(false);
  }, [selectedRole, rolesData]);

  const toggle = (moduleKey) => {
    setLocalPerms((prev) => ({ ...prev, [moduleKey]: !prev[moduleKey] }));
    setSaved(false);
  };

  const reset = () => {
    setLocalPerms(rolesData[selectedRole] ?? buildEmptyPerms());
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateRolePermissions(selectedRole, localPerms);
      console.log("=== POST /permissions/roles result ===", JSON.stringify(result));
      setRolesData((prev) => ({ ...prev, [selectedRole]: localPerms }));
      setSaved(true);
    } catch (e) {
      console.error("=== POST /permissions/roles error ===", e?.response?.status, e?.response?.data);
      const msg = e?.response?.data?.message || e?.message || "خطأ غير معروف";
      setError(`تعذّر حفظ الصلاحيات: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const roleOpt = ROLE_OPTIONS.find((r) => r.value === selectedRole);
  const activeCount = Object.values(localPerms).filter(Boolean).length;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        اختر دورًا وعدّل صلاحياته — سيتم تطبيق التغييرات على جميع مستخدمي هذا الدور.
      </p>

      {/* Role tabs */}
      <div className="flex flex-wrap gap-2">
        {ROLE_OPTIONS.map((r) => (
          <button
            key={r.value}
            onClick={() => { setSelectedRole(r.value); setSaved(false); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all
              ${selectedRole === r.value
                ? "border-primary bg-primary/5 text-primary shadow-sm"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
          >
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.color}`}>
              {r.label}
            </span>
          </button>
        ))}
      </div>

      {/* Editor card */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-foreground">
              صلاحيات دور:{" "}
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold mr-1 ${roleOpt?.color}`}>
                {roleOpt?.label}
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeCount} وحدة مفعّلة من أصل {PERMISSION_MODULES.length}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground"
            >
              <RotateCcw className="w-3.5 h-3.5" />إعادة تعيين
            </button>
            <button
              onClick={save}
              disabled={saving || loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-50
                ${saved
                  ? "bg-green-100 text-green-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
            >
              {saved ? <><Check className="w-3.5 h-3.5" />محفوظ</>
                : saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري الحفظ...</>
                  : <><Save className="w-3.5 h-3.5" />حفظ</>}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && !loading && (
          <div className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />جاري تحميل الأدوار...
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
            {PERMISSION_MODULES.map((mod) => {
              const active = !!localPerms[mod.key];
              return (
                <button
                  key={mod.key}
                  onClick={() => toggle(mod.key)}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-center select-none
                    ${active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                    }`}
                >
                  {active ? "✓ " : "✗ "}{mod.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
