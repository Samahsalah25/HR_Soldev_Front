import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import {
  Users, DollarSign, CalendarDays, Clock, Warehouse,
  ClipboardList, BarChart2, CheckSquare, UserPlus, AlertTriangle,
  FileText, Calculator, TrendingUp, ArrowUpRight, LogOut
} from "lucide-react";

// ─── Role-specific dashboard configs ─────────────────────────────────────────
const ROLE_DASHBOARDS = {
  admin: {
    title: "لوحة تحكم المدير",
    subtitle: "نظرة شاملة على جميع العمليات",
    color: "from-purple-700 to-purple-900",
    quickLinks: [
      { label: "الموظفون", path: "/employees", icon: Users },
      { label: "الرواتب", path: "/payroll", icon: DollarSign },
      { label: "الحسابات", path: "/accounting", icon: Calculator },
      { label: "التقارير", path: "/reports", icon: BarChart2 },
      { label: "الإعدادات", path: "/settings", icon: CheckSquare },
      { label: "الصلاحيات", path: "/permissions", icon: AlertTriangle },
    ],
  },
  hr: {
    title: "لوحة تحكم الموارد البشرية",
    subtitle: "إدارة الموظفين والإجازات والتوظيف",
    color: "from-blue-600 to-blue-800",
    quickLinks: [
      { label: "الموظفون", path: "/employees", icon: Users },
      { label: "التوظيف", path: "/recruitment", icon: UserPlus },
      { label: "الإجازات", path: "/leaves", icon: CalendarDays },
      { label: "الحضور", path: "/attendance", icon: Clock },
      { label: "الطلبات", path: "/requests", icon: ClipboardList },
      { label: "التقارير", path: "/reports", icon: FileText },
    ],
  },
  accountant: {
    title: "لوحة تحكم المحاسب",
    subtitle: "العمليات المالية والتقارير",
    color: "from-green-600 to-green-800",
    quickLinks: [
      { label: "نظام الحسابات", path: "/accounting", icon: Calculator },
      { label: "التقارير المالية", path: "/financial-reports", icon: BarChart2 },
    ],
  },
  dept_manager: {
    title: "لوحة تحكم مدير القسم",
    subtitle: "إدارة فريقك ومتابعة الأداء",
    color: "from-amber-600 to-amber-800",
    quickLinks: [
      { label: "الموظفون", path: "/employees", icon: Users },
      { label: "الإجازات", path: "/leaves", icon: CalendarDays },
      { label: "المهام", path: "/tasks", icon: CheckSquare },
      { label: "الاجتماعات", path: "/meetings", icon: ClipboardList },
      { label: "المخالفات", path: "/violations", icon: AlertTriangle },
      { label: "التوظيف", path: "/recruitment", icon: UserPlus },
    ],
  },
  general_manager: {
    title: "لوحة تحكم المدير العام",
    subtitle: "نظرة عامة على أداء المنظمة",
    color: "from-slate-600 to-slate-800",
    quickLinks: [
      { label: "الموظفون", path: "/employees", icon: Users },
      { label: "التوظيف", path: "/recruitment", icon: UserPlus },
      { label: "الرواتب", path: "/payroll", icon: DollarSign },
      { label: "الإجازات", path: "/leaves", icon: CalendarDays },
      { label: "التقارير", path: "/reports", icon: BarChart2 },
      { label: "الطلبات", path: "/requests", icon: ClipboardList },
    ],
  },
  ceo: {
    title: "لوحة تحكم الرئيس التنفيذي",
    subtitle: "نظرة شاملة ومؤشرات الأداء",
    color: "from-rose-700 to-rose-900",
    quickLinks: [
      { label: "الموظفون", path: "/employees", icon: Users },
      { label: "الرواتب", path: "/payroll", icon: DollarSign },
      { label: "الحسابات", path: "/accounting", icon: Calculator },
      { label: "التقارير", path: "/reports", icon: BarChart2 },
      { label: "التقارير المالية", path: "/financial-reports", icon: TrendingUp },
      { label: "الوحدات التخزينية", path: "/storage-dashboard", icon: Warehouse },
    ],
  },
  employee: {
    title: "بوابة الموظف",
    subtitle: "إدارة طلباتك ومعلوماتك الشخصية",
    color: "from-teal-600 to-teal-800",
    quickLinks: [
      { label: "بوابتي", path: "/ess", icon: Users },
      { label: "طلب إجازة", path: "/leaves", icon: CalendarDays },
      { label: "الحضور", path: "/attendance", icon: Clock },
      { label: "طلباتي", path: "/requests", icon: ClipboardList },
    ],
  },
  user: {
    title: "بوابة الموظف",
    subtitle: "إدارة طلباتك ومعلوماتك الشخصية",
    color: "from-teal-600 to-teal-800",
    quickLinks: [
      { label: "بوابتي", path: "/ess", icon: Users },
      { label: "طلب إجازة", path: "/leaves", icon: CalendarDays },
    ],
  },
};

export default function RoleDashboard() {
  const { role, user, loading } = useRole();
  const [stats, setStats] = useState({ employees: 0, pendingLeaves: 0, pendingRequests: 0 });

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list(),
      base44.entities.LeaveRequest.list(),
    ]).then(([emps, lvs]) => {
      setStats({
        employees: emps.length,
        pendingLeaves: lvs.filter(l => l.status === "قيد الانتظار").length,
      });
    }).catch(() => {});
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const config = ROLE_DASHBOARDS[role] || ROLE_DASHBOARDS.user;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto" dir="rtl">
      {/* Welcome Banner */}
      <div className={`bg-gradient-to-l ${config.color} rounded-2xl p-6 text-white`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-sm mb-1">{new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            <h1 className="text-2xl font-bold">{config.title}</h1>
            <p className="text-white/80 text-sm mt-1">{config.subtitle}</p>
            {user?.full_name && (
              <p className="text-white/90 font-medium mt-3">مرحباً، {user.full_name} 👋</p>
            )}
          </div>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            خروج
          </button>
        </div>
      </div>

      {/* Stats (only for relevant roles) */}
      {["admin", "hr", "general_manager", "ceo", "dept_manager"].includes(role) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-3xl font-bold text-foreground">{stats.employees}</p>
            <p className="text-sm text-muted-foreground mt-1">إجمالي الموظفين</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-3xl font-bold text-amber-600">{stats.pendingLeaves}</p>
            <p className="text-sm text-muted-foreground mt-1">إجازات معلقة</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 col-span-2 sm:col-span-1">
            <p className="text-3xl font-bold text-primary">
              {new Date().toLocaleDateString("ar-SA", { day: "numeric", month: "short" })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">تاريخ اليوم</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4">الوصول السريع</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {config.quickLinks.map((item) => {
            const ItemIcon = item.icon;
            return (
            <Link key={item.path} to={item.path}
              className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all group">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <ItemIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">{item.label}</p>
                <ArrowUpRight className="w-3 h-3 text-muted-foreground mt-0.5" />
              </div>
            </Link>
            );
          })}
        </div>
      </div>

      {/* Employee-specific: Go to ESS */}
      {(role === "employee" || role === "user") && (
        <Link to="/ess"
          className="flex items-center justify-between p-5 bg-primary rounded-2xl text-white hover:bg-primary/90 transition-colors">
          <div>
            <p className="font-bold text-lg">بوابة الموظف الذاتية</p>
            <p className="text-white/80 text-sm mt-0.5">عرض معلوماتك الشخصية وطلباتك</p>
          </div>
          <ArrowUpRight className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}