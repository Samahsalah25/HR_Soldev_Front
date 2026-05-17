import { useState, useEffect } from "react";
import { Plus, DollarSign, FileText, TrendingUp, TrendingDown, X, Save, Search, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency } from "../lib/hrUtils";

const ENTRY_TYPES = ["قيد يومي", "راتب", "عهدة موظف", "تصفية عهدة", "مصروف", "إيراد", "سلفة"];
const STATUS_COLORS = { "مسودة": "bg-amber-100 text-amber-700", "معتمد": "bg-green-100 text-green-700", "ملغى": "bg-gray-100 text-gray-500" };
const TYPE_COLORS = {
  "راتب": "text-blue-600", "مصروف": "text-red-600", "إيراد": "text-green-600",
  "عهدة موظف": "text-purple-600", "تصفية عهدة": "text-teal-600",
  "قيد يومي": "text-foreground", "سلفة": "text-amber-600"
};

function EntryForm({ entry, employees, onSave, onClose }) {
  const [form, setForm] = useState({
    entry_number: `QY-${Date.now().toString().slice(-6)}`,
    type: "قيد يومي", date: new Date().toISOString().slice(0, 10),
    description: "", debit_account: "", credit_account: "",
    amount: 0, employee_id: "", employee_name: "",
    reference: "", status: "مسودة", notes: "", ...(entry || {})
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { set("employee_id", id); set("employee_name", emp.full_name_ar); }
  };

  const ACCOUNTS = ["النقدية", "البنك", "الرواتب", "بدل السكن", "بدل النقل", "مصاريف إدارية", "عهد الموظفين", "السلف", "الإيرادات", "مصاريف التأمين", "نهاية الخدمة"];

  const handleSave = async () => {
    setSaving(true);
    if (entry?.id) await base44.entities.AccountingEntry.update(entry.id, form);
    else await base44.entities.AccountingEntry.create(form);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">{entry ? "تعديل القيد" : "قيد جديد"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">رقم القيد</label>
              <input value={form.entry_number} onChange={e => set("entry_number", e.target.value)} dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">التاريخ</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">نوع القيد</label>
              <select value={form.type} onChange={e => set("type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">المبلغ (ريال) *</label>
              <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الوصف *</label>
            <input value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الحساب المدين</label>
              <select value={form.debit_account} onChange={e => set("debit_account", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option value="">اختر حساب...</option>
                {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الحساب الدائن</label>
              <select value={form.credit_account} onChange={e => set("credit_account", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option value="">اختر حساب...</option>
                {ACCOUNTS.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">موظف مرتبط</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              <option value="">بدون موظف</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">المرجع / رقم الفاتورة</label>
              <input value={form.reference} onChange={e => set("reference", e.target.value)} dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">الحالة</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option>مسودة</option><option>معتمد</option><option>ملغى</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ملاحظات</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.description || !form.amount}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Accounting() {
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("entries");

  const load = async () => {
    const [es, emps] = await Promise.all([
      base44.entities.AccountingEntry.list("-date"),
      base44.entities.Employee.filter({ status: "نشط" }),
    ]);
    setEntries(es); setEmployees(emps); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const deleteEntry = async (id) => {
    if (confirm("حذف هذا القيد؟")) { await base44.entities.AccountingEntry.delete(id); load(); }
  };

  const approve = async (id) => {
    await base44.entities.AccountingEntry.update(id, { status: "معتمد" });
    load();
  };

  const filtered = entries
    .filter(e => !filterType || e.type === filterType)
    .filter(e => !search || e.description?.includes(search) || e.employee_name?.includes(search));

  const totalRevenue = entries.filter(e => e.type === "إيراد" && e.status === "معتمد").reduce((s, e) => s + (e.amount || 0), 0);
  const totalExpense = entries.filter(e => ["مصروف", "راتب"].includes(e.type) && e.status === "معتمد").reduce((s, e) => s + (e.amount || 0), 0);
  const totalSalaries = entries.filter(e => e.type === "راتب" && e.status === "معتمد").reduce((s, e) => s + (e.amount || 0), 0);
  const totalCustody = entries.filter(e => e.type === "عهدة موظف" && e.status !== "ملغى").reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الحسابات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">القيود المحاسبية — الرواتب — العهد — المصروفات</p>
        </div>
        <button onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" />قيد جديد
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإيرادات", value: formatCurrency(totalRevenue), color: "text-green-600", icon: TrendingUp },
          { label: "إجمالي المصروفات", value: formatCurrency(totalExpense), color: "text-red-600", icon: TrendingDown },
          { label: "إجمالي الرواتب", value: formatCurrency(totalSalaries), color: "text-blue-600", icon: DollarSign },
          { label: "عهد الموظفين", value: formatCurrency(totalCustody), color: "text-purple-600", icon: FileText },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[{ id: "entries", label: "القيود" }, { id: "custody", label: "العهد" }, { id: "salaries", label: "الرواتب" }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
          <option value="">كل الأنواع</option>
          {ENTRY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["رقم القيد", "التاريخ", "النوع", "الوصف", "المدين", "الدائن", "المبلغ", "الموظف", "الحالة", "إجراءات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              ) : filtered.filter(e => {
                if (activeTab === "custody") return ["عهدة موظف", "تصفية عهدة"].includes(e.type);
                if (activeTab === "salaries") return e.type === "راتب";
                return true;
              }).length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">لا توجد قيود</td></tr>
              ) : filtered.filter(e => {
                if (activeTab === "custody") return ["عهدة موظف", "تصفية عهدة"].includes(e.type);
                if (activeTab === "salaries") return e.type === "راتب";
                return true;
              }).map(e => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{e.entry_number || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{e.date ? new Date(e.date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${TYPE_COLORS[e.type]}`}>{e.type}</span>
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-40 truncate">{e.description}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.debit_account || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.credit_account || "—"}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.employee_name || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {e.status === "مسودة" && (
                        <button onClick={() => approve(e.id)} title="اعتماد"
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded"><CheckCircle className="w-4 h-4" /></button>
                      )}
                      <button onClick={() => { setEditEntry(e); setShowForm(true); }}
                        className="text-xs px-2 py-1 border border-border rounded hover:bg-muted text-foreground">تعديل</button>
                      <button onClick={() => deleteEntry(e.id)}
                        className="text-xs px-2 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && <EntryForm entry={editEntry} employees={employees} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}