import { useState } from "react";
import { Save, Check, RotateCcw, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CRUD_MODULES, CRUD_OPS, CRUD_OP_LABELS, getRoleCrudDefaults, getEffectiveCrudPermissions } from "../../lib/crudPermissions";
import { logPermissionChange } from "../../lib/auditLog";

const OP_COLORS = {
  view:    "bg-blue-100 text-blue-700 border-blue-200",
  create:  "bg-green-100 text-green-700 border-green-200",
  edit:    "bg-amber-100 text-amber-700 border-amber-200",
  delete:  "bg-red-100 text-red-700 border-red-200",
  approve: "bg-purple-100 text-purple-700 border-purple-200",
};
const OP_COLORS_ACTIVE = {
  view:    "bg-blue-500 text-white border-blue-500",
  create:  "bg-green-500 text-white border-green-500",
  edit:    "bg-amber-500 text-white border-amber-500",
  delete:  "bg-red-500 text-white border-red-500",
  approve: "bg-purple-500 text-white border-purple-500",
};

export default function CrudPermissionsEditor({ user, onSaved }) {
  const roleDefaults = getRoleCrudDefaults(user.role || "employee");
  const effective    = getEffectiveCrudPermissions(user);

  // Local state: overrides only (null means "use role default")
  const [overrides, setOverrides] = useState(() => user.crud_permissions || {});
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const getModulePerms = (modKey) => overrides[modKey] !== undefined ? overrides[modKey] : (roleDefaults[modKey] || []);
  const isOverridden   = (modKey) => overrides[modKey] !== undefined;

  const toggleOp = (modKey, op, hasApprove) => {
    if (op === "approve" && !hasApprove) return;
    setSaved(false);
    setOverrides(prev => {
      const current = getModulePerms(modKey);
      const updated  = current.includes(op) ? current.filter(o => o !== op) : [...current, op];
      return { ...prev, [modKey]: updated };
    });
  };

  const resetModule = (modKey) => {
    setSaved(false);
    setOverrides(prev => { const n = { ...prev }; delete n[modKey]; return n; });
  };

  const resetAll = () => { setOverrides({}); setSaved(false); };

  const save = async () => {
    setSaving(true);
    const old = user.crud_permissions;
    await base44.entities.User.update(user.id, { crud_permissions: overrides });
    await logPermissionChange({
      changeType:      "crud_permissions",
      targetUserId:    user.id,
      targetUserName:  user.full_name,
      oldValue:        old,
      newValue:        overrides,
      description:     `تعديل صلاحيات CRUD للمستخدم ${user.full_name}`,
    });
    setSaving(false);
    setSaved(true);
    onSaved(user.id, overrides);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold text-foreground">صلاحيات العمليات: <span className="text-primary">{user.full_name}</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">
              الخانات المُبرزة تعني تجاوز مخصص — الباقي يرث من الدور
            </p>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* Legend */}
          <div className="hidden sm:flex gap-1.5 flex-wrap">
            {CRUD_OPS.map(op => (
              <span key={op} className={`px-2 py-0.5 rounded-full text-xs border ${OP_COLORS[op]}`}>{CRUD_OP_LABELS[op]}</span>
            ))}
          </div>
          <button onClick={resetAll} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground">
            <RotateCcw className="w-3.5 h-3.5" />إعادة تعيين الكل
          </button>
          <button onClick={save} disabled={saving}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${saved ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            {saved ? <><Check className="w-3.5 h-3.5" />محفوظ</> : saving ? "حفظ..." : <><Save className="w-3.5 h-3.5" />حفظ</>}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground w-36">الوحدة</th>
              {CRUD_OPS.map(op => (
                <th key={op} className="text-center px-3 py-3 text-xs font-semibold text-muted-foreground">
                  <span className={`px-2 py-0.5 rounded-full border ${OP_COLORS[op]}`}>{CRUD_OP_LABELS[op]}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-xs text-muted-foreground text-center">إعادة تعيين</th>
            </tr>
          </thead>
          <tbody>
            {CRUD_MODULES.map(mod => {
              const modPerms   = getModulePerms(mod.key);
              const overridden = isOverridden(mod.key);
              return (
                <tr key={mod.key} className={`border-b border-border last:border-0 ${overridden ? "bg-amber-50/40" : "hover:bg-muted/10"}`}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-1.5">
                      {mod.label}
                      {overridden && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">مخصص</span>
                      )}
                    </div>
                  </td>
                  {CRUD_OPS.map(op => {
                    const applicable = op !== "approve" || mod.hasApprove;
                    const active     = applicable && modPerms.includes(op);
                    return (
                      <td key={op} className="px-3 py-3 text-center">
                        {applicable ? (
                          <button onClick={() => toggleOp(mod.key, op, mod.hasApprove)}
                            className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all mx-auto flex items-center justify-center
                              ${active ? OP_COLORS_ACTIVE[op] : "border-border text-muted-foreground hover:border-primary/40 bg-background"}`}>
                            {active ? "✓" : "—"}
                          </button>
                        ) : (
                          <span className="text-muted-foreground/30 text-lg mx-auto block text-center">·</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    {overridden && (
                      <button onClick={() => resetModule(mod.key)}
                        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 hover:bg-muted transition-colors">
                        إعادة
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>الصفوف المميزة بـ <span className="text-amber-600 font-medium">مخصص</span> تتجاوز صلاحيات الدور لهذا المستخدم فقط. اضغط "إعادة" لإرجاع الوحدة لصلاحيات الدور الافتراضية.</span>
      </div>
    </div>
  );
}