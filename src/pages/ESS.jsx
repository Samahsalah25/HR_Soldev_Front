import { useState, useEffect } from "react";
import { User, CalendarDays, DollarSign, Clock, Send, FileText, AlertTriangle, CheckCircle, ShieldAlert, ExternalLink, BookOpen, Briefcase, CreditCard, ClipboardList, Lock, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, calcPayslip, getLeaveEntitlement, calcServiceYears, calcAutoLeaveBalance } from "../lib/hrUtils";
import {
  getPortalOverview,
  getPortalProfile,
  getPortalVacations
} from "@/api/portalService";
const LEAVE_TYPES_CONFIG = {
  "سنوية":      { usesBalance: true,  maxDays: null },
  "مرضية":      { usesBalance: false, maxDays: 120 },
  "أمومة":      { usesBalance: false, maxDays: 70 },
  "أبوة":       { usesBalance: false, maxDays: 3 },
  "زواج":       { usesBalance: false, maxDays: 5 },
  "وفاة":       { usesBalance: false, maxDays: 5 },
  "حج":         { usesBalance: false, maxDays: 10 },
  "بدون راتب":  { usesBalance: false, maxDays: null },
};

export default function ESS() {
  const [employee, setEmployee] = useState(null);
  const [myLeaves, setMyLeaves] = useState([]);
  const [myAttendance, setMyAttendance] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type: "سنوية", start_date: "", end_date: "",
    notes: "", include_ticket: false, is_exceptional: false, justification: ""
  });
  const [saving, setSaving] = useState(false);

  // Password state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null); // { type: "success"|"error", text }

  const [myCustodies, setMyCustodies] = useState([]);
  const [myLoans, setMyLoans] = useState([]);
  const [myViolations, setMyViolations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
const [kpis, setKpis] = useState(null);
const loadData = async () => {
  try {
    const [overview, profile, vacations] = await Promise.all([
      getPortalOverview(),
      getPortalProfile(),
      getPortalVacations(),
    ]);

    // ======================
    // Employee merge
    // ======================
    const emp = {
      ...overview.data.employee,
      ...profile.data.personal_info,
      ...profile.data.job_info,
    };

    setEmployee(emp);

    // ======================
    // KPIs (source of truth)
    // ======================
    setKpis(overview?.data?.kpis ?? null);

    // ======================
    // Leaves (NORMALIZED)
    // ======================
    const mappedLeaves = (vacations?.data || []).map((l) => ({
      id: l.id,
      leave_type: l.type_of_timeoff,
      start_date: l.from,
      end_date: l.to,
      days_count: l.days,
      status:
        l.state === "confirm"
          ? "معتمدة"
          : l.state === "reject"
          ? "مرفوضة"
          : "قيد الانتظار",
      notes: l.notes,
    }));

    setMyLeaves(mappedLeaves);
  } catch (error) {
    console.error("loadData error:", error);
    setKpis(null);
    setMyLeaves([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { loadData().catch(() => setLoading(false)); }, []);

  const calcDays = (s, e) => !s || !e ? 0 : Math.ceil((new Date(e) - new Date(s)) / (1000 * 60 * 60 * 24)) + 1;

  // رصيد الإجازات التلقائي — من تاريخ الانضمام ناقص الإجازات المعتمدة
  const approvedAnnualDays = myLeaves
    .filter(l => l.leave_type === "سنوية" && (l.status === "معتمدة" || l.status === "موافقة المدير"))
    .reduce((s, l) => s + (l.days_count || 0), 0);

  const autoBalance = employee ? calcAutoLeaveBalance(employee.join_date, approvedAnnualDays) : 0;
  const years = employee?.join_date ? calcServiceYears(employee.join_date) : 0;
  const entitlement = getLeaveEntitlement(years);
  const payslip = employee ? calcPayslip(employee) : {};
  const totalSalary = employee ? (employee.basic_salary || 0) + (employee.housing_allowance || 0) +
    (employee.transport_allowance || 0) + (employee.food_allowance || 0) +
    (employee.communication_allowance || 0) + (employee.other_allowances || 0) : 0;


const kpiBalance = kpis?.remaining_vacation_days ?? 0;

const ticket = kpis?.ticket_entitlement ?? null;

const attendanceCount =
  kpis?.attendance_last_30_records_count ?? 0;

const pendingRequests =
  kpis?.vacation_requests_waiting_approval_count ?? 0;

// أيام الطلب
const requestedDays = calcDays(
  leaveForm.start_date,
  leaveForm.end_date
);

const isAnnual = leaveForm.leave_type === "سنوية";

// منع الحساب لو مفيش KPI
const exceedsBalance =
  !!kpis &&
  isAnnual &&
  requestedDays > kpiBalance &&
  !leaveForm.is_exceptional;

  const handleLeaveSubmit = async () => {
    if (!employee || exceedsBalance) return;
    setSaving(true);
    const notes = leaveForm.is_exceptional
      ? `[استثنائية] ${leaveForm.justification}${leaveForm.notes ? " | " + leaveForm.notes : ""}`
      : leaveForm.notes;
    await base44.entities.LeaveRequest.create({
      employee_id: employee.id,
      employee_name: employee.full_name_ar,
      department: employee.department || "",
      leave_type: leaveForm.leave_type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      days_count: requestedDays,
      include_ticket: leaveForm.include_ticket,
      ticket_status: leaveForm.include_ticket ? "مطلوبة" : "غير مطلوبة",
      notes,
      status: "قيد الانتظار",
    });
    setShowLeaveForm(false);
    setLeaveForm({ leave_type: "سنوية", start_date: "", end_date: "", notes: "", include_ticket: false, is_exceptional: false, justification: "" });
    const lvs = await base44.entities.LeaveRequest.filter({ employee_id: employee.id });
    setMyLeaves(lvs);
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (!employee) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <User className="w-12 h-12 opacity-30" />
      <p className="text-sm">لم يتم ربط هذا الحساب بسجل موظف.</p>
    </div>
  );

  const CATEGORY_COLORS = {
    "الإجازات والغياب": "bg-blue-100 text-blue-700",
    "السلوك المهني": "bg-purple-100 text-purple-700",
    "الرواتب والمزايا": "bg-green-100 text-green-700",
    "الصحة والسلامة": "bg-red-100 text-red-700",
    "الأمن المعلوماتي": "bg-gray-100 text-gray-700",
    "أخرى": "bg-amber-100 text-amber-700",
  };

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-slate-50 to-slate-100 rounded-2xl border border-border p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-primary-foreground">{employee.name?.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{employee.name}</h1>
            <p className="text-sm text-muted-foreground">{employee.job_title} — {employee.department}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{employee.is_saudi ? "🇸🇦 سعودي" : `🌍 ${employee.nationality}`}</span>
              <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium">{employee.years_of_service?.toFixed(1)} سنة خدمة</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${employee?.state?.label_ar === "نشط" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{employee?.state?.label_ar}</span>
            </div>
          </div>
          <div className="text-right">
    <p className="text-2xl font-bold text-secondary">
  {formatCurrency(employee?.net_salary)}
</p>
            <p className="text-xs text-muted-foreground">صافي الراتب الشهري</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
{/* Quick Stats */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
  {[
    {
      label: "رصيد الإجازات",
      value: `${kpis?.remaining_vacation_days ?? 0} يوم`,
      sub: "رصيد متبقي حسب النظام",
      color:
        (kpis?.remaining_vacation_days ?? 0) < 5
          ? "text-red-600"
          : "text-secondary",
    },

    {
      label: "تذكرة الطيران",
      value: kpis?.ticket_entitlement?.label_ar ?? "لا يوجد استحقاق",
      sub: kpis?.ticket_entitlement?.destination
        ? "تشمل وجهة"
        : "بدون وجهة",
      color: "text-blue-600",
    },

    {
      label: "سجلات الحضور",
      value: kpis?.attendance_last_30_records_count ?? 0,
      sub: "آخر 30 يوم",
      color: "text-primary",
    },

    {
      label: "طلبات الإجازة",
      value: kpis?.vacation_requests_waiting_approval_count ?? 0,
      sub: "قيد الانتظار",
      color: "text-amber-600",
    },
  ].map((s) => (
    <div
      key={s.label}
      className="bg-card rounded-xl border border-border p-4"
    >
      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
      <p className="text-xs font-medium text-foreground mt-0.5">
        {s.label}
      </p>
      <p className="text-xs text-muted-foreground">{s.sub}</p>
    </div>
  ))}
</div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {[
          { id: "profile", label: "بياناتي", icon: User },
          { id: "leaves", label: "الإجازات", icon: CalendarDays },
          { id: "payslip", label: "قسيمة الراتب", icon: DollarSign },
          { id: "attendance", label: "سجل الحضور", icon: Clock },
          { id: "policies", label: "سياسات الشركة", icon: BookOpen },
          { id: "custodies", label: "عهدي", icon: Briefcase },
          { id: "loans", label: "سلفي", icon: CreditCard },
          { id: "requests", label: "طلباتي", icon: ClipboardList },
          { id: "violations", label: "المخالفات", icon: AlertTriangle },
          { id: "password",   label: "كلمة المرور", icon: Lock },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Section title="البيانات الشخصية">
            <Row label="الاسم الكامل" value={employee.name} />
            <Row label="رقم الهوية/الإقامة" value={employee.identification_number} />
            <Row label="الجنسية" value={employee.nationality} />
            <Row label="رقم الجوال" value={employee.mobile_number} />
            <Row label="البريد الإلكتروني" value={employee.email} />
          </Section>
          <Section title="بيانات الوظيفة">
            <Row label="رقم الملف" value={employee.employee_number} />
            <Row label="المسمى الوظيفي" value={employee.job_title} />
            <Row label="القسم" value={employee.department} />
            <Row label="المدير المباشر" value={employee.direct_manager} />
            <Row label="تاريخ المباشرة" value={employee.start_date ? new Date(employee.start_date).toLocaleDateString("ar-SA") : "—"} />
            <Row label="نوع العقد" value={employee.contract_type} />
            <Row label="البنك / IBAN" value={employee.bank_iban ? `${employee.bank_iban} — ${employee.iban || ""}` : "—"} />
          </Section>
        </div>
      )}

   {activeTab === "leaves" && (
  <div className="space-y-4">

    {/* Balance Card */}
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            رصيد الإجازة السنوية المتراكم
          </p>

          <p className="text-xs text-muted-foreground mt-0.5">
            معتمد مُستهلك: {approvedAnnualDays} يوم
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-secondary">
            {kpis?.remaining_vacation_days ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">يوم متاح</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mt-3">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-secondary h-2 rounded-full"
            style={{
              width: `${Math.min(
                100,
                ((kpis?.remaining_vacation_days ?? 0) / (entitlement || 1)) * 100
              )}%`,
            }}
          />
        </div>

        <p className="text-xs text-muted-foreground mt-1">
          {kpis?.remaining_vacation_days ?? 0} / {entitlement} يوم سنوي
        </p>
      </div>
    </div>

    {/* Button */}
    <div className="flex justify-end">
      <button
        onClick={() => setShowLeaveForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm"
      >
        <Send className="w-4 h-4" />
        تقديم طلب إجازة
      </button>
    </div>

    {/* Table */}
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["نوع الإجازة", "من", "إلى", "الأيام", "الحالة", "ملاحظات"].map(h => (
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
          {myLeaves.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-muted-foreground">
                لا توجد طلبات إجازة
              </td>
            </tr>
          ) : (
            myLeaves.map(l => (
              <tr
                key={l.id}
                className="border-b border-border hover:bg-muted/20"
              >
                <td className="px-4 py-3 font-medium">
                  {l.leave_type}
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {l.start_date}
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {l.end_date}
                </td>

                <td className="px-4 py-3 text-center font-semibold">
                  {l.days_count}
                </td>

                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    l.status === "معتمدة"
                      ? "bg-green-100 text-green-700"
                      : l.status === "مرفوضة"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {l.status}
                  </span>
                </td>

                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {l.notes || "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

  </div>
)}
      {activeTab === "payslip" && (
        <div className="bg-card rounded-xl border border-border p-6 max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-foreground">قسيمة الراتب الشهرية</h3>
          </div>
          <div className="space-y-1.5 text-sm">
            <SRow label="الراتب الأساسي" value={formatCurrency(employee.basic_salary)} />
            <SRow label="بدل السكن" value={formatCurrency(employee.housing_allowance)} />
            <SRow label="بدل النقل" value={formatCurrency(employee.transport_allowance)} />
            <SRow label="بدل الغذاء" value={formatCurrency(employee.food_allowance)} />
            <SRow label="بدل الاتصالات" value={formatCurrency(employee.communication_allowance)} />
            <SRow label="بدلات أخرى" value={formatCurrency(employee.other_allowances)} />
            <div className="border-t border-border pt-2 mt-2">
              <SRow label="إجمالي الاستحقاقات" value={formatCurrency(totalSalary)} bold />
            </div>
            <div className="mt-1 p-2 bg-green-50 rounded-lg text-xs text-green-700 text-center">
              GOSI تتحملها الشركة كاملاً
            </div>
            <div className="border-t-2 border-primary/20 pt-3 mt-3 bg-slate-50 rounded-lg px-3 py-2">
              <SRow label="صافي الراتب" value={formatCurrency(payslip.netSalary)} bold green />
            </div>
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["التاريخ", "حضور", "انصراف", "الحالة", "تأخير"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myAttendance.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">لا توجد سجلات حضور</td></tr>
              ) : myAttendance.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 text-muted-foreground">{r.date ? new Date(r.date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.check_in || "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.check_out || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${r.status === "حاضر" ? "bg-green-100 text-green-700" : r.status === "غائب" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">{r.late_minutes > 0 ? <span className="text-amber-600 text-xs">{r.late_minutes} د</span> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "policies" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">سياسات وأنظمة الشركة المعتمدة — اضغط على السياسة لفتح الملف</p>
          {policies.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">لا توجد سياسات منشورة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {policies.map(pol => (
                <div key={pol.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{pol.title}</h3>
                      {pol.description && <p className="text-xs text-muted-foreground mt-1">{pol.description}</p>}
                    </div>
                    {pol.file_url && (
                      <a href={pol.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90">
                        <ExternalLink className="w-3.5 h-3.5" />فتح
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "custodies" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["العهدة","الوصف","القيمة","تاريخ الاستلام","الحالة"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {myCustodies.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">لا توجد عهد مسجلة</td></tr>
              ) : myCustodies.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{c.item_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.item_description || "—"}</td>
                  <td className="px-4 py-3 text-purple-600 font-semibold">{c.value > 0 ? `${c.value?.toLocaleString("ar-SA")} ر.س` : "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{c.issue_date ? new Date(c.issue_date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.status === "نشطة" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{c.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "loans" && (
        <div className="space-y-3">
          {myLoans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">لا توجد سلف</p>
            </div>
          ) : myLoans.map(l => (
            <div key={l.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">{l.amount?.toLocaleString("ar-SA")} ر.س</p>
                  <p className="text-xs text-muted-foreground">{l.reason}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-600 font-bold">{l.remaining_amount?.toLocaleString("ar-SA")} ر.س متبقي</p>
                  <p className="text-xs text-muted-foreground">خصم {l.monthly_deduction?.toLocaleString("ar-SA")} ر.س/شهر</p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((l.amount - l.remaining_amount) / l.amount) * 100)}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{l.paid_amount?.toLocaleString("ar-SA")} ر.س مسدَّد</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "requests" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["نوع الطلب","التاريخ","الحالة","المبلغ"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {myRequests.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">لا توجد طلبات</td></tr>
              ) : myRequests.map(r => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">{r.request_type}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{r.created_date ? new Date(r.created_date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.status === "مقبولة" ? "bg-green-100 text-green-700" : r.status === "مرفوضة" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-foreground text-xs">{r.amount > 0 ? `${r.amount?.toLocaleString("ar-SA")} ر.س` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "violations" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {myViolations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30 text-green-500" />
              <p className="text-sm">لا توجد مخالفات مسجلة — سجل نظيف! ✅</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["نوع المخالفة","التاريخ","العقوبة","الحالة"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {myViolations.map(v => (
                  <tr key={v.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{v.violation_type}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{v.date ? new Date(v.date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium text-foreground">{v.penalty}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${v.status === "مؤكدة" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>{v.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "password" && (
        <div className="max-w-md">
          <div className="bg-card rounded-xl border border-border p-6 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {employee.password_hash ? "تعديل كلمة المرور" : "إنشاء كلمة مرور"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {employee.password_hash ? "يمكنك تغيير كلمة مرورك في أي وقت" : "لا يوجد لديك كلمة مرور — أنشئ واحدة الآن"}
                </p>
              </div>
            </div>

            {!employee.password_hash && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>لا توجد كلمة مرور مسجلة لحسابك. قم بإنشاء كلمة مرور الآن.</span>
              </div>
            )}

            <div className="space-y-4">
              {employee.password_hash && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">كلمة المرور الحالية</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
                      placeholder="أدخل كلمة المرور الحالية"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              {employee.password_hash && (<>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
                    placeholder="أدخل كلمة المرور الجديدة"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPw(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    placeholder="أعد إدخال كلمة المرور"
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 pr-10"
                  />
                  <button type="button" onClick={() => setShowConfirmPw(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p className="text-xs text-red-500">كلمتا المرور غير متطابقتين</p>
                )}
              </div>
              </>)}
            </div>

            {passwordMsg && (
              <div className={`rounded-lg px-4 py-3 text-sm ${passwordMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {passwordMsg.text}
              </div>
            )}

            <button
              disabled={
                savingPassword ||
                (!employee.password_hash ? false : (
                  !passwordForm.currentPassword ||
                  !passwordForm.newPassword ||
                  passwordForm.newPassword !== passwordForm.confirmPassword ||
                  passwordForm.newPassword.length < 6
                ))
              }
              onClick={async () => {
                setSavingPassword(true);
                setPasswordMsg(null);
                if (!employee.password_hash) {
                  // لا توجد كلمة مرور بعد — أرسل رابط إعادة التعيين للإيميل
                  await base44.auth.resetPasswordRequest(employee.email);
                  setPasswordMsg({ type: "success", text: "✅ تم إرسال رابط إنشاء كلمة المرور إلى بريدك الإلكتروني: " + employee.email });
                } else {
                  const user = await base44.auth.me();
                  await base44.auth.changePassword({
                    userId: user.id,
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                  });
                  await base44.entities.Employee.update(employee.id, { password_hash: "set" });
                  setEmployee(e => ({ ...e, password_hash: "set" }));
                  setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  setPasswordMsg({ type: "success", text: "✅ تم تحديث كلمة المرور بنجاح" });
                }
                setSavingPassword(false);
              }}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {savingPassword ? "جاري الحفظ..." : !employee.password_hash ? "إرسال رابط الإنشاء على الإيميل" : "تحديث كلمة المرور"}
            </button>
            {!employee.password_hash && (
              <p className="text-xs text-muted-foreground text-center">سيتم إرسال رابط لإنشاء كلمة المرور على بريدك: {employee.email}</p>
            )}
            {employee.password_hash && passwordForm.newPassword && passwordForm.newPassword.length < 6 && (
              <p className="text-xs text-muted-foreground text-center">كلمة المرور يجب أن تكون 6 أحرف على الأقل</p>
            )}
          </div>
        </div>
      )}

      {/* Leave Request Modal */}
      {showLeaveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
          <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">طلب إجازة جديد</h3>
              <button onClick={() => setShowLeaveForm(false)} className="p-2 rounded hover:bg-muted text-foreground">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {/* Balance indicator */}
              <div className="bg-slate-50 border border-border rounded-lg p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الرصيد المتاح (سنوي)</span>
                <span className={`text-lg font-bold ${autoBalance < 5 ? "text-red-600" : "text-secondary"}`}>{autoBalance} يوم</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">نوع الإجازة</label>
                <select value={leaveForm.leave_type} onChange={e => setLeaveForm(f => ({ ...f, leave_type: e.target.value, is_exceptional: false }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                  {Object.keys(LEAVE_TYPES_CONFIG).map(t => (
                    <option key={t} value={t}>{t}{LEAVE_TYPES_CONFIG[t].maxDays ? ` (حتى ${LEAVE_TYPES_CONFIG[t].maxDays} يوم)` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">من تاريخ</label>
                  <input type="date" value={leaveForm.start_date} onChange={e => setLeaveForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">إلى تاريخ</label>
                  <input type="date" value={leaveForm.end_date} onChange={e => setLeaveForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
                </div>
              </div>

              {requestedDays > 0 && (
                <div className={`rounded-lg px-4 py-3 text-sm border ${exceedsBalance ? "bg-red-50 border-red-200" : "bg-slate-50 border-border"}`}>
                  <div className="flex justify-between items-center">
                    <span className={exceedsBalance ? "text-red-700 font-medium" : "text-foreground"}>عدد الأيام المطلوبة</span>
                    <span className={`font-bold text-lg ${exceedsBalance ? "text-red-700" : "text-foreground"}`}>{requestedDays} يوم</span>
                  </div>
                  {isAnnual && (
                    <p className={`text-xs mt-1 ${exceedsBalance ? "text-red-600" : "text-muted-foreground"}`}>
                      {exceedsBalance ? `⚠️ يتجاوز رصيدك المتاح (${autoBalance} يوم) بمقدار ${requestedDays - autoBalance} يوم` : `✅ ضمن الرصيد المتاح (${autoBalance} يوم)`}
                    </p>
                  )}
                </div>
              )}

              {/* Exceptional option — shows only when annual and exceeds */}
              {isAnnual && requestedDays > autoBalance && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={leaveForm.is_exceptional} onChange={e => setLeaveForm(f => ({ ...f, is_exceptional: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 accent-orange-600" />
                    <div>
                      <span className="text-sm font-medium text-orange-800">طلب استثنائي (يتجاوز الرصيد)</span>
                      <p className="text-xs text-orange-600 mt-0.5">يتطلب موافقة خاصة من الإدارة</p>
                    </div>
                  </label>
                  {leaveForm.is_exceptional && (
                    <textarea value={leaveForm.justification} onChange={e => setLeaveForm(f => ({ ...f, justification: e.target.value }))}
                      rows={2} placeholder="يرجى كتابة تبرير الطلب الاستثنائي..."
                      className="w-full px-3 py-2 text-sm border border-orange-300 rounded-lg bg-background text-foreground focus:outline-none resize-none" />
                  )}
                </div>
              )}

              {leaveForm.leave_type === "سنوية" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={leaveForm.include_ticket} onChange={e => setLeaveForm(f => ({ ...f, include_ticket: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-sm text-foreground">تضمين تذكرة طيران</span>
                </label>
              )}

              <textarea value={leaveForm.notes} onChange={e => setLeaveForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="ملاحظات إضافية..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowLeaveForm(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
              <button onClick={handleLeaveSubmit}
                disabled={saving || !leaveForm.start_date || !leaveForm.end_date || (exceedsBalance) || (leaveForm.is_exceptional && !leaveForm.justification)}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? "جاري الإرسال..." : "إرسال الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="font-semibold text-sm text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

function SRow({ label, value, bold, red, green }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${red ? "text-red-600" : green ? "text-secondary" : "text-foreground"}`}>{value}</span>
    </div>
  );
}