import { useState, useEffect } from "react";
import { Plus, Plane, CheckCircle, XCircle } from "lucide-react";
import { useRole } from "../lib/useRole";
import {
  getAllVacationRequests,
  createVacationRequest,
  getVacationYearlyBalance,
  getFlyingTicket,
  vacationAction,
  sendToManager as apiSendToManager,
  managerApprove as apiManagerApprove,
} from "@/api/requestsApi";
import { getEmployeesList } from "@/api/employeesApi";


const STATUS_MAP = {
  confirm: "قيد الانتظار",
  validate: "معتمدة",
  refuse: "مرفوضة",
  waiting_manager_approval: "انتظار موافقة المدير",
  hr_under_review: "قيد مراجعة HR",
};

const LEAVE_TYPES = {
  yearly: "سنوية",
  sick_leaves: "مرضية (حتى 120 يوم)",
  unpaid: "بدون راتب",
  peternety: "أمومة (حتى 70 يوم)",
  fatherly: "أبوة (حتى 3 أيام)",
  marriage: "زواج (حتى 5 أيام)",
  death: "وفاة (حتى 5 أيام)",
  plimsarage: "حج (حتى 10 أيام)",
};

const STATUS_COLORS = {
  confirm: "bg-amber-100 text-amber-700",
  validate: "bg-green-100 text-green-700",
  refuse: "bg-red-100 text-red-600",
  waiting_manager_approval: "bg-purple-100 text-purple-700",
  hr_under_review: "bg-blue-100 text-blue-700",
};

