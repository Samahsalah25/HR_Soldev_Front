import { useState, useEffect } from "react";
import { Scale, FileText, Plus, X, Save, AlertTriangle, CheckCircle, Clock, Building, Upload, Search, Gavel } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import { canDo } from "../lib/crudPermissions";
import {
  getCases,
  createCase,
  deleteCase,
  updateCase,
} from "../API/casesApi";
const CASE_STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  postponed: "bg-gray-100 text-gray-600",
  won: "bg-green-100 text-green-700",
  lost: "bg-red-100 text-red-600",
  settled: "bg-purple-100 text-purple-700",
};
const CASE_STATUS_LABELS = {
  new: "جديدة",
  in_progress: "قيد النظر",
  postponed: "مؤجلة",
  won: "مغلقة لصالحنا",
  lost: "مغلقة ضدنا",
  settled: "تسوية ودية",
};

const CONTRACT_STATUS_COLORS = {
  "مسودة": "bg-gray-100 text-gray-600",
  "نشط": "bg-green-100 text-green-700",
  "منتهي": "bg-red-100 text-red-600",
  "ملغى": "bg-red-100 text-red-600",
  "قيد التجديد": "bg-amber-100 text-amber-700",
};

function CaseForm({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    case_number: `QD-${Date.now().toString().slice(-5)}`, title: "",
   case_type: "employee_dispute", party: "", court: "", filing_date: new Date().toISOString().slice(0, 10),
    hearing_date: "", lawyer: "", estimated_value: 0, status: "جديدة",
    description: "", employee_id: "", employee_name: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { set("employee_id", id); set("employee_name", emp.full_name_ar); }
  };
const handleSave = async () => {
  try {
    setSaving(true);

    const payload = {
      case_number: form.case_number,
      case_type: form.case_type,
      case_title: form.title,
      other_party: form.party,
      court_agency: form.court,
      submission_date: form.filing_date,
      next_session_date: form.hearing_date,
      lawyer: form.lawyer,
      estimated_value: Number(form.estimated_value),
      employee_id: form.employee_id || null,
      case_description: form.description,
    };

    await createCase(payload);

    onSave();
  } catch (error) {
    console.error("Create Case Error:", error);
  } finally {
    setSaving(false);
  }
};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Gavel className="w-5 h-5 text-red-600" />قضية جديدة</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">رقم القضية</label>
              <input value={form.case_number} onChange={e => set("case_number", e.target.value)} dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">نوع القضية</label>
             <select
  value={form.case_type}
  onChange={e => set("case_type", e.target.value)}
  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
>
  <option value="employee_dispute">نزاع عمالي</option>
  <option value="commercial_case">قضية تجارية</option>
  <option value="employee_contract">عقد موظف</option>
  <option value="compensation">تعويض</option>
  <option value="confidential_disclosure">إفصاح سري</option>
  <option value="other">أخرى</option>
</select>
              </div>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium">عنوان القضية *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">الطرف الآخر</label>
              <input value={form.party} onChange={e => set("party", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">المحكمة / الجهة</label>
              <input value={form.court} onChange={e => set("court", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ التقديم</label>
              <input type="date" value={form.filing_date} onChange={e => set("filing_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ الجلسة القادمة</label>
              <input type="date" value={form.hearing_date} onChange={e => set("hearing_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">المحامي</label>
              <input value={form.lawyer} onChange={e => set("lawyer", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">القيمة التقديرية (ريال)</label>
              <input type="number" min={0} value={form.estimated_value} onChange={e => set("estimated_value", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium">موظف مرتبط</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">بدون موظف</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select></div>
          <div className="space-y-1.5"><label className="text-sm font-medium">تفاصيل القضية</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" /></div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ContractForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    contract_number: `CT-${Date.now().toString().slice(-5)}`, title: "",
    contract_type: "عقد توظيف", party_name: "", start_date: "",
    end_date: "", value: 0, status: "مسودة", reminder_days: 30, notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url); setUploading(false);
  };

const handleSave = async () => {
  try {
    setSaving(true);

    await createCase({
      case_number: form.case_number,
      case_type: form.case_type,
      case_title: form.title,
      other_party: form.party,
      court_agency: form.court,
      submission_date: form.filing_date,
      next_session_date: form.hearing_date,
      lawyer: form.lawyer,
      estimated_value: form.estimated_value,
      employee_id: form.employee_id || null,
      case_description: form.description,
    });

    onSave();
  } catch (error) {
    console.error(error);
  } finally {
    setSaving(false);
  }
};

  const daysToExpiry = form.end_date ? Math.ceil((new Date(form.end_date) - new Date()) / 86400000) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" />عقد جديد</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">رقم العقد</label>
              <input value={form.contract_number} onChange={e => set("contract_number", e.target.value)} dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">نوع العقد</label>
              <select value={form.contract_type} onChange={e => set("contract_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {["عقد توظيف","عقد استشارة","عقد مورد","عقد إيجار","اتفاقية سرية","شراكة","أخرى"].map(t => <option key={t}>{t}</option>)}
              </select></div>
          </div>
          <div className="space-y-1.5"><label className="text-sm font-medium">عنوان العقد *</label>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          <div className="space-y-1.5"><label className="text-sm font-medium">الطرف الآخر</label>
            <input value={form.party_name} onChange={e => set("party_name", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ البدء</label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ الانتهاء</label>
              <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              {daysToExpiry !== null && daysToExpiry < 60 && (
                <p className={`text-xs mt-1 ${daysToExpiry < 0 ? "text-red-600" : "text-amber-600"}`}>
                  {daysToExpiry < 0 ? `منتهي منذ ${Math.abs(daysToExpiry)} يوم` : `ينتهي خلال ${daysToExpiry} يوم`}
                </p>
              )}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className="text-sm font-medium">قيمة العقد (ريال)</label>
              <input type="number" min={0} value={form.value} onChange={e => set("value", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium">تذكير قبل (يوم)</label>
              <input type="number" min={0} value={form.reminder_days} onChange={e => set("reminder_days", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" /></div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">رفع ملف العقد (PDF)</label>
            {fileUrl ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-xs text-green-700 flex-1">✅ تم رفع الملف</span>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
                <button onClick={() => setFileUrl("")} className="text-xs text-red-500">إزالة</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "جاري الرفع..." : "اختر ملف PDF"}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.title}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Legal() {
  const { user } = useRole();
  const canCreate = canDo(user, "legal", "create");
  const canDelete = canDo(user, "legal", "delete");
  const [cases, setCases] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("cases");
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [showContractForm, setShowContractForm] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
  const [casesResponse, cts, emps] = await Promise.all([
  getCases(),
  base44.entities.LegalContract.list("-created_date"),
  base44.entities.Employee.list(),
]);

setCases(casesResponse.data || []);
setContracts(cts);
setEmployees(emps);
setLoading(false);
    setCases(cs); setContracts(cts); setEmployees(emps); setLoading(false);
  };

  useEffect(() => { load(); }, []);

const deleteCase = async (id) => {
  if (confirm("حذف القضية؟")) {
    await deleteCase(id);
    load();
  }
};
  const deleteContract = async (id) => { if (confirm("حذف العقد؟")) { await base44.entities.LegalContract.delete(id); load(); } };

const filteredCases = cases.filter(
  c =>
    !search ||
    c.case_title?.includes(search) ||
    c.other_party?.includes(search) ||
    c.case_number?.includes(search)
);
  const filteredContracts = contracts.filter(c => !search || c.title?.includes(search) || c.party_name?.includes(search));

  const activeCases = cases.filter(c => !["مغلقة - لصالحنا","مغلقة - ضدنا","تسوية ودية"].includes(c.state));
  const expiringContracts = contracts.filter(c => {
    if (!c.end_date || c.status !== "نشط") return false;
    const days = Math.ceil((new Date(c.end_date) - new Date()) / 86400000);
    return days <= 30 && days >= 0;
  });
  const totalCaseValue = cases.reduce((s, c) => s + (c.estimated_value || 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Scale className="w-6 h-6 text-primary" />الشؤون القانونية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة القضايا والعقود القانونية</p>
        </div>
        {canCreate && (
          <div className="flex gap-2">
            <button onClick={() => setShowContractForm(true)} className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg text-sm hover:bg-muted">
              <FileText className="w-4 h-4" />عقد جديد
            </button>
            <button onClick={() => setShowCaseForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              <Plus className="w-4 h-4" />قضية جديدة
            </button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "قضايا نشطة", value: activeCases.length, color: "text-red-600" },
          { label: "عقود نشطة", value: contracts.filter(c => c.status === "نشط").length, color: "text-green-600" },
          { label: "عقود تنتهي قريباً", value: expiringContracts.length, color: "text-amber-600" },
          { label: "إجمالي قيمة القضايا", value: `${(totalCaseValue/1000).toFixed(0)}K ر.س`, color: "text-purple-600" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card rounded-xl border border-border p-4">
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {expiringContracts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />عقود تنتهي خلال 30 يوم:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {expiringContracts.map(c => (
              <span key={c.id} className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {c.title} — {new Date(c.end_date).toLocaleDateString("ar-SA")}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[{ id: "cases", label: `القضايا (${cases.length})` }, { id: "contracts", label: `العقود (${contracts.length})` }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
          className="w-full max-w-sm pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
      </div>

      {activeTab === "cases" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["رقم القضية","النوع","العنوان","الطرف الآخر","المحكمة","الجلسة القادمة","القيمة","المحامي","الحالة",...(canDelete?["حذف"]:[]  )].map(h => (
                  <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
                : filteredCases.length === 0 ? <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">لا توجد قضايا</td></tr>
                : filteredCases.map(c => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{c.case_number}</td>
                    <td className="px-3 py-3"><span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{c.case_type_arabic}</span></td>
                    <td className="px-3 py-3 font-medium text-foreground max-w-40 truncate">{c.case_title}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">{c.other_party || "—"}</td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">{c.court_agency || "—"}</td>
                    <td className="px-3 py-3 text-xs">
  {c.next_session_date
    ? new Date(c.next_session_date).toLocaleDateString("ar-SA")
    : "—"}
</td>
                    <td className="px-3 py-3 text-xs font-semibold text-purple-600">{c.estimated_value > 0 ? `${c.estimated_value?.toLocaleString("ar-SA")} ر.س` : "—"}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{c.lawyer || "—"}</td>
               <td className="px-3 py-3">
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      CASE_STATUS_COLORS[c.state]
    }`}
  >
    {CASE_STATUS_LABELS[c.state] || c.state}
  </span>
</td>
                    {canDelete && <td className="px-3 py-3"><button onClick={() => deleteCase(c.id)} className="text-xs text-red-500 hover:underline">حذف</button></td>}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["رقم العقد","النوع","العنوان","الطرف","البدء","الانتهاء","القيمة","الحالة","الملف",...(canDelete?["حذف"]:[])].map(h => (
                  <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredContracts.length === 0 ? <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">لا توجد عقود</td></tr>
                : filteredContracts.map(c => {
                  const daysLeft = c.end_date ? Math.ceil((new Date(c.end_date) - new Date()) / 86400000) : null;
                  return (
                    <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 ? "bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{c.contract_number}</td>
                      <td className="px-3 py-3"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{c.contract_type}</span></td>
                      <td className="px-3 py-3 font-medium text-foreground max-w-40 truncate">{c.title}</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{c.party_name || "—"}</td>
                      <td className="px-3 py-3 text-xs">{c.start_date ? new Date(c.start_date).toLocaleDateString("ar-SA") : "—"}</td>
                      <td className="px-3 py-3 text-xs">
                        {c.end_date ? new Date(c.end_date).toLocaleDateString("ar-SA") : "—"}
                        {daysLeft !== null && daysLeft <= 30 && daysLeft >= 0 && <span className="text-amber-600 text-xs block">({daysLeft} يوم)</span>}
                      </td>
                      <td className="px-3 py-3 text-xs font-semibold text-green-600">{c.value > 0 ? `${c.value?.toLocaleString("ar-SA")} ر.س` : "—"}</td>
                      <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[c.status]}`}>{c.status}</span></td>
                      <td className="px-3 py-3">{c.file_url ? <a href={c.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a> : "—"}</td>
                      {canDelete && <td className="px-3 py-3"><button onClick={() => deleteContract(c.id)} className="text-xs text-red-500 hover:underline">حذف</button></td>}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {showCaseForm && <CaseForm employees={employees} onSave={() => { setShowCaseForm(false); load(); }} onClose={() => setShowCaseForm(false)} />}
      {showContractForm && <ContractForm onSave={() => { setShowContractForm(false); load(); }} onClose={() => setShowContractForm(false)} />}
    </div>
  );
}