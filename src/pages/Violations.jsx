import { useState, useEffect } from "react";
import { AlertTriangle, Plus, X, Save, Search, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import { canDo } from "../lib/crudPermissions";

const STATUS_COLORS = {
  "قيد المراجعة": "bg-amber-100 text-amber-700",
  "مؤكدة": "bg-red-100 text-red-600",
  "ملغاة": "bg-gray-100 text-gray-500",
};

function ViolationForm({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    violation_type: "تأخر متكرر", description: "", date: new Date().toISOString().slice(0, 10),
    penalty: "إنذار كتابي", penalty_days: 0, penalty_amount: 0, issued_by: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { set("employee_id", id); set("employee_name", emp.full_name_ar); set("department", emp.department || ""); }
  };
  const handleSave = async () => {
    setSaving(true);
    await base44.entities.Violation.create({ ...form, status: "قيد المراجعة" });
    onSave();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-600" />تسجيل مخالفة</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5"><label className="text-sm font-medium">الموظف *</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">نوع المخالفة</label>
              <select value={form.violation_type} onChange={e => set("violation_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {["تأخر متكرر","غياب بدون إذن","مخالفة سلوكية","مخالفة إجراءات","إهمال في العمل","مخالفة أمن معلومات","أخرى"].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ المخالفة</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium">وصف المخالفة *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium">العقوبة</label>
            <select value={form.penalty} onChange={e => set("penalty", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              {["إنذار شفهي","إنذار كتابي","خصم راتب","إيقاف عن العمل","إنهاء خدمة","قيد المراجعة"].map(p => <option key={p}>{p}</option>)}
            </select></div>
          {(form.penalty === "خصم راتب") && (
            <div className="space-y-1.5"><label className="text-sm font-medium">مبلغ الخصم (ريال)</label>
              <input type="number" min={0} value={form.penalty_amount} onChange={e => set("penalty_amount", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          )}
          {form.penalty === "إيقاف عن العمل" && (
            <div className="space-y-1.5"><label className="text-sm font-medium">أيام الإيقاف</label>
              <input type="number" min={0} value={form.penalty_days} onChange={e => set("penalty_days", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          )}
          <div className="space-y-1.5"><label className="text-sm font-medium">صادرة من</label>
            <input value={form.issued_by} onChange={e => set("issued_by", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.description}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "تسجيل المخالفة"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Violations() {
  const { user } = useRole();
  const canCreate  = canDo(user, "violations", "create");
  const canApprove = canDo(user, "violations", "approve");
  const [violations, setViolations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const load = async () => {
    const [vs, emps] = await Promise.all([
      base44.entities.Violation.list("-date"),
      base44.entities.Employee.list(),
    ]);
    setViolations(vs); setEmployees(emps); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const confirm_ = async (id) => {
    const v = violations.find(x => x.id === id);
    await base44.entities.Violation.update(id, { status: "مؤكدة" });
    // auto-create deduction if penalty is salary deduction
    if (v && v.penalty === "خصم راتب" && v.penalty_amount > 0) {
      await base44.entities.Deduction.create({
        employee_id: v.employee_id,
        employee_name: v.employee_name,
        department: v.department || "",
        deduction_type: "خصم مخالفة",
        amount: v.penalty_amount,
        reason: `مخالفة: ${v.violation_type}${v.description ? " — " + v.description : ""}`,
        month: new Date().toISOString().slice(0, 7),
        violation_id: id,
        status: "قيد الاعتماد",
        requires_approval: true,
      });
    }
    load();
  };
  const cancel_ = async (id) => {
    await base44.entities.Violation.update(id, { status: "ملغاة" });
    load();
  };

  const filtered = violations
    .filter(v => !filterDate || v.date?.slice(0, 7) === filterDate)
    .filter(v => !search || v.employee_name?.includes(search) || v.violation_type?.includes(search));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-red-600" />المخالفات التأديبية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">تسجيل وإدارة المخالفات والعقوبات</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            <Plus className="w-4 h-4" />تسجيل مخالفة
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي المخالفات", value: violations.length, color: "text-foreground" },
          { label: "قيد المراجعة", value: violations.filter(v => v.status === "قيد المراجعة").length, color: "text-amber-600" },
          { label: "مؤكدة", value: violations.filter(v => v.status === "مؤكدة").length, color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث..."
            className="w-full max-w-xs pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <input type="month" value={filterDate} onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        {filterDate && <button onClick={() => setFilterDate("")} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 border border-border rounded-lg">مسح الفلتر</button>}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["الموظف","نوع المخالفة","التاريخ","العقوبة","الحالة","إجراء"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد مخالفات</td></tr>
              : filtered.map(v => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{v.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{v.department}</p>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{v.violation_type}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{v.date ? new Date(v.date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-foreground">{v.penalty}</span>
                    {v.penalty_amount > 0 && <span className="text-xs text-red-600 block">{v.penalty_amount?.toLocaleString("ar-SA")} ر.س</span>}
                    {v.penalty_days > 0 && <span className="text-xs text-amber-600 block">{v.penalty_days} أيام</span>}
                  </td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status]}`}>{v.status}</span></td>
                  <td className="px-4 py-3">
                    {v.status === "قيد المراجعة" && canApprove && (
                      <div className="flex gap-1">
                        <button onClick={() => confirm_(v.id)} title="تأكيد" className="p-1.5 hover:bg-red-50 text-red-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => cancel_(v.id)} title="إلغاء" className="p-1.5 hover:bg-gray-50 text-gray-500 rounded"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showForm && canCreate && <ViolationForm employees={employees} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}