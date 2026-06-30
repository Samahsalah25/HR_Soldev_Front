import { useState, useEffect } from "react";
import { Clock, User, Shield, RefreshCw } from "lucide-react";
import { getPermissionLogs } from "@/api/permissionsApi";

function tryPretty(val) {
  if (!val) return "—";
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.join("، ");
    if (typeof parsed === "object") {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: [${Array.isArray(v) ? v.join(", ") : v}]`)
        .join(" | ");
    }
    return String(parsed);
  } catch {
    return val;
  }
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPermissionLogs();
      // الـ API قد يرجع { data: [...] } أو مصفوفة مباشرة
      setLogs(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (e) {
      console.error("Failed to load permission logs:", e);
      setError("تعذّر تحميل سجل التدقيق");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">سجل آخر التغييرات في الصلاحيات</p>
        <button
          onClick={load}
          className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted text-muted-foreground"
        >
          <RefreshCw className="w-3.5 h-3.5" />تحديث
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">جاري التحميل...</div>
      ) : error ? (
        <div className="text-center py-16 text-red-500 text-sm">{error}</div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          لا توجد سجلات تدقيق حتى الآن
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log, idx) => {
            const date = log.created_at
              ? new Date(log.created_at).toLocaleString("ar-SA")
              : log.created_date
                ? new Date(log.created_date).toLocaleString("ar-SA")
                : "—";
            return (
              <div
                key={log.id ?? idx}
                className="bg-card rounded-xl border border-border p-4 space-y-2 hover:shadow-sm transition-shadow"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.change_type && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                        {log.change_type}
                      </span>
                    )}
                    <p className="text-sm font-medium text-foreground">
                      {log.description || log.action || "تغيير صلاحية"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />{date}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  {(log.changed_by_name || log.changed_by_email || log.performed_by) && (
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      بواسطة:{" "}
                      <span className="text-foreground font-medium">
                        {log.changed_by_name || log.changed_by_email || log.performed_by}
                      </span>
                    </span>
                  )}
                  {(log.target_user_name || log.target_name) && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      الهدف:{" "}
                      <span className="text-foreground font-medium">
                        {log.target_user_name || log.target_name}
                      </span>
                    </span>
                  )}
                  {(log.target_role || log.job_grade) && (
                    <span>
                      الدور:{" "}
                      <span className="text-foreground font-medium">
                        {log.target_role || log.job_grade}
                      </span>
                    </span>
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
