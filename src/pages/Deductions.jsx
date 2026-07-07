import { useState, useEffect } from "react";
import { TrendingDown, Plus, X, Save, Search } from "lucide-react";
import { useRole } from "../lib/useRole";
import { getEmployees } from "@/api/departmentsApi";
import {
  getDeductions,
  createDeduction,
  updateDeduction,
} from "@/api/deductionsApi";
// const STATUS_COLORS = {
//   "قيد الاعتماد": "bg-amber-100 text-amber-700",
//   "معتمد": "bg-blue-100 text-blue-700",
//   "مطبَّق": "bg-green-100 text-green-700",
//   "مرفوض": "bg-red-100 text-red-600",
//   "مُلغى": "bg-gray-100 text-gray-500",
// };
const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  under_approval: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};
const STATE_LABELS = {
  draft: "مسودة",
  under_approval: "قيد الاعتماد",
  approved: "معتمد",
  rejected: "مرفوض",
  paid: "مطبَّق",
};
const DEDUCTION_TYPE_LABELS = {
  absence: "خصم غياب",
  lateness: "خصم تأخير",
  violation: "خصم مخالفة",
  loan: "خصم قسط سلفة",
  insurance: "خصم تأميني",
  admin: "خصم إداري",
  other: "أخرى",
};
function DeductionForm({ employees, violations, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    deduction_type: "خصم مخالفة", amount: 0, reason: "",
    month: new Date().toISOString().slice(0, 7), violation_id: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => String(e.id) === String(id));

    if (emp) {
      set("employee_id", id);
      set("employee_name", emp.full_name_ar || emp.name || "");
      set("department", emp.department || emp.department_name || "");
    }
  };

  const handleViolationSelect = (vid) => {
    const v = violations.find(x => x.id === vid);
    if (v) {
      set("violation_id", vid); set("employee_id", v.employee_id); set("employee_name", v.employee_name);
      set("department", v.department || ""); set("amount", v.penalty_amount || 0);
      set("reason", `مخالفة: ${v.violation_type} — ${v.description || ""}`);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      await createDeduction({
        employee: form.employee_id,
        deduction_type: form.deduction_type,
        date: form.month,
        amount: form.amount,
        reason: form.reason,
        state: "قيد الاعتماد",
      });

      onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const eligibleViolations = violations.filter(v => v.penalty === "خصم راتب" && v.status === "مؤكدة");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-600" />خصم جديد</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {eligibleViolations.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ربط بمخالفة (اختياري)</label>
              <select value={form.violation_id} onChange={e => handleViolationSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">بدون ربط بمخالفة...</option>
                {eligibleViolations.map(v => <option key={v.id} value={v.id}>{v.employee_name} — {v.violation_type} ({v.penalty_amount?.toLocaleString("ar-SA")} ر.س)</option>)}
              </select>
            </div>
          )}
          {!form.violation_id && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الموظف *</label>
              <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر الموظف...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar} — {e.department}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الخصم</label>
              <select value={form.deduction_type} onChange={e => set("deduction_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {["خصم غياب", "خصم تأخير", "خصم مخالفة", "خصم قسط سلفة", "خصم تأميني", "خصم إداري", "أخرى"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">شهر الخصم *</label>
              <input type="month" value={form.month} onChange={e => set("month", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">المبلغ (ريال) *</label>
            <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">السبب *</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.amount || !form.reason}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "إنشاء الخصم"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Deductions() {
  const { user } = useRole();
  const canCreate = canDo(user, "deductions", "create");
  const canApprove = canDo(user, "deductions", "approve");
  const [deductions, setDeductions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      const [ds, emps] = await Promise.all([
        getDeductions(),
        getEmployees(),
      ]);

      // normalize deductions
      const deductionsData = ds?.data ?? ds ?? [];
      const normalizedDeductions = deductionsData.map((d) => ({
        id: d.id,
        employee_name: d.employee_name,
        department: d.department,
        deduction_type: d.deduction_type,
        month: d.month_of_deduction,
        amount: d.amount,
        reason: d.reason,

        // مهم جداً
        raw_state: d.state,

        // عرض عربي فقط
        status: STATE_LABELS[d.state] || d.state,
      }));

      setDeductions(normalizedDeductions);

      // normalize employees
      const employeesData = emps?.data ?? emps ?? [];

      const normalizedEmployees = employeesData.map((e) => ({
        id: e.id,
        full_name_ar: e.name,
        department: e.department_name,
        department_id: e.department_id,
      }));

      setEmployees(normalizedEmployees);

    } catch (err) {
      console.error("LOAD DEDUCTIONS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    await updateDeduction(id, {
      state: "approved",
    });
    load();
  };
  const reject = async (id) => {
    await updateDeduction(id, {
      state: "rejected",
    });
    load();
  };
  const apply = async (id) => {
    await updateDeduction(id, {
      state: "paid",
    });
    load();
  };

  const pending = deductions.filter(
    d => d.status === "قيد الاعتماد"
  );

  const filtered = deductions
    .filter(d =>
      activeTab === "pending"
        ? d.status === "قيد الاعتماد"
        : true
    )
    .filter(d => !filterMonth || d.month === filterMonth)
    .filter(d =>
      !search ||
      d.employee_name?.includes(search) ||
      d.deduction_type?.includes(search)
    );

  const totals = {
    pending: deductions.filter(d => d.status === "قيد الاعتماد").length,

    approved: deductions.filter(d => d.status === "معتمد").length,

    applied: deductions
      .filter(d => d.status === "مطبَّق")
      .reduce((s, d) => s + (Number(d.amount) || 0), 0),
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><TrendingDown className="w-6 h-6 text-red-600" />الخصومات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة خصومات الموظفين واعتمادها وتطبيقها</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            <Plus className="w-4 h-4" />خصم جديد
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "قيد الاعتماد", value: totals.pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "معتمدة (لم تُطبَّق)", value: totals.approved, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
          { label: "مطبَّقة (ريال)", value: `${totals.applied?.toLocaleString("ar-SA")} ر.س`, color: "text-green-600", bg: "bg-green-50 border-green-200" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "all", label: `كل الخصومات (${deductions.length})` },
          { id: "pending", label: `قيد الاعتماد (${pending.length})`, badge: pending.length > 0 },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {t.badge && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالموظف أو نوع الخصم..."
            className="w-full max-w-xs pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        {filterMonth && <button onClick={() => setFilterMonth("")} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 border border-border rounded-lg">مسح الفلتر</button>}
      </div>

      {activeTab === "pending" && pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          يوجد <span className="font-bold">{pending.length}</span> خصم بانتظار موافقتك — راجع وأقِر أو ارفض
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["الموظف", "نوع الخصم", "الشهر", "المبلغ", "السبب", "الحالة", "الإجراءات"].map(h => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد خصومات</td></tr>
                : filtered.map(d => (
                  <tr key={d.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${d.status === "قيد الاعتماد" ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{d.employee_name}</p>
                      <p className="text-xs text-muted-foreground">{d.department}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{DEDUCTION_TYPE_LABELS[d.deduction_type] || d.deduction_type}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.month}</td>
                    <td className="px-4 py-3 font-bold text-red-600">{d.amount?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-40 truncate">{d.reason}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[d.raw_state]}`}>{d.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {d.status === "قيد الاعتماد" && canApprove && <>
                          <button onClick={() => approve(d.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium">اعتماد</button>
                          <button onClick={() => reject(d.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium">رفض</button>
                        </>}
                        {d.status === "معتمد" && canApprove && (
                          <button onClick={() => apply(d.id)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 font-medium">تطبيق</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {showForm && <DeductionForm employees={employees} violations={violations} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}
