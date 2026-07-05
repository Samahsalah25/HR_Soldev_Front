import { useState, useEffect } from "react";
import { User, CalendarDays, DollarSign, Clock, Send, FileText, AlertTriangle, CheckCircle, ShieldAlert, ExternalLink, BookOpen, Briefcase, CreditCard, ClipboardList, Lock, Eye, EyeOff  ,Download} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency, calcPayslip, getLeaveEntitlement, calcServiceYears, calcAutoLeaveBalance } from "../lib/hrUtils";
import {
  getPortalOverview,
  getPortalProfile,
  getPortalVacations ,
    getPortalSalary,
      getPortalAttendance,
        getPortalRequests,
         getPortalPolicies,
           downloadPortalPolicy,
             getPortalLoans,
             getPortalCustody,
             getPortalDisciplinary ,
              getPortalPassword ,
              resetPortalPassword ,
               createPortalVacation ,
               changePassword
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
const [salary, setSalary] = useState(null);

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
const [passwordInfo, setPasswordInfo] = useState(null);
const loadData = async () => {
  try {
const [
  overview,
  profile,
  vacations,
  salary,
  attendance,
  requests,
  policies,
  loans,
  custodies,
  disciplinary,   // 👈 أضفها
] = await Promise.all([
  getPortalOverview(),
  getPortalProfile(),
  getPortalVacations(),
  getPortalSalary(),
  getPortalAttendance(),
  getPortalRequests(),
  getPortalPolicies(),
  getPortalLoans(),
  getPortalCustody(),
  getPortalDisciplinary(), // 👈 API جديد
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
    setSalary(salary?.data ?? null);
    // ======================
    const mappedCustodies = (custodies?.data || []).map((c) => ({
  id: c.id,
  name: c.custody_name,
  description: c.description,
  price: c.price,
  assigned_date: c.assigned_date,
  state: c.state,
}));

setMyCustodies(mappedCustodies);
    // KPIs (source of truth)
    // ======================
    setKpis(overview?.data?.kpis ?? null);
const mappedAttendance = (attendance?.data || []).map((a) => ({
  id: a.id,
  date: a.date,
  check_in: a.login || "—",
  check_out: a.logout || "—",
  late_minutes: a.lateness ?? 0,
  status:
    a.state === "present"
      ? "حاضر"
      : a.state === "late"
      ? "متأخر"
      : a.state === "absent"
      ? "غائب"
      : a.state,
}));

setMyAttendance(mappedAttendance);
const mappedPolicies = (policies?.data || []).map((p) => ({
  id: p.id,
  title: p.policy_title,
  title_en: p.title_en,
  category: p.policy_class,
  description: p.description,
  version: p.version,
  effective_date: p.effective_date,
  has_pdf: p.has_pdf,
}));

setPolicies(mappedPolicies);
const mappedRequests = (requests?.data || []).map((r) => ({
  id: r.id,
  request_type: r.request_type,
  created_date: r.date_of_submission,
  status: r.state_arabic,
  amount: r.amount,
  description: r.description,
}));

setMyRequests(mappedRequests);
    // ======================
    // Leaves (NORMALIZED)
    // ======================
 // ======================
// Leaves (NORMALIZED)
// ======================

const mapLeaveStatus = (state) => {
  if (!state) return "قيد الانتظار";

  switch (state) {
    case "validate":
    case "approved":
      return "معتمدة";

    case "refuse":
    case "reject":
      return "مرفوضة";

    default:
      return "قيد الانتظار";
  }
};

const mappedLeaves = (vacations?.data || []).map((l) => ({
  id: l.id,
  leave_type: l.type_of_timeoff,
  start_date: l.from,
  end_date: l.to,
  days_count: l.days,
  state: l.state,
  status: mapLeaveStatus(l.state), // ✅ مهم جدًا
  notes: l.notes,
}));

setMyLeaves(mappedLeaves);
    const mappedViolations = (disciplinary?.data || []).map(v => ({
  id: v.id,
  violation_type: v.violation_type,
  date: v.date,
  penalty: v.penalty_type,
  status: v.state,
}));

setMyViolations(mappedViolations);

    const mappedLoans = (loans?.data || []).map((l) => ({
  id: l.id,
  reference: l.reference,
  amount: l.loan_amount,
  remaining_amount: l.remaining_amount,
  monthly_deduction: l.monthly_installment,
  installments: l.number_of_installments,
  reason: l.reason,
  state: l.state,
  paid_amount: (l.loan_amount || 0) - (l.remaining_amount || 0),
}));

setMyLoans(mappedLoans);
  } catch (error) {
    console.error("loadData error:", error);
    setKpis(null);
    setMyLeaves([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { loadData().catch(() => setLoading(false)); }, []);
useEffect(() => {
  const load = async () => {
    try {
      const res = await getPortalPassword();

      if (res?.success) {
        // الأفضل نفصل password state بدل ما نكسر employee
        setPasswordInfo(res.data);
      }
    } catch (err) {
      console.error("password status error", err);
    }
  };

  load();
}, []);
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
  setPasswordMsg?.(null);

  try {
    const notes = leaveForm.is_exceptional
      ? `[استثنائية] ${leaveForm.justification}${
          leaveForm.notes ? " | " + leaveForm.notes : ""
        }`
      : leaveForm.notes;

    // ✅ استخدام API الجديد بدل base44
    await createPortalVacation({
      vacation_type: leaveForm.leave_type,
      from: leaveForm.start_date,
      to: leaveForm.end_date,
      contains_flying_ticket: leaveForm.include_ticket,
      notes,
    });

    // Close modal + reset form
    setShowLeaveForm(false);
    setLeaveForm({
      leave_type: "سنوية",
      start_date: "",
      end_date: "",
      notes: "",
      include_ticket: false,
      is_exceptional: false,
      justification: "",
    });

    // ✅ إعادة تحميل الإجازات من نفس API
    const lvs = await getPortalVacations();

 const mapLeaveStatus = (state) => {
  if (!state) return "قيد الانتظار";

  const normalized = state.toLowerCase();

  if (normalized.includes("validate") || normalized.includes("approved")) {
    return "معتمدة";
  }

  if (normalized.includes("refuse") || normalized.includes("rejected")) {
    return "مرفوضة";
  }

  return "قيد الانتظار";
};

const mappedLeaves = (lvs?.data || []).map((l) => ({
  id: l.id,
  leave_type: l.type_of_timeoff,
  start_date: l.from,
  end_date: l.to,
  days_count: l.days,
  status: mapLeaveStatus(l.state),
  notes: l.notes,
}));

    setMyLeaves(mappedLeaves);
  } catch (err) {
    console.error("Leave submit error:", err);

    // optional UI feedback
    setPasswordMsg?.({
      type: "error",
      text: "حصل خطأ أثناء إرسال طلب الإجازة",
    });
  } finally {
    setSaving(false);
  }
};
  const handleDownloadPolicy = async (id) => {
  try {
    const blob = await downloadPortalPolicy(id);

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `policy-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
  }
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

    {/* Table */}
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["نوع الإجازة", "من", "إلى", "الأيام", "الحالة", "ملاحظات"].map((h) => (
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
            myLeaves.map((l) => (
              <tr key={l.id} className="border-b border-border hover:bg-muted/20">

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

                {/* STATUS (FIXED) */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      l.status === "معتمدة"
                        ? "bg-green-100 text-green-700"
                        : l.status === "مرفوضة"
                        ? "bg-red-100 text-red-600"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
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
      <SRow
        label="الراتب الأساسي"
        value={formatCurrency(salary?.wage ?? 0)}
      />

      <SRow
        label="بدل السكن"
        value={formatCurrency(salary?.allowances?.housing ?? 0)}
      />

      <SRow
        label="بدل النقل"
        value={formatCurrency(salary?.allowances?.transport ?? 0)}
      />

      <SRow
        label="بدل الغذاء"
        value={formatCurrency(salary?.allowances?.food ?? 0)}
      />

      <SRow
        label="بدل الاتصالات"
        value={formatCurrency(salary?.allowances?.communication ?? 0)}
      />

      <SRow
        label="بدلات أخرى"
        value={formatCurrency(salary?.allowances?.other ?? 0)}
      />

      <div className="border-t border-border pt-2 mt-2">
        <SRow
          label="إجمالي الاستحقاقات"
          value={formatCurrency(salary?.total_salary ?? 0)}
          bold
        />
      </div>

      <div className="mt-1 p-2 bg-green-50 rounded-lg text-xs text-green-700 text-center">
        {salary?.gosi_message_ar}
      </div>

      <div className="border-t border-border pt-2 mt-2">
        <SRow
          label="استقطاع التأمينات"
          value={formatCurrency(salary?.gosi_deduction ?? 0)}
        />
      </div>

      <div className="border-t-2 border-primary/20 pt-3 mt-3 bg-slate-50 rounded-lg px-3 py-2">
        <SRow
          label="صافي الراتب"
          value={formatCurrency(salary?.net_salary ?? 0)}
          bold
          green
        />
      </div>
    </div>
  </div>
)}

     {activeTab === "attendance" && (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/30 border-b border-border">
          {["التاريخ", "الحضور", "الانصراف", "الحالة", "التأخير"].map((h) => (
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
        {myAttendance.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="text-center py-8 text-muted-foreground text-sm"
            >
              لا توجد سجلات حضور
            </td>
          </tr>
        ) : (
          myAttendance.map((r) => (
            <tr
              key={r.id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-2.5 text-muted-foreground">
                {r.date
                  ? new Date(r.date).toLocaleDateString("ar-SA")
                  : "—"}
              </td>

              <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                {r.check_in}
              </td>

              <td className="px-4 py-2.5 font-mono text-xs text-foreground">
                {r.check_out}
              </td>

              <td className="px-4 py-2.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === "حاضر"
                      ? "bg-green-100 text-green-700"
                      : r.status === "متأخر"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {r.status}
                </span>
              </td>

              <td className="px-4 py-2.5 text-center">
                {r.late_minutes > 0 ? (
                  <span className="text-amber-600 text-xs font-medium">
                    {r.late_minutes} دقيقة
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}

    {activeTab === "policies" && (
  <div className="space-y-4">
    <p className="text-sm text-muted-foreground">
      سياسات وأنظمة الشركة المعتمدة
    </p>

    {policies.length === 0 ? (
      <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">لا توجد سياسات منشورة حالياً</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((pol) => (
          <div
            key={pol.id}
            className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-foreground">
                  {pol.title}
                </h3>

                {pol.description && (
                  <p className="text-sm text-muted-foreground">
                    {pol.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
                    الإصدار {pol.version}
                  </span>

                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">
                    ساري من{" "}
                    {new Date(pol.effective_date).toLocaleDateString("ar-SA")}
                  </span>

                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      pol.has_pdf
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {pol.has_pdf ? "PDF متوفر" : "بدون ملف"}
                  </span>
                     {pol.has_pdf && (
                      (<button
                        onClick={() => handleDownloadPolicy(pol.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        تنزيل
                      </button>)
                    )}
                </div>
              </div>

              {pol.has_pdf && (
                <button
                  disabled
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs opacity-60 cursor-not-allowed"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  قريباً
                </button>
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
      <thead>
        <tr className="bg-muted/30 border-b border-border">
          {["العهدة", "الوصف", "القيمة", "تاريخ الاستلام", "الحالة"].map(
            (h) => (
              <th
                key={h}
                className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
              >
                {h}
              </th>
            )
          )}
        </tr>
      </thead>

      <tbody>
        {myCustodies.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="text-center py-8 text-muted-foreground text-sm"
            >
              لا توجد عهد مسجلة
            </td>
          </tr>
        ) : (
          myCustodies.map((c) => {
            const isActive = c.state === "used";

            return (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 hover:bg-muted/20"
              >
                {/* العهدة */}
                <td className="px-4 py-3 font-medium text-foreground">
                  {c.name || "—"}
                </td>

                {/* الوصف */}
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {c.description || "—"}
                </td>

                {/* القيمة */}
                <td className="px-4 py-3 text-purple-600 font-semibold">
                  {c.price > 0
                    ? `${c.price.toLocaleString("ar-SA")} ر.س`
                    : "—"}
                </td>

                {/* التاريخ */}
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {c.assigned_date
                    ? new Date(c.assigned_date).toLocaleDateString("ar-SA")
                    : "—"}
                </td>

                {/* الحالة */}
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.state === "used"
                        ? "bg-blue-100 text-blue-700"
                        : c.state === "returned"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {c.state === "used"
                      ? "مستخدم"
                      : c.state === "returned"
                      ? "مُعاد"
                      : c.state}
                  </span>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
)}
      {activeTab === "loans" && (
  <div className="space-y-3">
    {myLoans.length === 0 ? (
      <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
        <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">لا توجد سلف</p>
      </div>
    ) : (
      myLoans.map((l) => {
        const total = l.amount || 0;
        const remaining = l.remaining_amount || 0;
        const monthly = l.monthly_deduction || 0;

        const paid = total - remaining;
        const progress =
          total > 0 ? Math.min(100, (paid / total) * 100) : 0;

        return (
          <div
            key={l.id}
            className="bg-card rounded-xl border border-border p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">
                  {total.toLocaleString("ar-SA")} ر.س
                </p>
                <p className="text-xs text-muted-foreground">
                  السبب :  {l.reason || "بدون سبب"} | مبلغ السلفة: : {l.amount?.toLocaleString("ar-SA")} ر.س |  عدد الأقساط: {l.installments || 0} | الخصم الشهري: {l.monthly_deduction?.toLocaleString("ar-SA")} ر.س
                </p>
              </div>

              <div className="text-right">
                <p className="text-red-600 font-bold">
                  {remaining.toLocaleString("ar-SA")} ر.س متبقي
                </p>

                <p className="text-xs text-muted-foreground">
                  خصم {monthly.toLocaleString("ar-SA")} ر.س / شهر
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                {paid.toLocaleString("ar-SA")} ر.س مسدَّد من أصل{" "}
                {total.toLocaleString("ar-SA")} ر.س
              </p>
            </div>
          </div>
        );
      })
    )}
  </div>
)}

    {activeTab === "requests" && (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/30 border-b border-border">
          {["نوع الطلب", "التاريخ", "الحالة", "المبلغ", "الوصف"].map((h) => (
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
        {myRequests.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              className="text-center py-8 text-muted-foreground text-sm"
            >
              لا توجد طلبات
            </td>
          </tr>
        ) : (
          myRequests.map((r) => (
            <tr
              key={r.id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              <td className="px-4 py-3">
                <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                  {r.request_type}
                </span>
              </td>

              <td className="px-4 py-3 text-xs text-muted-foreground">
                {r.created_date
                  ? new Date(r.created_date).toLocaleDateString("ar-SA")
                  : "—"}
              </td>

              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    r.status === "مقبولة"
                      ? "bg-green-100 text-green-700"
                      : r.status === "مرفوضة"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </td>

              <td className="px-4 py-3 text-xs">
                {typeof r.amount === "number"
                  ? formatCurrency(r.amount)
                  : "—"}
              </td>

              <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                {r.description || "—"}
              </td>
            </tr>
          ))
        )}
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
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            {["نوع المخالفة", "التاريخ", "العقوبة", "الحالة"].map(h => (
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
          {myViolations.map(v => (
            <tr
              key={v.id}
              className="border-b border-border last:border-0 hover:bg-muted/20"
            >
              {/* نوع المخالفة */}
              <td className="px-4 py-3">
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {v.violation_type || "—"}
                </span>
              </td>

              {/* التاريخ */}
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {v.date
                  ? new Date(v.date).toLocaleDateString("ar-SA")
                  : "—"}
              </td>

              {/* العقوبة */}
              <td className="px-4 py-3 text-xs font-medium text-foreground">
                {v.penalty === "warning"
                  ? "إنذار"
                  : v.penalty === "deduction"
                  ? "خصم"
                  : v.penalty || "—"}
              </td>

              {/* الحالة */}
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    v.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : v.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {v.status === "approved"
                    ? "معتمد"
                    : v.status === "pending"
                    ? "قيد المراجعة"
                    : v.status || "—"}
                </span>
              </td>
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

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>

        <div>
          <h3 className="font-bold text-foreground">
            {passwordInfo?.has_password ? "تعديل كلمة المرور" : "إنشاء كلمة مرور"}
          </h3>

          <p className="text-xs text-muted-foreground">
            {passwordInfo?.has_password
              ? "يمكنك تغيير كلمة مرورك في أي وقت"
              : "لا يوجد لديك كلمة مرور — أنشئ واحدة الآن"}
          </p>
        </div>
      </div>

      {/* Warning */}
      {!passwordInfo?.has_password && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>لا توجد كلمة مرور مسجلة لحسابك. قم بإنشاء كلمة مرور الآن.</span>
        </div>
      )}

      {/* Inputs */}
      <div className="space-y-4">

        {/* Current password */}
        {passwordInfo?.has_password && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">كلمة المرور الحالية</label>

            <input
              type={showCurrentPw ? "text" : "password"}
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  currentPassword: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        )}

        {/* New password */}
        {passwordInfo?.has_password && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">كلمة المرور الجديدة</label>

            <input
              type={showNewPw ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  newPassword: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        )}

        {/* Confirm password */}
        {passwordInfo?.has_password && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">تأكيد كلمة المرور</label>

            <input
              type={showConfirmPw ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({
                  ...f,
                  confirmPassword: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border rounded-lg"
            />

            {passwordForm.confirmPassword &&
              passwordForm.newPassword !== passwordForm.confirmPassword && (
                <p className="text-xs text-red-500">
                  كلمتا المرور غير متطابقتين
                </p>
              )}
          </div>
        )}
      </div>

      {/* Message */}
      {passwordMsg && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            passwordMsg.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {passwordMsg.text}
        </div>
      )}

      {/* Button */}
      <button
        disabled={
          savingPassword ||
          (passwordInfo?.has_password &&
            (!passwordForm.currentPassword ||
              !passwordForm.newPassword ||
              passwordForm.newPassword !== passwordForm.confirmPassword ||
              passwordForm.newPassword.length < 6))
        }
        onClick={async () => {
          try {
            setSavingPassword(true);
            setPasswordMsg(null);

            // CASE 1: no password → send reset link
            if (!passwordInfo?.has_password) {
              const res = await resetPortalPassword();

              setPasswordMsg({
                type: "success",
                text: res.message,
              });

              // UI update (اختياري)
              setPasswordInfo((p) => ({
                ...p,
                has_password: true,
              }));
            }

            // CASE 2: change password
           else {
  await changePassword({
    current_password: passwordForm.currentPassword,
    new_password: passwordForm.newPassword,
    confirm_new_password: passwordForm.confirmPassword,
  });

  setPasswordMsg({
    type: "success",
    text: "✅ تم تحديث كلمة المرور بنجاح",
  });

  setPasswordForm({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
}
          } catch (err) {
            setPasswordMsg({
              type: "error",
              text: "حصل خطأ، حاول مرة أخرى",
            });
          } finally {
            setSavingPassword(false);
          }
        }}
        className="w-full py-2.5 bg-primary text-white rounded-lg"
      >
        {savingPassword
          ? "جاري الإرسال..."
          : !passwordInfo?.has_password
          ? "إرسال رابط إنشاء كلمة المرور"
          : "تحديث كلمة المرور"}
      </button>

      {/* footer hint */}
      {!passwordInfo?.has_password && (
        <p className="text-xs text-center text-muted-foreground">
          سيتم إرسال رابط إلى: {passwordInfo?.email || employee?.email}
        </p>
      )}
    </div>
  </div>
)}

      {/* Leave Request Modal */}
     {showLeaveForm && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    dir="rtl"
  >
    <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="font-bold text-foreground">طلب إجازة جديد</h3>
        <button
          onClick={() => setShowLeaveForm(false)}
          className="p-2 rounded hover:bg-muted text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-4">

        {/* Balance */}
        <div className="bg-slate-50 border border-border rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            الرصيد المتاح (سنوي)
          </span>
          <span
            className={`text-lg font-bold ${
              autoBalance < 5 ? "text-red-600" : "text-secondary"
            }`}
          >
            {autoBalance} يوم
          </span>
        </div>

        {/* Leave Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            نوع الإجازة
          </label>

          <select
            value={leaveForm.leave_type}
            onChange={(e) =>
              setLeaveForm((f) => ({
                ...f,
                leave_type: e.target.value,
                is_exceptional: false,
              }))
            }
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
          >
            {Object.keys(LEAVE_TYPES_CONFIG).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">من تاريخ</label>
            <input
              type="date"
              value={leaveForm.start_date}
              onChange={(e) =>
                setLeaveForm((f) => ({
                  ...f,
                  start_date: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-border rounded-lg"
            />
          </div>

          <div>
            <label className="text-sm font-medium">إلى تاريخ</label>
            <input
              type="date"
              value={leaveForm.end_date}
              onChange={(e) =>
                setLeaveForm((f) => ({
                  ...f,
                  end_date: e.target.value,
                }))
              }
              className="w-full px-3 py-2 text-sm border border-border rounded-lg"
            />
          </div>
        </div>

        {/* Days */}
        {requestedDays > 0 && (
          <div
            className={`rounded-lg px-4 py-3 text-sm border ${
              exceedsBalance
                ? "bg-red-50 border-red-200"
                : "bg-slate-50 border-border"
            }`}
          >
            <div className="flex justify-between">
              <span>عدد الأيام المطلوبة</span>
              <span className="font-bold">{requestedDays}</span>
            </div>

            {isAnnual && (
              <p
                className={`text-xs mt-1 ${
                  exceedsBalance
                    ? "text-red-600"
                    : "text-muted-foreground"
                }`}
              >
                {exceedsBalance
                  ? `يتجاوز الرصيد بـ ${
                      requestedDays - autoBalance
                    } يوم`
                  : "ضمن الرصيد المتاح"}
              </p>
            )}
          </div>
        )}

        {/* Exceptional */}
        {isAnnual && requestedDays > autoBalance && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={leaveForm.is_exceptional}
                onChange={(e) =>
                  setLeaveForm((f) => ({
                    ...f,
                    is_exceptional: e.target.checked,
                  }))
                }
              />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  طلب استثنائي
                </p>
                <p className="text-xs text-orange-600">
                  يتطلب موافقة الإدارة
                </p>
              </div>
            </label>

            {leaveForm.is_exceptional && (
              <textarea
                value={leaveForm.justification}
                onChange={(e) =>
                  setLeaveForm((f) => ({
                    ...f,
                    justification: e.target.value,
                  }))
                }
                placeholder="التبرير..."
                className="w-full mt-2 px-3 py-2 text-sm border rounded-lg"
              />
            )}
          </div>
        )}

        {/* Ticket */}
        {leaveForm.leave_type === "سنوية" && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={leaveForm.include_ticket}
              onChange={(e) =>
                setLeaveForm((f) => ({
                  ...f,
                  include_ticket: e.target.checked,
                }))
              }
            />
            <span>تضمين تذكرة طيران</span>
          </label>
        )}

        {/* Notes */}
        <textarea
          value={leaveForm.notes}
          onChange={(e) =>
            setLeaveForm((f) => ({
              ...f,
              notes: e.target.value,
            }))
          }
          placeholder="ملاحظات..."
          className="w-full px-3 py-2 text-sm border border-border rounded-lg"
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
        <button
          onClick={() => setShowLeaveForm(false)}
          className="px-4 py-2 border rounded-lg"
        >
          إلغاء
        </button>

        <button
          onClick={handleLeaveSubmit}
          disabled={
            saving ||
            !leaveForm.start_date ||
            !leaveForm.end_date ||
            (exceedsBalance && !leaveForm.is_exceptional) ||
            (leaveForm.is_exceptional && !leaveForm.justification)
          }
          className="px-5 py-2 bg-primary text-white rounded-lg disabled:opacity-50"
        >
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