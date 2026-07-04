import { useState, useEffect } from "react";
import { Download, BarChart2, Users, DollarSign, CalendarDays, TrendingDown, Filter, Printer, FileSpreadsheet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, calcServiceYears, calcPayslip, getLeaveEntitlement, EXPAT_LEVY } from "../lib/hrUtils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  getSalaryReport,
  getAttendanceReport,
  getVacationReport,
  getEndOfServiceReport,
  getComplianceReport,
} from "@/api/reportsApi";
export default function Reports() {
 const [activeReport, setActiveReport] = useState("payroll_summary");

const [employees, setEmployees] = useState([]);
const [leaves, setLeaves] = useState([]);
const [attendance, setAttendance] = useState([]);
const [missions, setMissions] = useState([]);

const [loading, setLoading] = useState(true);

const [filters, setFilters] = useState({
  department: "",
  nationality: "",
  contractType: "",
  period: "",
});

// 🔥 مهم جدًا: خليه array عشان .map مايكسرش
const [salaryReport, setSalaryReport] = useState([]);

const [attendanceReport, setAttendanceReport] = useState([]);
const [vacationReport, setVacationReport] = useState([]);

const [endOfServiceReport, setEndOfServiceReport] = useState(null);
const [complianceReport, setComplianceReport] = useState(null);
const [salarySummary, setSalarySummary] = useState(null);

useEffect(() => {
  const loadReports = async () => {
    try {
      setLoading(true);

      const [
        salary,
        attendance,
        vacation,
        endOfService,
        compliance,
      ] = await Promise.all([
        getSalaryReport(),
        getAttendanceReport(),
        getVacationReport(),
        getEndOfServiceReport(),
        getComplianceReport(),
      ]);

      setSalaryReport(salary?.data || []);
      setSalarySummary(salary?.summary || null);

      setAttendanceReport(attendance?.data || []);
      setVacationReport(vacation?.data || []);

      setEndOfServiceReport(endOfService || null);
      setComplianceReport(compliance || null);

    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  loadReports();
}, []);

// =====================
// 🔥 SAFE DERIVED DATA
// =====================

// الأقسام
const depts = [
  ...new Set(
    (salaryReport || [])
      .map((e) => e?.employee?.department?.name)
      .filter(Boolean)
  ),
];

// الفلترة
const filtered = (salaryReport || []).filter((e) => {
  const department = e?.employee?.department?.name || "";
  const nationality = e?.category?.code || "";

  return (
    (!filters.department || department === filters.department) &&
    (!filters.nationality || nationality === filters.nationality)
  );
});

// السعوديين والمقيمين
const saudis = filtered.filter(
  (e) => e?.category?.code === "saudi"
);

const nonSaudis = filtered.filter(
  (e) => e?.category?.code !== "saudi"
);

// =====================
// الإجماليات من API
// =====================
const totalPayroll =
  salarySummary?.total_monthly_salaries || 0;

const totalGOSIEmployer =
  salarySummary?.total_employer_gosi || 0;

const totalExpatLevy =
  salarySummary?.total_expatriate_fees || 0;

const totalCost =
  salarySummary?.total_actual_cost || 0;

// =====================
// تصنيفات التقارير
// =====================
const reportCategories = [
  {
    id: "payroll_summary",
    label: "ملخص الرواتب",
    icon: DollarSign,
    sub: ["كشف الرواتب", "تحليل الرواتب", "GOSI", "تكلفة الموظفين"],
  },
  {
    id: "attendance_report",
    label: "تقارير الحضور",
    icon: BarChart2,
    sub: ["الحضور والانصراف", "التأخير"],
  },
  {
    id: "leave_report",
    label: "تقارير الإجازات",
    icon: CalendarDays,
    sub: ["أرصدة الإجازات"],
  },
  {
    id: "eos_report",
    label: "نهاية الخدمة",
    icon: TrendingDown,
    sub: ["المخصص الشهري", "المخصص التراكمي"],
  },
  {
    id: "compliance",
    label: "الامتثال",
    icon: Users,
    sub: ["السعودة", "الوثائق"],
  },
];

// =====================
// توزيع الرواتب
// =====================
const deptPayroll =
  salarySummary?.department_distribution?.map((d) => ({
    name: d?.department,
    payroll: d?.amount,
  })) || [];

// =====================
// توزيع الجنسيات
// =====================
const nationalityData = [
  {
    name: "سعوديون",
    value: complianceReport?.saudization?.saudi_count || 0,
    color: "#0d9488",
  },
  {
    name: "مقيمون",
    value: complianceReport?.saudization?.resident_count || 0,
    color: "#1e3a5f",
  },
];
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">التقارير والتحليلات</h1>
        <p className="text-sm text-muted-foreground mt-0.5">تقارير شاملة للموارد البشرية مع إمكانية التصدير</p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 flex flex-wrap gap-3 items-center">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none">
          <option value="">كل الأقسام</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.nationality} onChange={e => setFilters(f => ({ ...f, nationality: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none">
          <option value="">كل الجنسيات</option>
          <option value="saudi">سعودي</option>
          <option value="nonSaudi">مقيم</option>
        </select>
        <select value={filters.contractType} onChange={e => setFilters(f => ({ ...f, contractType: e.target.value }))}
          className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none">
          <option value="">كل العقود</option>
          <option value="محدد المدة">محدد المدة</option>
          <option value="غير محدد المدة">غير محدد المدة</option>
        </select>
        {(filters.department || filters.nationality || filters.contractType) && (
          <button onClick={() => setFilters({ department: "", nationality: "", contractType: "", period: "" })}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg">
            مسح
          </button>
        )}
        <div className="flex gap-2 mr-auto">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted">
            <Download className="w-3.5 h-3.5" />Excel
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted">
            <Printer className="w-3.5 h-3.5" />طباعة
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <div className="bg-card rounded-xl border border-border p-3 space-y-1">
            {reportCategories.map(cat => (
              <button key={cat.id} onClick={() => setActiveReport(cat.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors text-right ${activeReport === cat.id ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <cat.icon className="w-4 h-4 flex-shrink-0" />
                {cat.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Report Content */}
        <div className="flex-1 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">جاري تحميل البيانات...</div>
          ) : (
            <>
              {activeReport === "payroll_summary" && (
                <div className="space-y-5">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "إجمالي الرواتب الشهرية", value: formatCurrency(totalPayroll), color: "text-primary" },
                      { label: "اشتراكات GOSI (صاحب عمل)", value: formatCurrency(totalGOSIEmployer), color: "text-orange-600" },
                      { label: "رسوم العمالة الوافدة", value: formatCurrency(totalExpatLevy), color: "text-red-600" },
                      { label: "إجمالي التكلفة الفعلية", value: formatCurrency(totalCost), color: "text-foreground font-bold" },
                      { label: "متوسط الراتب", value: formatCurrency(filtered.length ? totalPayroll / filtered.length : 0), color: "text-secondary" },
                   {
  label: "عدد الموظفين",
  value: salarySummary?.total_employees|| salaryReport.length || 0,
  color: "text-blue-600"
}
                    ].map(k => (
                      <div key={k.label} className="bg-card rounded-xl border border-border p-4">
                        <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
                      </div>
                    ))}
                  </div>

{/* Payroll Table */}
<div className="bg-card rounded-xl border border-border overflow-hidden">
  <div className="px-5 py-3 border-b border-border bg-muted/20 font-semibold text-sm flex items-center gap-2">
    <FileSpreadsheet className="w-4 h-4 text-primary" />
    كشف الرواتب التفصيلي
  </div>

  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead>
        <tr className="border-b border-border bg-muted/30">
          {[
            "الموظف",
            "الجنسية",
            "الأساسي",
            "الإجمالي",
            "GOSI موظف",
            "GOSI صاحب عمل",
            "الصافي",
            "تكلفة صاحب العمل",
          ].map((h) => (
            <th
              key={h}
              className="text-right px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {(salaryReport || []).map((item) => {
          const emp = item.employee || {};

          const isSaudi = item.category?.code === "saudi";

          const empCost = item.employer_cost || 0;

          return (
            <tr
              key={emp.id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              {/* الموظف */}
              <td className="px-3 py-2.5">
                <p className="font-medium text-foreground">
                  {emp.name_ar || "—"}
                </p>
                <p className="text-muted-foreground">
                  {emp.department?.name || "—"}
                </p>
              </td>

              {/* الجنسية */}
              <td className="px-3 py-2.5">
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    isSaudi
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-100 text-blue-700"
                  }`}
                >
                  {isSaudi ? "سعودي" : "مقيم"}
                </span>
              </td>

              {/* الأساسي */}
              <td className="px-3 py-2.5">
                {formatCurrency(item.wage || 0)}
              </td>

              {/* الإجمالي */}
              <td className="px-3 py-2.5">
                {formatCurrency(item.total_salary || 0)}
              </td>

              {/* GOSI موظف */}
              <td className="px-3 py-2.5 text-amber-600">
                ({formatCurrency(item.gosi_employee || 0)})
              </td>

              {/* GOSI صاحب عمل */}
              <td className="px-3 py-2.5 text-orange-600">
                {formatCurrency(item.gosi_employer || 0)}
              </td>

              {/* الصافي */}
              <td className="px-3 py-2.5 font-bold text-secondary">
                {formatCurrency(item.net_salary || 0)}
              </td>

              {/* تكلفة صاحب العمل */}
              <td className="px-3 py-2.5 font-bold text-primary">
                {formatCurrency(empCost)}
              </td>
            </tr>
          );
        })}
      </tbody>

      {/* FOOTER */}
      <tfoot>
        <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold text-xs">
          <td colSpan={2} className="px-3 py-2.5">
            الإجمالي ({salaryReport?.length || 0} موظف)
          </td>

          <td className="px-3 py-2.5">
            {formatCurrency(
              (salaryReport || []).reduce((s, e) => s + (e.wage || 0), 0)
            )}
          </td>

          <td className="px-3 py-2.5">
            {formatCurrency(
              (salaryReport || []).reduce((s, e) => s + (e.total_salary || 0), 0)
            )}
          </td>

          <td className="px-3 py-2.5 text-amber-600">
            (
            {formatCurrency(
              (salaryReport || []).reduce((s, e) => s + (e.gosi_employee || 0), 0)
            )}
            )
          </td>

          <td className="px-3 py-2.5 text-orange-600">
            {formatCurrency(
              (salaryReport || []).reduce((s, e) => s + (e.gosi_employer || 0), 0)
            )}
          </td>

          <td className="px-3 py-2.5 text-secondary">
            {formatCurrency(
              (salaryReport || []).reduce((s, e) => s + (e.net_salary || 0), 0)
            )}
          </td>

          <td className="px-3 py-2.5 text-primary">
            {formatCurrency(
              (salaryReport || []).reduce((s, e) => s + (e.employer_cost || 0), 0)
            )}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</div>

                  {/* Dept Chart */}
                  {deptPayroll.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-5">
                      <h3 className="font-semibold text-sm mb-4">توزيع الرواتب بالأقسام</h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={deptPayroll}>
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={v => formatCurrency(v)} />
                          <Bar dataKey="payroll" fill="hsl(213 55% 25%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              )}
{activeReport === "compliance" && (
  <div className="space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

      {/* Saudization */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
          🇸🇦 نسب السعودة (نطاقات)
        </h3>

        {(filtered?.length || 0) > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={nationalityData || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  dataKey="value"
                >
                  {(nationalityData || []).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="grid grid-cols-2 gap-3 mt-2">

              {/* نسبة السعودة */}
              <div className="text-center bg-green-50 rounded-lg p-3">
                <p className="text-xl font-bold text-green-700">
                  {filtered?.length
                    ? Math.round(
                        (saudis.length / filtered.length) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">
                  نسبة السعودة
                </p>
              </div>

              {/* عدد المقيمين */}
              <div className="text-center bg-blue-50 rounded-lg p-3">
                <p className="text-xl font-bold text-blue-700">
                  {nonSaudis?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  موظف مقيم
                </p>
              </div>

            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground py-8 text-sm">
            لا يوجد بيانات
          </p>
        )}
      </div>

      {/* Expiring Docs */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
          ⚠️ وثائق تستحق التجديد (90 يوم)
        </h3>

        <div className="space-y-2">
          {(filtered || [])
            .filter((e) => {
              if (!e.id_expiry) return false;

              const days = Math.ceil(
                (new Date(e.id_expiry) - new Date()) /
                  (1000 * 60 * 60 * 24)
              );

              return days <= 90;
            })
            .map((emp) => {
              const days = Math.ceil(
                (new Date(emp.id_expiry) - new Date()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={emp.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    days <= 30
                      ? "bg-red-50 border-red-200"
                      : "bg-amber-50 border-amber-200"
                  }`}
                >
                  <span className="font-medium">
                    {emp.full_name_ar || "—"}
                  </span>

                  <span
                    className={
                      days <= 30
                        ? "text-red-700 font-bold"
                        : "text-amber-700"
                    }
                  >
                    {days < 0 ? "منتهية" : `${days} يوم`}
                  </span>
                </div>
              );
            })}

          {/* empty state */}
          {(filtered || []).filter((e) => {
            if (!e.id_expiry) return false;
            const days = Math.ceil(
              (new Date(e.id_expiry) - new Date()) /
                (1000 * 60 * 60 * 24)
            );
            return days <= 90;
          }).length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">
              لا توجد وثائق منتهية قريباً ✓
            </p>
          )}
        </div>
      </div>

    </div>
  </div>
)}

              {activeReport === "leave_report" && (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <div className="px-5 py-3 border-b border-border bg-muted/20 font-semibold text-sm">
      أرصدة الإجازات
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {[
              "الموظف",
              "القسم",
              "سنوات الخدمة",
              "الاستحقاق السنوي",
              "الرصيد الحالي",
              "قيمة التصفية",
            ].map((h) => (
              <th
                key={h}
                className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {vacationReport.length > 0 ? (
            vacationReport.map((item) => {
              return (
                <tr
                  key={item.employee?.id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  {/* الموظف */}
                  <td className="px-4 py-3 font-medium">
                    {item.employee?.name_ar || "—"}
                  </td>

                  {/* القسم */}
                  <td className="px-4 py-3 text-muted-foreground">
                    {item.department?.name || "—"}
                  </td>

                  {/* سنوات الخدمة */}
                  <td className="px-4 py-3">
                    {Number(item.years_of_service || 0).toFixed(1)}
                  </td>

                  {/* الاستحقاق السنوي */}
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                      {item.yearly_entitlement || 0} يوم
                    </span>
                  </td>

                  {/* الرصيد الحالي */}
                  <td className="px-4 py-3 font-bold text-secondary">
                    {item.current_yearly_balance || 0} يوم
                  </td>

                  {/* قيمة التصفية */}
                  <td className="px-4 py-3 text-purple-600">
                    {formatCurrency(item.settlement_value || 0)}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={6}
                className="text-center py-10 text-muted-foreground"
              >
                لا توجد بيانات إجازات
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}

     {activeReport === "eos_report" && (
  <div className="bg-card rounded-xl border border-border overflow-hidden">

    <div className="px-5 py-3 border-b border-border bg-muted/20 font-semibold text-sm">
      مخصصات نهاية الخدمة التراكمية
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">

        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {[
              "الموظف",
              "القسم",
              "تاريخ المباشرة",
              "سنوات الخدمة",
              "الراتب",
              "المخصص التراكمي",
              "المخصص الشهري",
            ].map((h) => (
              <th
                key={h}
                className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {endOfServiceReport?.data?.length > 0 ? (
            endOfServiceReport.data.map((emp) => (
              <tr
                key={emp.employee?.id}
                className="border-b border-border last:border-0 hover:bg-muted/20"
              >
                {/* الموظف */}
                <td className="px-4 py-3 font-medium">
                  {emp.employee?.name_ar || "—"}
                </td>

                {/* القسم */}
                <td className="px-4 py-3 text-muted-foreground">
                  {emp.department?.name || "—"}
                </td>

                {/* تاريخ المباشرة */}
                <td className="px-4 py-3 text-muted-foreground">
                  {emp.start_date
                    ? new Date(emp.start_date).toLocaleDateString("ar-SA")
                    : "—"}
                </td>

                {/* سنوات الخدمة */}
                <td className="px-4 py-3 font-medium">
                  {Number(emp.years_of_service || 0).toFixed(2)}
                </td>

                {/* الراتب */}
                <td className="px-4 py-3">
                  {formatCurrency(emp.wage || 0)}
                </td>

                {/* المخصص التراكمي */}
                <td className="px-4 py-3 font-bold text-primary">
                  {formatCurrency(emp.cumulative_provision || 0)}
                </td>

                {/* الشهري */}
                <td className="px-4 py-3 text-purple-600">
                  {formatCurrency(emp.monthly_provision || 0)}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-10 text-muted-foreground">
                لا توجد بيانات نهاية خدمة
              </td>
            </tr>
          )}
        </tbody>

        {/* FOOTER */}
        <tfoot>
          <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold text-sm">
            <td colSpan={5} className="px-4 py-3">
              الإجمالي
            </td>

            <td className="px-4 py-3 text-primary">
              {formatCurrency(endOfServiceReport?.total?.cumulative_provision || 0)}
            </td>

            <td className="px-4 py-3 text-purple-600">
              {formatCurrency(endOfServiceReport?.total?.monthly_provision || 0)}
            </td>
          </tr>
        </tfoot>

      </table>
    </div>
  </div>
)}

             {activeReport === "attendance_report" && (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <div className="px-5 py-3 border-b border-border bg-muted/20 font-semibold text-sm">
      تقرير الحضور والغياب
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {[
              "الموظف",
              "القسم",
              "التاريخ",
              "الحضور",
              "الانصراف",
              "الحالة",
              "تأخير (د)",
              "إضافي (س)",
            ].map((h) => (
              <th
                key={h}
                className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

      <tbody>
  {attendanceReport.length > 0 ? (
    attendanceReport.slice(0, 50).map((rec, index) => (
      <tr
        key={`${rec.employee?.id}-${rec.date}-${index}`}
        className="border-b border-border last:border-0 hover:bg-muted/20"
      >
        <td className="px-4 py-3 font-medium">
          {rec.employee?.name_ar || "—"}
        </td>

        <td className="px-4 py-3 text-muted-foreground">
          {rec.department?.name || "—"}
        </td>

        <td className="px-4 py-3">
          {rec.date
            ? new Date(rec.date).toLocaleDateString("ar-SA")
            : "—"}
        </td>

        <td className="px-4 py-3 font-mono text-xs">
          {rec.check_in || "—"}
        </td>

        <td className="px-4 py-3 font-mono text-xs">
          {rec.check_out || "—"}
        </td>

        <td className="px-4 py-3">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              rec.state?.code === "present"
                ? "bg-green-100 text-green-700"
                : rec.state?.code === "late"
                ? "bg-amber-100 text-amber-700"
                : rec.state?.code === "absent"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {rec.state?.label_ar || "—"}
          </span>
        </td>

        <td className="px-4 py-3 text-center">
          {rec.late_minutes > 0 ? (
            <span className="text-amber-600">
              {rec.late_minutes}
            </span>
          ) : (
            "—"
          )}
        </td>

        <td className="px-4 py-3 text-center">
          {rec.extra_hours > 0 ? (
            <span className="text-purple-600">
              {rec.extra_hours}
            </span>
          ) : (
            "—"
          )}
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td
        colSpan={8}
        className="text-center py-10 text-muted-foreground"
      >
        لا توجد سجلات حضور
      </td>
    </tr>
  )}
</tbody>
      </table>
    </div>
  </div>
)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}