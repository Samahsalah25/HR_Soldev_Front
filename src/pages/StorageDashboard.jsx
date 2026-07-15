import { useState, useEffect } from "react";
import { Warehouse, CheckCircle, Clock, TrendingUp, Bell, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { getStorageDashboard } from "@/api/storageUnitsApi";

// ─── Alert badge حسب alert_level ─────────────────────────────────────────────
function AlertBadge({ days, level }) {
  if (days < 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">منتهي</span>;
  if (level === "critical" || days <= 7)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">⚠️ {days} أيام</span>;
  if (level === "warning" || days <= 30)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">🔔 {days} يوم</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{days} يوم</span>;
}

// ─── لون الوحدة حسب state ─────────────────────────────────────────────────────
const STATE_STYLE = {
  available: { bg: "bg-green-100 border-green-300 text-green-800", dot: "bg-green-500" },
  rented: { bg: "bg-blue-100 border-blue-300 text-blue-800", dot: "bg-blue-500" },
  Reserved: { bg: "bg-amber-100 border-amber-300 text-amber-800", dot: "bg-amber-500" },
  booked: { bg: "bg-purple-100 border-purple-300 text-purple-800", dot: "bg-purple-500" },
  out_of_order: { bg: "bg-gray-100 border-gray-300 text-gray-500", dot: "bg-gray-400" },
};

export default function StorageDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alertFilter, setAlertFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const d = await getStorageDashboard();   // GET /storage/dashboard
      setData(d);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ─── استخراج البيانات ─────────────────────────────────────────────────────

  const stats = data?.stats ?? {};
  const units = data?.units ?? [];
  const alerts = data?.expiration_alerts ?? [];
  const summary = data?.contracts_summary ?? {};
  const contracts = summary.contracts ?? [];

  // فلتر التنبيهات
  const filteredAlerts = alerts.filter(a => {
    if (alertFilter === "critical") return a.days_left <= 7 || a.alert_level === "critical";
    if (alertFilter === "warning") return a.days_left <= 30 && a.days_left > 7 || a.alert_level === "warning";
    if (alertFilter === "ok") return a.days_left > 30 && a.alert_level === "safe";
    return true;
  });

  const criticalCount = alerts.filter(a => a.days_left <= 7 || a.alert_level === "critical").length;
  const warningCount = alerts.filter(a => a.days_left <= 30 && a.days_left > 7).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Warehouse className="w-7 h-7 text-primary" />لوحة تحكم التخزين
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">نظرة شاملة على الوحدات والإيجارات</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/rent" target="_blank"
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted">
            <ExternalLink className="w-4 h-4" />صفحة الحجز
          </Link>
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />تحديث
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      {/* KPI Cards — stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <p className="text-xs text-muted-foreground">إجمالي الوحدات</p>
          <p className="text-3xl font-black text-foreground">{stats.total_units ?? "—"}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${stats.working_percentage ?? 0}%` }} />
            </div>
            <span className="text-xs font-bold text-primary">{stats.working_percentage ?? 0}%</span>
          </div>
          <p className="text-xs text-muted-foreground">نسبة التشغيل</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-xs text-green-600 font-medium mb-1">متاحة للإيجار</p>
          <p className="text-3xl font-black text-green-700">{stats.available_count ?? 0}</p>
          <p className="text-xs text-green-600 mt-2">
            {stats.available_percentage ?? 0}% من الإجمالي
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-xs text-blue-600 font-medium mb-1">مؤجرة حالياً</p>
          <p className="text-3xl font-black text-blue-700">{stats.rented_count ?? 0}</p>
          <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            {stats.monthly_income?.toLocaleString("ar-SA")} ر.س/شهر
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium mb-1">إجمالي الإيرادات</p>
          <p className="text-2xl font-black text-primary">
            {stats.total_revenue?.toLocaleString("ar-SA")}
          </p>
          <p className="text-xs text-muted-foreground mt-2">ر.س</p>
        </div>
      </div>

      {/* تنبيه إذا في عقود قريبة الانتهاء */}
      {(criticalCount > 0 || warningCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
          <Bell className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="font-semibold text-amber-800 text-sm">تنبيهات انتهاء العقود</span>
          {criticalCount > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
              🚨 {criticalCount} عقود تنتهي خلال 7 أيام
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
              ⚠️ {warningCount} عقود تنتهي خلال 30 يوم
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* خريطة الوحدات — units */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-primary" />حالة الوحدات
            </h2>
            <Link to="/storage-units" className="text-xs text-primary hover:underline">إدارة الوحدات</Link>
          </div>
          <div className="p-4">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</p>
            ) : units.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">لا توجد وحدات</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {units.map(u => {
                  // إيجاد أيام متبقية من alerts
                  const alert = alerts.find(a => a.unit_number === u.unit_number);
                  const daysLeft = alert?.days_left;
                  const style = STATE_STYLE[u.state] || STATE_STYLE.available;
                  // إذا مؤجر وعنده أيام — لون مختلف
                  let bg = style.bg;
                  let dot = style.dot;
                  if ((u.state === "rented" || u.state === "Reserved") && daysLeft !== undefined) {
                    if (daysLeft <= 7) { bg = "bg-red-100 border-red-300 text-red-800"; dot = "bg-red-500"; }
                    else if (daysLeft <= 30) { bg = "bg-amber-100 border-amber-300 text-amber-800"; dot = "bg-amber-500"; }
                  }
                  return (
                    <div key={u.id}
                      title={`${u.unit_number} — ${u.state_label}${daysLeft !== undefined ? ` (${daysLeft} يوم متبقي)` : ""}`}
                      className={`relative border-2 rounded-lg p-2 text-center cursor-default transition-all hover:scale-105 ${bg}`}>
                      <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${dot}`} />
                      <p className="text-xs font-bold leading-none mt-1">{u.unit_number}</p>
                      {daysLeft !== undefined && daysLeft <= 30 && (
                        <p className="text-xs leading-none mt-0.5 font-semibold">{daysLeft}d</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
              {[
                ["bg-green-500", "متاحة"],
                ["bg-blue-500", "مؤجرة"],
                ["bg-amber-500", "محجوزة / تنتهي < 30"],
                ["bg-red-500", "تنتهي < 7 أيام"],
                ["bg-gray-400", "خارج الخدمة"],
              ].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* تنبيهات انتهاء العقود — expiration_alerts */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />تنبيهات انتهاء العقود
            </h2>
            <div className="flex gap-1">
              {[["all", "الكل"], ["critical", "حرجة"], ["warning", "تحذير"], ["ok", "آمنة"]].map(([v, l]) => (
                <button key={v} onClick={() => setAlertFilter(v)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${alertFilter === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</p>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">لا توجد تنبيهات</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    {["الوحدة", "العميل", "تاريخ الانتهاء", "المتبقي"].map(h => (
                      <th key={h} className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map(a => (
                    <tr key={a.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/20
                        ${a.days_left <= 7 ? "bg-red-50/50" : a.days_left <= 30 ? "bg-amber-50/50" : ""}`}>
                      <td className="px-3 py-2.5 font-bold text-foreground">{a.unit_number}</td>
                      <td className="px-3 py-2.5 font-medium text-foreground truncate max-w-24">{a.customer_name}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{a.end_date}</td>
                      <td className="px-3 py-2.5">
                        <AlertBadge days={a.days_left} level={a.alert_level} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ملخص العقود — contracts_summary */}
      <div className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />ملخص العقود النشطة
          </h2>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>إجمالي شهري: <strong className="text-primary">{summary.total_monthly_payment?.toLocaleString("ar-SA")} ر.س</strong></span>
            <span>إجمالي الإيرادات: <strong className="text-foreground">{summary.total_payment?.toLocaleString("ar-SA")} ر.س</strong></span>
          </div>
        </div>
        {loading ? (
          <p className="text-center py-4 text-muted-foreground text-sm">جاري التحميل...</p>
        ) : contracts.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">لا توجد عقود نشطة</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["الوحدة", "النوع", "الموقع", "العميل", "البداية", "النهاية", "الشهري", "الإجمالي", "المتبقي"].map(h => (
                    <th key={h} className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-bold text-foreground">{c.unit_number}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {c.customer_type === "single" ? "فرد" : "شركة"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.location}</td>
                    <td className="px-3 py-2.5 font-medium text-foreground">{c.customer_name || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.start_date}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.end_date}</td>
                    <td className="px-3 py-2.5 font-semibold text-primary">{c.monthly_payment?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-3 py-2.5 font-bold text-foreground">{c.total_payment?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-3 py-2.5">
                      <AlertBadge days={c.days_left} level={c.days_left <= 7 ? "critical" : c.days_left <= 30 ? "warning" : "safe"} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-primary/20 bg-primary/5">
                  <td colSpan={6} className="px-3 py-2.5 font-bold text-foreground">الإجمالي</td>
                  <td className="px-3 py-2.5 font-bold text-primary">{summary.total_monthly_payment?.toLocaleString("ar-SA")} ر.س</td>
                  <td className="px-3 py-2.5 font-bold text-foreground">{summary.total_payment?.toLocaleString("ar-SA")} ر.س</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
