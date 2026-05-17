import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Warehouse, AlertTriangle, CheckCircle, Clock, XCircle, TrendingUp, Calendar, User, Phone, Bell, RefreshCw, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

function daysBetween(date1, date2) {
  return Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
}

function getContractEnd(booking) {
  if (!booking.contract_start) return null;
  const start = new Date(booking.contract_start);
  start.setMonth(start.getMonth() + (booking.contract_months || 1));
  return start;
}

function AlertBadge({ days }) {
  if (days < 0) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">منتهي</span>;
  if (days <= 7) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 animate-pulse">⚠️ {days} أيام</span>;
  if (days <= 30) return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">🔔 {days} يوم</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{days} يوم</span>;
}

export default function StorageDashboard() {
  const [units, setUnits] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertFilter, setAlertFilter] = useState("all"); // all | critical | warning | ok

  const load = async () => {
    setLoading(true);
    const [u, b] = await Promise.all([
      base44.entities.StorageUnit.list(),
      base44.entities.StorageBooking.filter({ status: "Confirmed" }),
    ]);
    setUnits(u); setBookings(b); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const today = new Date();

  // Enrich confirmed bookings with days remaining
  const enrichedBookings = bookings.map(b => {
    const endDate = getContractEnd(b);
    const daysLeft = endDate ? daysBetween(today, endDate) : null;
    return { ...b, endDate, daysLeft };
  }).sort((a, b) => (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

  const critical = enrichedBookings.filter(b => b.daysLeft !== null && b.daysLeft <= 7);
  const warning = enrichedBookings.filter(b => b.daysLeft !== null && b.daysLeft > 7 && b.daysLeft <= 30);
  const ok = enrichedBookings.filter(b => b.daysLeft !== null && b.daysLeft > 30);

  const displayed = alertFilter === "critical" ? critical : alertFilter === "warning" ? warning : alertFilter === "ok" ? ok : enrichedBookings;

  // Unit stats
  const stats = {
    total: units.length,
    available: units.filter(u => u.status === "متاحة").length,
    rented: units.filter(u => u.status === "مؤجرة").length,
    reserved: units.filter(u => u.status === "محجوزة").length,
    outOfService: units.filter(u => u.status === "خارج الخدمة").length,
  };

  const occupancyRate = stats.total ? Math.round((stats.rented / stats.total) * 100) : 0;
  const totalRevenue = bookings.reduce((s, b) => s + (b.total_amount || 0), 0);
  const monthlyRevenue = bookings.reduce((s, b) => s + (b.monthly_price || 0), 0);

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
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-muted transition-colors">
            <ExternalLink className="w-4 h-4" />صفحة الحجز العامة
          </Link>
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />تحديث
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 space-y-1">
          <p className="text-xs text-muted-foreground">إجمالي الوحدات</p>
          <p className="text-3xl font-black text-foreground">{stats.total}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${occupancyRate}%` }} />
            </div>
            <span className="text-xs font-bold text-primary">{occupancyRate}%</span>
          </div>
          <p className="text-xs text-muted-foreground">نسبة الإشغال</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-xs text-green-600 font-medium mb-1">متاحة للإيجار</p>
          <p className="text-3xl font-black text-green-700">{stats.available}</p>
          <div className="flex items-center gap-1 mt-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600">{stats.total ? Math.round((stats.available / stats.total) * 100) : 0}% من الإجمالي</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-xs text-blue-600 font-medium mb-1">مؤجرة حالياً</p>
          <p className="text-3xl font-black text-blue-700">{stats.rented}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-blue-600">{monthlyRevenue.toLocaleString("ar-SA")} ر.س/شهر</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground font-medium mb-1">إجمالي الإيرادات</p>
          <p className="text-2xl font-black text-primary">{totalRevenue.toLocaleString("ar-SA")}</p>
          <p className="text-xs text-muted-foreground mt-2">ر.س من {bookings.length} عقد مؤكد</p>
        </div>
      </div>

      {/* Alert Stats Row */}
      {(critical.length > 0 || warning.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
          <Bell className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span className="font-semibold text-amber-800 text-sm">تنبيهات انتهاء العقود</span>
          {critical.length > 0 && (
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
              🚨 {critical.length} عقود تنتهي خلال 7 أيام
            </span>
          )}
          {warning.length > 0 && (
            <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
              ⚠️ {warning.length} عقود تنتهي خلال 30 يوم
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Unit Status Grid */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2"><Warehouse className="w-4 h-4 text-primary" />حالة الوحدات</h2>
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
                  const booking = enrichedBookings.find(b => b.unit_id === u.id);
                  const daysLeft = booking?.daysLeft;
                  let bg = "bg-green-100 border-green-300 text-green-800";
                  let dot = "bg-green-500";
                  if (u.status === "مؤجرة") {
                    if (daysLeft !== null && daysLeft !== undefined && daysLeft <= 7) { bg = "bg-red-100 border-red-300 text-red-800"; dot = "bg-red-500"; }
                    else if (daysLeft !== null && daysLeft !== undefined && daysLeft <= 30) { bg = "bg-amber-100 border-amber-300 text-amber-800"; dot = "bg-amber-500"; }
                    else { bg = "bg-blue-100 border-blue-300 text-blue-800"; dot = "bg-blue-500"; }
                  } else if (u.status === "محجوزة") { bg = "bg-purple-100 border-purple-300 text-purple-800"; dot = "bg-purple-500"; }
                  else if (u.status === "خارج الخدمة") { bg = "bg-gray-100 border-gray-300 text-gray-500"; dot = "bg-gray-400"; }

                  return (
                    <div key={u.id} title={`${u.unit_number} — ${u.status}${daysLeft !== null && daysLeft !== undefined ? ` (${daysLeft} يوم متبقي)` : ""}`}
                      className={`relative border-2 rounded-lg p-2 text-center cursor-default transition-all hover:scale-105 ${bg}`}>
                      <div className={`absolute top-1 left-1 w-2 h-2 rounded-full ${dot}`} />
                      <p className="text-xs font-bold leading-none mt-1">{u.unit_number}</p>
                      {daysLeft !== null && daysLeft !== undefined && daysLeft <= 30 && u.status === "مؤجرة" && (
                        <p className="text-xs leading-none mt-0.5 font-semibold">{daysLeft}d</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
              {[["bg-green-500","متاحة"],["bg-blue-500","مؤجرة"],["bg-amber-500","تنتهي < 30 يوم"],["bg-red-500","تنتهي < 7 أيام"],["bg-purple-500","محجوزة"],["bg-gray-400","خارج الخدمة"]].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expiry Alerts Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" />تنبيهات انتهاء العقود</h2>
            <div className="flex gap-1">
              {[["all","الكل"],["critical","حرجة"],["warning","تحذير"],["ok","آمنة"]].map(([v,l]) => (
                <button key={v} onClick={() => setAlertFilter(v)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${alertFilter === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            {loading ? (
              <p className="text-center py-8 text-muted-foreground text-sm">جاري التحميل...</p>
            ) : displayed.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">لا توجد عقود تحتاج تنبيه</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/30 border-b border-border">
                  {["الوحدة","العميل","انتهاء العقد","المتبقي"].map(h => (
                    <th key={h} className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {displayed.map(b => (
                    <tr key={b.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${b.daysLeft !== null && b.daysLeft <= 7 ? "bg-red-50/50" : b.daysLeft !== null && b.daysLeft <= 30 ? "bg-amber-50/50" : ""}`}>
                      <td className="px-3 py-2.5">
                        <p className="font-bold text-foreground">{b.unit_number}</p>
                        <p className="text-xs text-muted-foreground">{b.branch}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-foreground truncate max-w-24">{b.full_name}</p>
                        <p className="text-xs text-muted-foreground">{b.phone}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {b.endDate ? b.endDate.toLocaleDateString("ar-SA") : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        {b.daysLeft !== null ? <AlertBadge days={b.daysLeft} /> : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Revenue by unit type */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="font-bold text-foreground mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />ملخص الوحدات المؤجرة</h2>
        {loading ? <p className="text-center py-4 text-muted-foreground text-sm">جاري التحميل...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30">
                {["الوحدة","النوع","الفرع","العميل","بداية العقد","نهاية العقد","الإيجار/شهر","الإجمالي","المتبقي"].map(h => (
                  <th key={h} className="text-right px-3 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {enrichedBookings.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد عقود مؤكدة</td></tr>
                ) : enrichedBookings.map(b => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-2.5 font-bold text-foreground">{b.unit_number}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{b.customer_type}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{b.branch}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{b.full_name}</p>
                      <p className="text-xs text-muted-foreground">{b.phone}</p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{b.contract_start || "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{b.endDate ? b.endDate.toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-3 py-2.5 font-semibold text-primary">{b.monthly_price?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-3 py-2.5 font-bold text-foreground">{b.total_amount?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-3 py-2.5">{b.daysLeft !== null ? <AlertBadge days={b.daysLeft} /> : "—"}</td>
                  </tr>
                ))}
              </tbody>
              {enrichedBookings.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-primary/20 bg-primary/5">
                    <td colSpan={6} className="px-3 py-2.5 font-bold text-foreground">الإجمالي</td>
                    <td className="px-3 py-2.5 font-bold text-primary">{monthlyRevenue.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-3 py-2.5 font-bold text-foreground">{totalRevenue.toLocaleString("ar-SA")} ر.س</td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
}