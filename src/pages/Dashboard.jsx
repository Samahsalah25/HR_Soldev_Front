import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users, DollarSign, CalendarDays, Clock, UserCheck, Building2, FileWarning, ChevronLeft, ArrowUpRight
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import StatCard from "../components/StatCard";
import AlertBanner from "../components/AlertBanner";
import { formatCurrency, getExpiryStatus } from "../lib/hrUtils";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list(),
      base44.entities.LeaveRequest.list(),
    ]).then(([emps, lvs]) => {
      setEmployees(emps);
      setLeaves(lvs);
      setLoading(false);
    });
  }, []);

  const active = employees.filter(e => e.status === "نشط");
  const onLeave = employees.filter(e => e.status === "في إجازة");
  const saudis = employees.filter(e => e.is_saudi);
  const nonSaudis = employees.filter(e => !e.is_saudi);
  const saudiPct = employees.length ? Math.round((saudis.length / employees.length) * 100) : 0;
  const approvedLeaves = leaves.filter(l => l.status === "معتمدة" && l.leave_type === "سنوية");
  const totalLeaveDays = approvedLeaves.reduce((s, l) => s + (l.days_count || 0), 0);
  const totalEntitlement = active.length * 21;
  const leaveUsagePct = totalEntitlement > 0 ? Math.round((totalLeaveDays / totalEntitlement) * 100) : 0;

  const totalPayroll = employees.reduce((s, e) => {
    const total = (e.basic_salary || 0) + (e.housing_allowance || 0) +
      (e.transport_allowance || 0) + (e.food_allowance || 0) +
      (e.communication_allowance || 0) + (e.other_allowances || 0);
    return s + total;
  }, 0);

  // تنبيهات الوثائق المنتهية
  const alerts = [];
  employees.forEach(emp => {
    const idStatus = getExpiryStatus(emp.id_expiry);
    if (idStatus && idStatus.days <= 90) {
      alerts.push({
        message: `إقامة ${emp.full_name_ar} ${idStatus.label}`,
        icon: "document", color: idStatus.days <= 30 ? "red" : "amber"
      });
    }
    const passStatus = getExpiryStatus(emp.passport_expiry);
    if (passStatus && passStatus.days <= 90) {
      alerts.push({
        message: `جواز سفر ${emp.full_name_ar} ${passStatus.label}`,
        icon: "document", color: passStatus.days <= 30 ? "red" : "amber"
      });
    }
  });

  const pendingLeaves = leaves.filter(l => l.status === "قيد الانتظار").length;

  // بيانات الرسوم البيانية
  const nationalityData = [
    { name: "سعوديون", value: saudis.length, color: "#0d9488" },
    { name: "مقيمون", value: nonSaudis.length, color: "#1e3a5f" },
  ];

  const deptData = employees.reduce((acc, e) => {
    const d = e.department || "غير محدد";
    const found = acc.find(x => x.name === d);
    if (found) found.value++;
    else acc.push({ name: d, value: 1 });
    return acc;
  }, []).slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-sm text-muted-foreground mt-0.5">نظام إدارة الموارد البشرية — المملكة العربية السعودية</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
          <Clock className="w-4 h-4" />
          <span>{new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && <AlertBanner alerts={alerts} />}
      {pendingLeaves > 0 && (
        <AlertBanner alerts={[{ message: `يوجد ${pendingLeaves} طلب إجازة بانتظار الموافقة`, icon: "clock", color: "blue" }]} />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="إجمالي الموظفين" value={employees.length} subtitle={`${active.length} نشط | ${onLeave.length} في إجازة`} icon={Users} color="primary" />
        <StatCard title="إجمالي الرواتب" value={formatCurrency(totalPayroll)} subtitle="شهرياً" icon={DollarSign} color="secondary" />
        <StatCard title="نسبة السعودة" value={`${saudiPct}%`} subtitle={`${saudis.length} سعودي / ${nonSaudis.length} مقيم`} icon={UserCheck} color="accent" />
        <StatCard title="طلبات الإجازة" value={pendingLeaves} subtitle="في انتظار الموافقة" icon={CalendarDays} color={pendingLeaves > 0 ? "red" : "green"} />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "الموظفون النشطون", value: active.length, total: employees.length, color: "bg-orange-500", pct: employees.length ? Math.round(active.length / employees.length * 100) : 0 },
          { label: "في إجازة الآن", value: onLeave.length, total: employees.length, color: "bg-purple-600", pct: employees.length ? Math.round(onLeave.length / employees.length * 100) : 0 },
          { label: "نسبة الإجازات المستخدمة", value: `${leaveUsagePct}%`, total: null, color: "bg-amber-500", pct: leaveUsagePct },
          { label: "طلبات معلقة", value: pendingLeaves, total: leaves.length, color: "bg-red-500", pct: leaves.length ? Math.round(pendingLeaves / leaves.length * 100) : 0 },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">{kpi.label}</p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className={`${kpi.color} h-1.5 rounded-full`} style={{ width: `${Math.min(100, kpi.pct)}%` }} />
            </div>
            {kpi.total !== null && <p className="text-xs text-muted-foreground mt-1">{kpi.pct}% من الإجمالي</p>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nationality Pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            توزيع الجنسيات (نطاقات)
          </h3>
          {employees.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={nationalityData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {nationalityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} موظف`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">لا يوجد بيانات بعد</div>
          )}
          <div className="flex justify-around mt-3 text-center">
            <div>
              <p className="text-2xl font-bold text-secondary">{saudiPct}%</p>
              <p className="text-xs text-muted-foreground">نسبة السعودة</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{employees.length}</p>
              <p className="text-xs text-muted-foreground">إجمالي الكوادر</p>
            </div>
          </div>
        </div>

        {/* Dept Bar */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            توزيع الموظفين بالأقسام
          </h3>
          {deptData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(213 55% 25%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">لا يوجد بيانات بعد</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إضافة موظف جديد", path: "/employees", icon: Users, color: "bg-primary text-primary-foreground" },
          { label: "كشف الرواتب", path: "/payroll", icon: DollarSign, color: "bg-secondary text-white" },
          { label: "طلبات الإجازة", path: "/leaves", icon: CalendarDays, color: "bg-amber-500 text-white" },
          { label: "التقارير", path: "/reports", icon: FileWarning, color: "bg-purple-600 text-white" },
        ].map(({ label, path, icon: Icon, color }) => (
          <Link key={path} to={path}
            className={`flex items-center gap-3 px-4 py-4 rounded-xl ${color} hover:opacity-90 transition-opacity font-medium text-sm`}>
            <Icon className="w-5 h-5" />
            {label}
            <ArrowUpRight className="w-4 h-4 mr-auto opacity-70" />
          </Link>
        ))}
      </div>

      {/* Recent Employees */}
      <div className="bg-card rounded-xl border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">آخر الموظفين المضافين</h3>
          <Link to="/employees" className="text-sm text-primary hover:underline flex items-center gap-1">
            عرض الكل <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">الموظف</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">القسم</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الجنسية</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الراتب</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map(emp => (
                <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{emp.full_name_ar?.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{emp.full_name_ar}</p>
                        <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.department || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${emp.is_saudi ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {emp.is_saudi ? "🇸🇦 سعودي" : `🌍 ${emp.nationality || "مقيم"}`}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(emp.basic_salary)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      emp.status === "نشط" ? "bg-green-100 text-green-700" :
                      emp.status === "في إجازة" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-600"
                    }`}>{emp.status}</span>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد موظفون مسجلون بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}