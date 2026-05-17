import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Clock, User, Shield, RefreshCw } from "lucide-react";

const CHANGE_TYPE_LABELS = {
  role_change:       { label: "تغيير دور",          color: "bg-blue-100 text-blue-700" },
  nav_permissions:   { label: "صلاحيات التنقل",     color: "bg-purple-100 text-purple-700" },
  crud_permissions:  { label: "صلاحيات CRUD",        color: "bg-amber-100 text-amber-700" },
  role_batch:        { label: "تغيير جماعي للدور",   color: "bg-red-100 text-red-700" },
};

function tryPretty(val) {
  if (!val) return "—";
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.join("، ");
    if (typeof parsed === "object") {
      return Object.entries(parsed).map(([k, v]) => `${k}: [${Array.isArray(v) ? v.join(", ") : v}]`).join(" | ");
    }
    return String(parsed);
  } catch { return val; }
}

export default function AuditLogViewer() {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.PermissionAuditLog.list("-created_date", 100);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => l.change_type === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">آخر 100 تغيير في الصلاحيات والأدوار</p>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none">
            <option value="all">كل التغييرات</option>
            {Object.entries(CHANGE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={load} className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" />تحديث
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          لا توجد سجلات تدقيق حتى الآن
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const typeInfo = CHANGE_TYPE_LABELS[log.change_type] || { label: log.change_type, color: "bg-gray-100 text-gray-700" };
            const date     = log.created_date ? new Date(log.created_date).toLocaleString("ar-SA") : "—";
            return (
              <div key={log.id} className="bg-card rounded-xl border border-border p-4 space-y-2 hover:shadow-sm transition-shadow">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                    <p className="text-sm font-medium text-foreground">{log.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />{date}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    بواسطة: <span className="text-foreground font-medium">{log.changed_by_name || log.changed_by_email}</span>
                  </span>
                  {log.target_user_name && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      الهدف: <span className="text-foreground font-medium">{log.target_user_name}</span>
                    </span>
                  )}
                  {log.target_role && (
                    <span>الدور: <span className="text-foreground font-medium">{log.target_role}</span></span>
                  )}
                </div>

                {/* Old / New */}
                {(log.old_value || log.new_value) && (
                  <div className="grid grid-cols-2 gap-3 mt-1">
                    {log.old_value && (
                      <div className="bg-red-50 border border-red-100 rounded-lg p-2">
                        <p className="text-xs text-red-600 font-medium mb-1">القيمة القديمة</p>
                        <p className="text-xs text-red-800 break-all">{tryPretty(log.old_value)}</p>
                      </div>
                    )}
                    {log.new_value && (
                      <div className="bg-green-50 border border-green-100 rounded-lg p-2">
                        <p className="text-xs text-green-600 font-medium mb-1">القيمة الجديدة</p>
                        <p className="text-xs text-green-800 break-all">{tryPretty(log.new_value)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}