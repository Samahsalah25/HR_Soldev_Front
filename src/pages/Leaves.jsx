import { useState, useEffect } from "react";
import { Plus, Plane, CheckCircle, XCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import { canDo } from "../lib/crudPermissions";
import { formatCurrency, calcLeaveEncashment, getLeaveEntitlement, calcServiceYears } from "../lib/hrUtils";

const LEAVE_DAYS = {
  "سنوية": null, "مرضية": 120, "أمومة": 70, "أبوة": 3,
  "زواج": 5, "وفاة": 5, "حج": 10, "بدون راتب": null,
};

const STATUS_COLORS = {
  "قيد الانتظار": "bg-amber-100 text-amber-700",
  "موافقة المدير": "bg-blue-100 text-blue-700",
  "معتمدة": "bg-green-100 text-green-700",
  "مرفوضة": "bg-red-100 text-red-600",
  "ملغاة": "bg-gray-100 text-gray-600",
};

export default function Leaves() {
  const { user } = useRole();
  const canCreate  = canDo(user, "leaves", "create");
  const canApprove = canDo(user, "leaves", "approve");
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    leave_type: "سنوية", start_date: "", end_date: "", days_count: 0,
    include_ticket: false, notes: "",
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [ls, emps] = await Promise.all([
      base44.entities.LeaveRequest.list("-created_date"),
      base44.entities.Employee.filter({ status: "نشط" }),
    ]);
    setLeaves(ls); setEmployees(emps); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const calcDays = (start, end) => {
    if (!start || !end) return 0;
    return Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) setForm(f => ({ ...f, employee_id: id, employee_name: emp.full_name_ar, department: emp.department || "" }));
  };

  const handleDateChange = (key, val) => {
    const updated = { ...form, [key]: val };
    updated.days_count = calcDays(updated.start_date, updated.end_date);
    setForm(updated);
  };

  const handleSubmit = async () => {
    setSaving(true);
    const ticket_status = form.include_ticket ? "مطلوبة" : "غير مطلوبة";
    await base44.entities.LeaveRequest.create({ ...form, ticket_status, status: "قيد الانتظار" });
    setShowForm(false);
    setForm({ employee_id: "", employee_name: "", department: "", leave_type: "سنوية", start_date: "", end_date: "", days_count: 0, include_ticket: false, notes: "" });
    setSaving(false);
    load();
  };

  const updateStatus = async (id, status) => {
    await base44.entities.LeaveRequest.update(id, { status, approval_date: new Date().toISOString().slice(0, 10) });
    // خصم الأيام من رصيد الموظف عند الاعتماد
    if (status === "معتمدة") {
      const leave = leaves.find(l => l.id === id);
      if (leave && leave.leave_type === "سنوية") {
        const emp = await base44.entities.Employee.get(leave.employee_id).catch(() => null);
        if (emp) {
          const currentBalance = emp.annual_leave_balance || 0;
          const newBalance = Math.max(0, currentBalance - (leave.days_count || 0));
          await base44.entities.Employee.update(emp.id, { annual_leave_balance: newBalance });
        }
      }
    }
    load();
  };

  const filtered = leaves.filter(l => !filterStatus || l.status === filterStatus);

  const pending = leaves.filter(l => l.status === "قيد الانتظار");
  const approved = leaves.filter(l => l.status === "معتمدة");

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الإجازات والتذاكر</h1>
          <p className="text-sm text-muted-foreground mt-0.5">وفق المادة 109 من نظام العمل السعودي</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium">
            <Plus className="w-4 h-4" />طلب إجازة
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الطلبات", value: leaves.length, color: "text-primary" },
          { label: "بانتظار الموافقة", value: pending.length, color: "text-amber-600" },
          { label: "معتمدة", value: approved.length, color: "text-green-600" },
          { label: "مرفوضة", value: leaves.filter(l => l.status === "مرفوضة").length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[{ id: "requests", label: "طلبات الإجازة" }, { id: "balances", label: "أرصدة الإجازات" }, { id: "tickets", label: "تذاكر الطيران" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "requests" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-muted/20">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">كل الحالات</option>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["الموظف", "نوع الإجازة", "من", "إلى", "الأيام", "تذكرة", "الحالة", "الإجراءات"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد طلبات</td></tr>
                ) : filtered.map(leave => (
                  <tr key={leave.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{leave.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{leave.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{leave.leave_type}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{leave.start_date ? new Date(leave.start_date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{leave.end_date ? new Date(leave.end_date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-4 py-3 font-semibold text-center">{leave.days_count}</td>
                    <td className="px-4 py-3 text-center">
                      {leave.include_ticket ? <Plane className="w-4 h-4 text-secondary mx-auto" /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[leave.status] || ""}`}>{leave.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {leave.status === "قيد الانتظار" && canApprove && (
                        <div className="flex gap-1">
                          <button onClick={() => updateStatus(leave.id, "معتمدة")} title="قبول"
                            className="p-1.5 rounded hover:bg-green-50 text-green-600"><CheckCircle className="w-4 h-4" /></button>
                          <button onClick={() => updateStatus(leave.id, "مرفوضة")} title="رفض"
                            className="p-1.5 rounded hover:bg-red-50 text-red-600"><XCircle className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "balances" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["الموظف", "سنوات الخدمة", "الاستحقاق السنوي", "الرصيد الحالي", "قيمة التصفية"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const years = emp.join_date ? calcServiceYears(emp.join_date) : 0;
                  const entitlement = getLeaveEntitlement(years);
                  const balance = emp.annual_leave_balance || 0;
                  const encashVal = calcLeaveEncashment(emp.basic_salary || 0, emp.housing_allowance || 0, balance);
                  return (
                    <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{emp.full_name_ar}</p>
                        <p className="text-xs text-muted-foreground">{emp.department}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{years.toFixed(1)} سنة</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{entitlement} يوم / سنة</span>
                      </td>
                      <td className="px-4 py-3 font-bold text-secondary">{balance} يوم</td>
                      <td className="px-4 py-3 text-purple-600">{formatCurrency(encashVal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["الموظف", "الوجهة", "الدرجة", "دورية الاستحقاق", "قيمة التذكرة", "حالة الاستحقاق"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.filter(e => e.ticket_entitlement !== "غير مستحق").map(emp => (
                  <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{emp.full_name_ar}</p>
                      <p className="text-xs text-muted-foreground">{emp.nationality}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.ticket_destination || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{emp.ticket_class || "اقتصادية"}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.ticket_entitlement}</td>
                    <td className="px-4 py-3 font-semibold text-secondary">{formatCurrency(emp.ticket_value)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">مستحقة</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">طلب إجازة جديد</h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-muted">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الموظف *</label>
                <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">اختر الموظف...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar} — {e.job_title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نوع الإجازة *</label>
                <select value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {Object.keys(LEAVE_DAYS).map(t => <option key={t} value={t}>{t}{LEAVE_DAYS[t] ? ` (حتى ${LEAVE_DAYS[t]} يوم)` : ""}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">من تاريخ *</label>
                  <input type="date" value={form.start_date} onChange={e => handleDateChange("start_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">إلى تاريخ *</label>
                  <input type="date" value={form.end_date} onChange={e => handleDateChange("end_date", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              {form.days_count > 0 && (
                <div className="bg-primary/5 rounded-lg px-4 py-2 text-sm font-medium text-primary">
                  عدد الأيام: {form.days_count} يوم
                </div>
              )}
              {form.leave_type === "سنوية" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.include_ticket} onChange={e => setForm(f => ({ ...f, include_ticket: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">تضمين تذكرة طيران</span>
                </label>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
              <button onClick={handleSubmit} disabled={saving || !form.employee_id || !form.start_date || !form.end_date}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "إرسال الطلب"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}