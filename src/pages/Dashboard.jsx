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
import { getDashboardStats } from "@/api/dashboardApi";
export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
const [dashboard, setDashboard] = useState(null);
useEffect(() => {
  const loadDashboard = async () => {
    try {
      setLoading(true);

      const data = await getDashboardStats();

      console.log("Dashboard:", data);

      // هنخزن الداتا كلها
      setDashboard(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  loadDashboard();
}, []);
const d = dashboard;

const active = [];
const onLeave = [];

const saudis = [];
const nonSaudis = [];

const saudiPct = d?.saudi_rate ?? 0;

const approvedLeaves = []; // لم يعد موجود من backend
const totalLeaveDays = 0;
const totalEntitlement = 0;
const leaveUsagePct = d?.used_vacations_percentage ?? 0;

const totalPayroll = d?.total_salary_amount ?? 0;

// تنبيهات الوثائق المنتهية
const alerts = (d?.upcoming_expirations || []).map(item => ({
  message: item.message,
  icon: "document",
  color: item.days <= 30 ? "red" : "amber"
}));

const pendingLeaves = d?.vacation_requests_waiting_approval ?? 0;

// بيانات الرسوم البيانية
const nationalityData = [
  { name: "سعوديون", value: d?.saudi_count ?? 0, color: "#0d9488" },
  { name: "مقيمون", value: d?.resident_count ?? 0, color: "#1e3a5f" },
];

const deptData =
  (d?.department_distribution ?? []).map(item => ({
    name: item.department,
    value: item.count,
  })).slice(0, 6);

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
        <p className="text-sm text-muted-foreground mt-0.5">
          نظام إدارة الموارد البشرية — المملكة العربية السعودية
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
        <Clock className="w-4 h-4" />
        <span>
          {new Date().toLocaleDateString("ar-SA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </div>

    {/* Alerts */}
    {alerts.length > 0 && <AlertBanner alerts={alerts} />}

    {pendingLeaves > 0 && (
      <AlertBanner
        alerts={[
          {
            message: `يوجد ${pendingLeaves} طلب إجازة بانتظار الموافقة`,
            icon: "clock",
            color: "blue",
          },
        ]}
      />
    )}

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="إجمالي الموظفين"
        value={d?.total_employees ?? 0}
        subtitle={`${d?.active_employees_count ?? 0} نشط | ${d?.employees_in_vacation ?? 0} في إجازة`}
        icon={Users}
        color="primary"
      />

      <StatCard
        title="إجمالي الرواتب"
        value={formatCurrency(d?.total_salary_amount ?? 0)}
        subtitle="شهرياً"
        icon={DollarSign}
        color="secondary"
      />

      <StatCard
        title="نسبة السعودة"
        value={`${d?.saudi_rate ?? 0}%`}
        subtitle={`${d?.saudi_count ?? 0} سعودي / ${d?.resident_count ?? 0} مقيم`}
        icon={UserCheck}
        color="accent"
      />

      <StatCard
        title="طلبات الإجازة"
        value={d?.vacation_requests_waiting_approval ?? 0}
        subtitle="في انتظار الموافقة"
        icon={CalendarDays}
        color={
          (d?.vacation_requests_waiting_approval ?? 0) > 0 ? "red" : "green"
        }
      />
    </div>

    {/* KPI Row */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        {
          label: "الموظفون النشطون",
          value: d?.active_employees_count ?? 0,
          pct: d?.active_employees_rate ?? 0,
        },
        {
          label: "في إجازة الآن",
          value: d?.employees_in_vacation ?? 0,
          pct: d?.employees_in_vacation_rate ?? 0,
        },
        {
          label: "نسبة الإجازات المستخدمة",
          value: `${d?.used_vacations_percentage ?? 0}%`,
          pct: d?.used_vacations_percentage ?? 0,
        },
        {
          label: "طلبات معلقة",
          value: d?.vacation_requests_waiting_approval ?? 0,
          pct: d?.unfinished_requests_rate ?? 0,
        },
      ].map((kpi) => (
        <div
          key={kpi.label}
          className="bg-card rounded-xl border border-border p-4"
        >
          <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
          <p className="text-xs text-muted-foreground mt-0.5 mb-2">
            {kpi.label}
          </p>

          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className="bg-primary h-1.5 rounded-full"
              style={{ width: `${Math.min(100, kpi.pct)}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-1">
            {kpi.pct}% من الإجمالي
          </p>
        </div>
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Nationality Pie */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          توزيع الجنسيات
        </h3>

        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={nationalityData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {nationalityData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>

            <Tooltip formatter={(v) => [`${v} موظف`]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>

        <div className="flex justify-around mt-3 text-center">
          <div>
            <p className="text-2xl font-bold text-secondary">
              {d?.saudi_rate ?? 0}%
            </p>
            <p className="text-xs text-muted-foreground">نسبة السعودة</p>
          </div>

          <div>
            <p className="text-2xl font-bold text-primary">
              {d?.total_employees ?? 0}
            </p>
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
              <YAxis
                type="category"
                dataKey="name"
                width={80}
                tick={{ fontSize: 11 }}
              />
              <Tooltip />
              <Bar
                dataKey="value"
                fill="hsl(213 55% 25%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
            لا يوجد بيانات بعد
          </div>
        )}
      </div>
    </div>

    {/* Quick Actions */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          label: "إضافة موظف جديد",
          path: "/employees",
          icon: Users,
          color: "bg-primary text-primary-foreground",
        },
        {
          label: "كشف الرواتب",
          path: "/payroll",
          icon: DollarSign,
          color: "bg-secondary text-white",
        },
        {
          label: "طلبات الإجازة",
          path: "/leaves",
          icon: CalendarDays,
          color: "bg-amber-500 text-white",
        },
        {
          label: "التقارير",
          path: "/reports",
          icon: FileWarning,
          color: "bg-purple-600 text-white",
        },
      ].map(({ label, path, icon: Icon, color }) => (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-3 px-4 py-4 rounded-xl ${color} hover:opacity-90 transition-opacity font-medium text-sm`}
        >
          <Icon className="w-5 h-5" />
          {label}
          <ArrowUpRight className="w-4 h-4 mr-auto opacity-70" />
        </Link>
      ))}
    </div>

  {/* Recent Employees */}
<div className="bg-card rounded-xl border border-border">
  <div className="flex items-center justify-between px-5 py-4 border-b border-border">
    <h3 className="font-semibold text-foreground">
      آخر الموظفين المضافين
    </h3>

    <Link
      to="/employees"
      className="text-sm text-primary hover:underline flex items-center gap-1"
    >
      عرض الكل <ChevronLeft className="w-4 h-4" />
    </Link>
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border bg-muted/40">
          <th className="text-right px-5 py-3 text-muted-foreground font-medium">
            الموظف
          </th>
          <th className="text-right px-4 py-3 text-muted-foreground font-medium">
            القسم
          </th>
          <th className="text-right px-4 py-3 text-muted-foreground font-medium">
            المسمى الوظيفي
          </th>
          <th className="text-right px-4 py-3 text-muted-foreground font-medium">
            تاريخ التعيين
          </th>
        </tr>
      </thead>

      <tbody>
        {(d?.recent_employees ?? []).length > 0 ? (
          d.recent_employees.map((emp) => (
            <tr
              key={emp.id}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {emp.name_ar?.charAt(0) || emp.name?.charAt(0)}
                    </span>
                  </div>

                  <div>
                    <p className="font-medium text-foreground">
                      {emp.name_ar || emp.name}
                    </p>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 text-muted-foreground">
                {emp.department_name || "-"}
              </td>

              <td className="px-4 py-3 text-muted-foreground">
                {emp.job_title || "-"}
              </td>

              <td className="px-4 py-3 text-muted-foreground">
                {emp.start_date
                  ? new Date(emp.start_date).toLocaleDateString("ar-SA")
                  : "-"}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={4}
              className="text-center py-8 text-muted-foreground"
            >
              لا يوجد موظفين حديثًا
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
  </div>
);
}