export default function Leaves() {
  const { user, canDo } = useRole();
  const canCreate = canDo("leaves", "create");
  const canApprove = canDo("leaves", "approve");
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({
    employee_id: "",
    vacation_type: "yearly",
    from: "",
    to: "",
    contains_flying_ticket: false,
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [balances, setBalances] = useState([]);
  const [tickets, setTickets] = useState([]);

  const load = async () => {
    const [vacationsRes, balancesRes, ticketsRes, employeesRes] = await Promise.all([
      getAllVacationRequests(),
      getVacationYearlyBalance(),
      getFlyingTicket(),
      getEmployeesList(),
    ]);

    setLeaves(vacationsRes?.data || []);
    setBalances(balancesRes?.data || []);
    setTickets(ticketsRes?.data || []);
    setEmployees(Array.isArray(employeesRes) ? employeesRes : []);

    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const calcDays = (from, to) => {
    if (!from || !to) return 0;
    return Math.ceil((new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleEmpSelect = (id) => {
    setForm(f => ({ ...f, employee_id: id }));
  };

  const handleDateChange = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await createVacationRequest({
        employee_id: Number(form.employee_id),
        vacation_type: form.vacation_type,
        from: form.from,
        to: form.to,
        contains_flying_ticket: form.contains_flying_ticket,
        notes: form.notes,
      });
      setShowForm(false);
      setForm({
        employee_id: "",
        vacation_type: "yearly",
        from: "",
        to: "",
        contains_flying_ticket: false,
        notes: "",
      });
      load();
    } catch (err) {
      const rawError = err?.response?.data;
      let msg = "حصل خطأ أثناء إرسال الطلب";
      if (typeof rawError === "string" && rawError.includes("overlaps")) {
        msg = "الموظف لديه إجازة موافق عليها في نفس الفترة المطلوبة";
      } else if (rawError?.error) {
        msg = rawError.error.includes("overlaps")
          ? "الموظف لديه إجازة موافق عليها في نفس الفترة المطلوبة"
          : rawError.error;
      }
      alert(msg);
    } finally {
      setSaving(false);
    }
  };


  const updateStatus = async (id, action) => {
    try {
      await vacationAction(id, action);
      load();
    } catch (err) {
      const msg = err?.response?.data?.error || "حصل خطأ أثناء تنفيذ الإجراء";
      alert(msg);
    }
  };

  const sendToManager = async (id) => {
    try {
      await apiSendToManager(id);
      load();
    } catch (err) {
      console.error(err?.response?.data || err);
      load();
    }
  };

  const managerApprove = async (id) => {
    try {
      await apiManagerApprove(id);
      load();
    } catch (err) {
      console.error(err?.response?.data || err);
      alert("حصل خطأ");
    }
  };

  const filtered = leaves.filter(
    l => !filterStatus || l.state === filterStatus
  );

  const pending = leaves.filter(
    l => l.state === "confirm"
  );
  const rejected = leaves.filter(l => l.state === "refuse");
  const approved = leaves.filter(
    l => l.state === "validate"
  );
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
          { label: "مرفوضة", value: rejected.length, color: "text-red-600" },
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
              <option value="confirm">قيد الانتظار</option>
              <option value="waiting_manager_approval">انتظار موافقة المدير</option>
              <option value="hr_under_review">قيد مراجعة HR</option>
              <option value="validate">معتمدة</option>
              <option value="refuse">مرفوضة</option>
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
                      <p className="font-medium text-foreground">{leave.employee?.name_ar}</p>
                      <p className="text-xs text-muted-foreground">{leave.department}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">{leave.type_of_timeoff}</span>
                    </td><td className="px-4 py-3 text-muted-foreground">
                      {leave.from
                        ? new Date(leave.from).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {leave.to
                        ? new Date(leave.to).toLocaleDateString("ar-SA")
                        : "—"}
                    </td>

                    <td className="px-4 py-3 font-semibold text-center">
                      {leave.days ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {leave.ticket ? <Plane className="w-4 h-4 text-secondary mx-auto" /> : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[leave.state] || "bg-gray-100 text-gray-600"}`}>
                        {STATUS_MAP[leave.state] || leave.state}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canApprove && (
                        <div className="flex flex-wrap gap-1 items-center">
                          {leave.state === "waiting_manager_approval" ? (
                            <>
                              <button
                                onClick={() => managerApprove(leave.id)}
                                className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium hover:bg-blue-200"
                              >
                                ✓ اعتماد المدير
                              </button>
                              <button
                                onClick={() => updateStatus(leave.id, "refuse")}
                                title="رفض"
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          ) : !["validate", "refuse"].includes(leave.state) ? (
                            <>
                              <button
                                onClick={() => updateStatus(leave.id, "refuse")}
                                title="رفض"
                                className="p-1.5 hover:bg-red-50 text-red-500 rounded"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateStatus(leave.id, "accept")}
                                title="قبول"
                                className="p-1.5 hover:bg-green-50 text-green-600 rounded"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              {leave.state === "confirm" && (
                                <button
                                  onClick={() => sendToManager(leave.id)}
                                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium hover:bg-purple-200"
                                >
                                  ⟳ أحل للمدير
                                </button>
                              )}
                            </>
                          ) : null}
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
                {balances.map(emp => (
                  <tr key={emp.employee.id} className="border-b border-border hover:bg-muted/20">

                    <td className="px-4 py-3">
                      <p className="font-medium">{emp.employee?.name_ar}</p>
                      <p className="text-xs text-muted-foreground">{emp.employee?.name}</p>
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {emp.years_of_service}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                        {emp.yearly_vacation_days_left} يوم
                      </span>
                    </td>

                    <td className="px-4 py-3 font-bold text-secondary">
                      {emp.yearly_vacation_days_left} يوم
                    </td>

                    <td className="px-4 py-3 text-purple-600">
                      {emp.settlement_value} ر.س
                    </td>

                  </tr>
                ))}
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
                {tickets.map(emp => (
                  <tr key={emp.employee.id} className="border-b border-border hover:bg-muted/20">

                    <td className="px-4 py-3">
                      <p className="font-medium">{emp.employee?.name_ar}</p>
                    </td>

                    <td className="px-4 py-3">
                      {emp.ticket_destination || "—"}
                    </td>

                    <td className="px-4 py-3 text-secondary font-semibold ">
                      {emp.ticket_class || "—"}
                    </td>

                    <td className="px-4 py-3">
                      {emp.ticket_entitlement}
                    </td>

                    <td className="px-4 py-3 font-semibold text-secondary">
                      {emp.ticket_price}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${emp.state_of_entitlement === "entitled"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                        }`}>
                        {emp.state_of_entitlement === "entitled"
                          ? "مستحق"
                          : "غير مستحق"}
                      </span>
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

              {/* الموظف */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الموظف *</label>
                <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">اختر الموظف...</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name_ar || e.name || e.full_name_ar || `موظف #${e.id}`}
                      {(e.department_name || e.department) ? ` — ${e.department_name || e.department}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* نوع الإجازة */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نوع الإجازة *</label>
                <select value={form.vacation_type} onChange={e => setForm(f => ({ ...f, vacation_type: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {Object.entries(LEAVE_TYPES).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* التواريخ */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">من تاريخ *</label>
                  <input type="date" value={form.from} onChange={e => handleDateChange("from", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">إلى تاريخ *</label>
                  <input type="date" value={form.to} onChange={e => handleDateChange("to", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              {/* عدد الأيام */}
              {calcDays(form.from, form.to) > 0 && (
                <div className="bg-primary/5 rounded-lg px-4 py-2 text-sm font-medium text-primary">
                  عدد الأيام: {calcDays(form.from, form.to)} يوم
                </div>
              )}

              {/* تذكرة طيران - فقط للسنوية */}
              {form.vacation_type === "yearly" && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.contains_flying_ticket}
                    onChange={e => setForm(f => ({ ...f, contains_flying_ticket: e.target.checked }))}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium">تضمين تذكرة طيران ✈️</span>
                </label>
              )}

              {/* ملاحظات */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ملاحظات</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
              <button onClick={handleSubmit} disabled={saving || !form.employee_id || !form.from || !form.to}
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