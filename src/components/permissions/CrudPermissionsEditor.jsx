import { useState, useEffect } from "react";
import { Save, Check, RotateCcw, Loader2 } from "lucide-react";
import {
  getEmployeePermissions,
  updateEmployeePermissions,
  PERMISSION_MODULES,
} from "@/api/permissionsApi";

// العمليات المتاحة لكل وحدة
const CRUD_OPS = [
  { key: "is_active", label: "مفعّل" },
  { key: "can_create", label: "إضافة" },
  { key: "can_read", label: "عرض" },
  { key: "can_update", label: "تعديل" },
  { key: "can_delete", label: "حذف" },
];

const OP_COLORS = {
  is_active: "bg-gray-100 text-gray-700 border-gray-200",
  can_create: "bg-green-100 text-green-700 border-green-200",
  can_read: "bg-blue-100 text-blue-700 border-blue-200",
  can_update: "bg-amber-100 text-amber-700 border-amber-200",
  can_delete: "bg-red-100 text-red-700 border-red-200",
};
const OP_COLORS_ACTIVE = {
  is_active: "bg-gray-500 text-white border-gray-500",
  can_create: "bg-green-500 text-white border-green-500",
  can_read: "bg-blue-500 text-white border-blue-500",
  can_update: "bg-amber-500 text-white border-amber-500",
  can_delete: "bg-red-500 text-white border-red-500",
};

// القيم الافتراضية لصلاحية وحدة جديدة
const DEFAULT_MODULE_PERMS = {
  is_active: false,
  can_create: false,
  can_read: false,
  can_update: false,
  can_delete: false,
};

export default function CrudPermissionsEditor({ employeeId, onSaved }) {
  const [permissions, setPermissions] = useState({});
  const [hasOverrides, setHasOverrides] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // تحميل الصلاحيات الحالية
  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    getEmployeePermissions(employeeId)
      .then((data) => {
        console.log("=== GET /permissions/employees/:id ===", JSON.stringify(data));

        // الـ response: { success, data: { has_overrides, permissions: { dashboard: {...}, ... } } }
        // أو: { has_overrides, permissions: { ... } }
        const payload = data?.data ?? data;

        setHasOverrides(payload?.has_overrides ?? false);

        const perms = payload?.permissions ?? {};

        if (Array.isArray(perms)) {
          const obj = {};
          perms.forEach((item) => {
            if (item?.module) obj[item.module] = item;
          });
          setPermissions(obj);
        } else {
          setPermissions(perms);
        }
      })
      .catch((e) => {
        console.error("Failed to load employee permissions:", e);
        setError("تعذّر تحميل الصلاحيات");
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  const getModulePerms = (modKey) =>
    permissions[modKey] ?? { ...DEFAULT_MODULE_PERMS };

  const toggleOp = (modKey, opKey) => {
    setSaved(false);
    setPermissions((prev) => ({
      ...prev,
      [modKey]: {
        ...getModulePerms(modKey),
        [opKey]: !getModulePerms(modKey)[opKey],
      },
    }));
  };

  const resetAll = () => {
    const reset = {};
    PERMISSION_MODULES.forEach((m) => {
      reset[m.key] = { ...DEFAULT_MODULE_PERMS };
    });
    setPermissions(reset);
    setHasOverrides(false);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await updateEmployeePermissions(employeeId, hasOverrides, permissions);
      console.log("=== POST /permissions/employees/:id result ===", JSON.stringify(result));
      setSaved(true);
      onSaved?.(employeeId, permissions);
    } catch (e) {
      console.error("Failed to save permissions:", e?.response?.status, e?.response?.data);
      setError("تعذّر حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-6 text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={hasOverrides}
              onChange={(e) => { setHasOverrides(e.target.checked); setSaved(false); }}
              className="rounded"
            />
            تفعيل صلاحيات مخصصة لهذا الموظف
          </label>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5" />إعادة تعيين الكل
          </button>
          <button
            onClick={save}
            disabled={saving}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors
              ${saved
                ? "bg-green-100 text-green-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
          >
            {saved ? (
              <><Check className="w-3.5 h-3.5" />محفوظ</>
            ) : saving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" />حفظ...</>
            ) : (
              <><Save className="w-3.5 h-3.5" />حفظ</>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground w-36">
                الوحدة
              </th>
              {CRUD_OPS.map((op) => (
                <th key={op.key} className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full border ${OP_COLORS[op.key]}`}>
                    {op.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((mod) => {
              const modPerms = getModulePerms(mod.key);
              return (
                <tr
                  key={mod.key}
                  className="border-b border-border last:border-0 hover:bg-muted/10"
                >
                  <td className="px-4 py-3 font-medium text-foreground">{mod.label}</td>
                  {CRUD_OPS.map((op) => {
                    const active = !!modPerms[op.key];
                    return (
                      <td key={op.key} className="px-3 py-3 text-center">
                        <button
                          onClick={() => toggleOp(mod.key, op.key)}
                          className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all mx-auto flex items-center justify-center
                            ${active
                              ? OP_COLORS_ACTIVE[op.key]
                              : "border-border text-muted-foreground hover:border-primary/40 bg-background"
                            }`}
                        >
                          {active ? "✓" : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
