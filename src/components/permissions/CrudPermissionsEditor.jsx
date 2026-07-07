import { useState, useEffect } from "react";
import React from "react";
import { Save, Check, RotateCcw, Loader2 } from "lucide-react";
import {
  getEmployeePermissions,
  updateEmployeePermissions,
  PERMISSION_MODULES,
} from "@/api/permissionsApi";
import { usePermissions } from "@/lib/PermissionsContext";

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

const DEFAULT_MODULE_PERMS = {
  is_active: false, can_create: false,
  can_read: false, can_update: false, can_delete: false,
};

// localStorage key مشترك مع RolesBatchEditor
const LS_KEY = "rolePermsOverrides";

/**
 * يجيب صلاحيات الدور من localStorage للـ keys غير المدعومة
 * ويحوّلها لـ CRUD format
 * مثلاً: لو "home" = true في الدور → is_active: true, can_read: true
 */
function getRoleDefaultsForModule(moduleKey, roleName) {
  if (!roleName) return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw);
    // ابحث عن الـ role بغض النظر عن الـ case
    const matchedKey = Object.keys(all).find(
      (k) => k.toLowerCase() === roleName.toLowerCase()
    );
    if (!matchedKey) return null;
    const roleOverrides = all[matchedKey];
    const val = roleOverrides[moduleKey];
    if (val === undefined) return null;
    // لو القيمة true في صلاحيات الدور → is_active + can_read = true
    if (val === true) {
      return { is_active: true, can_create: false, can_read: true, can_update: false, can_delete: false };
    }
    return null;
  } catch { return null; }
}

/**
 * يبني الصلاحيات الكاملة للموظف:
 * - الـ keys الموجودة في API → تستخدم قيمها
 * - الـ keys الناقصة → تأخذ default من صلاحيات الدور أو DEFAULT_MODULE_PERMS
 */
function buildAllModulePerms(apiPerms, roleName) {
  const result = {};
  PERMISSION_MODULES.forEach((m) => {
    if (apiPerms[m.key]) {
      // موجودة في API
      result[m.key] = apiPerms[m.key];
    } else {
      // غير موجودة → جرّب الـ role defaults أولاً
      const roleDefault = getRoleDefaultsForModule(m.key, roleName);
      result[m.key] = roleDefault ?? { ...DEFAULT_MODULE_PERMS };
    }
  });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CrudPermissionsEditor({ employeeId, employeeRole, onSaved }) {
  const [permissions, setPermissions] = useState({});
  const [hasOverrides, setHasOverrides] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const { refreshPermissions } = usePermissions();

  // ─── تحميل الصلاحيات ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);

    getEmployeePermissions(employeeId)
      .then((data) => {
        const payload = data?.data ?? data;
        setHasOverrides(payload?.has_overrides ?? false);

        let apiPerms = payload?.permissions ?? {};

        // لو Array → حوّله لـ object
        if (Array.isArray(apiPerms)) {
          const obj = {};
          apiPerms.forEach((item) => { if (item?.module) obj[item.module] = item; });
          apiPerms = obj;
        }

        // ✨ ابني كل الـ modules مع fallback لصلاحيات الدور للـ keys الناقصة
        setPermissions(buildAllModulePerms(apiPerms, employeeRole));
      })
      .catch(() => setError("تعذّر تحميل الصلاحيات"))
      .finally(() => setLoading(false));
  }, [employeeId, employeeRole]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const getModulePerms = (modKey) => permissions[modKey] ?? { ...DEFAULT_MODULE_PERMS };

  const toggleOp = (modKey, opKey) => {
    setSaved(false);
    setPermissions((prev) => ({
      ...prev,
      [modKey]: { ...getModulePerms(modKey), [opKey]: !getModulePerms(modKey)[opKey] },
    }));
  };

  const resetAll = () => {
    const reset = {};
    PERMISSION_MODULES.forEach((m) => { reset[m.key] = { ...DEFAULT_MODULE_PERMS }; });
    setPermissions(reset);
    setHasOverrides(false);
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateEmployeePermissions(employeeId, hasOverrides, permissions);
      setSaved(true);
      onSaved?.(employeeId, permissions);
      await refreshPermissions();
    } catch {
      setError("تعذّر حفظ الصلاحيات");
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center py-10 text-muted-foreground text-sm gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...
    </div>
  );

  if (error) return <div className="text-center py-6 text-red-500 text-sm">{error}</div>;

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
              ${saved ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
          >
            {saved ? <><Check className="w-3.5 h-3.5" />محفوظ</>
              : saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />حفظ...</>
                : <><Save className="w-3.5 h-3.5" />حفظ</>}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground w-36">الوحدة</th>
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
            {(() => {
              let currentGroup = null;
              return PERMISSION_MODULES.map((mod) => {
                const modPerms = getModulePerms(mod.key);
                const showGroupHeader = mod.group && mod.group !== currentGroup;
                if (showGroupHeader) currentGroup = mod.group;

                return (
                  <React.Fragment key={mod.key}>
                    {showGroupHeader && (
                      <tr className="bg-primary/5 border-y border-primary/20">
                        <td colSpan={CRUD_OPS.length + 1} className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-wider">
                          {mod.group}
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-border last:border-0 hover:bg-muted/10">
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
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
