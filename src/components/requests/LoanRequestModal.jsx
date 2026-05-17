import { useState, useEffect } from "react";
import { X, Save, CreditCard, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function LoanRequestModal({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    loan_type_id: "", loan_type_name: "",
    amount: 0, reason: "", installments: 3, notes: ""
  });
  const [loanTypes, setLoanTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    base44.entities.LoanType.filter({ is_active: true }).then(setLoanTypes);
  }, []);

  const handleTypeSelect = (id) => {
    const t = loanTypes.find(lt => lt.id === id);
    setSelectedType(t || null);
    set("loan_type_id", id);
    set("loan_type_name", t?.name || "");
    if (t) set("installments", Math.min(form.installments, t.max_installments));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url); setUploading(false);
  };

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    setSelectedEmp(emp || null);
    if (emp) { set("employee_id", id); set("employee_name", emp.full_name_ar); set("department", emp.department || ""); }
  };

  const monthlyDeduction = form.amount > 0 && form.installments > 0 ? Math.ceil(form.amount / form.installments) : 0;
  const maxLoan = selectedEmp ? (selectedEmp.basic_salary || 0) * 3 : 0;

  const handleSave = async () => {
    setSaving(true);
    const details = `مبلغ السلفة: ${form.amount} ر.س | السبب: ${form.reason} | عدد الأقساط: ${form.installments} | الخصم الشهري: ${monthlyDeduction} ر.س`;
    // إنشاء الطلب في EmployeeRequest للتوافق مع النظام القديم
    await base44.entities.EmployeeRequest.create({
      employee_id: form.employee_id,
      employee_name: form.employee_name,
      department: form.department,
      request_type: "طلب سلفة",
      details,
      amount: form.amount,
      installments: form.installments,
      attachment_url: fileUrl,
      status: "قيد المراجعة",
    });
    // إنشاء LoanApplication مباشرة في نظام السلف
    await base44.entities.LoanApplication.create({
      employee_id: form.employee_id,
      employee_name: form.employee_name,
      department: form.department,
      basic_salary: selectedEmp?.basic_salary || 0,
      loan_type_id: form.loan_type_id,
      loan_type_name: form.loan_type_name,
      amount: form.amount,
      installments: form.installments,
      monthly_deduction: monthlyDeduction,
      reason: form.reason,
      attachment_url: fileUrl,
      status: "قيد المراجعة",
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-foreground">طلب سلفة</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الموظف *</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select>
          </div>

          {selectedEmp && (
            <div className="bg-slate-50 border border-border rounded-lg px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الراتب الأساسي</span>
              <span className="font-semibold text-foreground">{selectedEmp.basic_salary?.toLocaleString("ar-SA")} ر.س</span>
            </div>
          )}

          {/* Loan Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">نوع السلفة *</label>
            {loanTypes.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">لا توجد أنواع سلف متاحة حالياً</p>
            ) : (
              <select value={form.loan_type_id} onChange={e => handleTypeSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                <option value="">اختر نوع السلفة...</option>
                {loanTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            )}
          </div>

          {selectedType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
              الحد الأقصى: {Math.min(selectedType.max_amount, (selectedEmp?.basic_salary || 0) * selectedType.salary_ratio).toLocaleString("ar-SA")} ر.س | حتى {selectedType.max_installments} قسط
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">المبلغ المطلوب (ريال) *</label>
              <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
              {maxLoan > 0 && <p className="text-xs text-muted-foreground">الحد الأقصى المقترح: {maxLoan.toLocaleString("ar-SA")} ر.س</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">عدد الأقساط</label>
              <select value={form.installments} onChange={e => set("installments", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                {[1,2,3,4,5,6,9,12].map(n => <option key={n} value={n}>{n} {n === 1 ? "قسط" : "أقساط"}</option>)}
              </select>
            </div>
          </div>

          {monthlyDeduction > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 text-center">
              <p className="text-sm text-teal-700">الخصم الشهري المقدّر: <span className="font-bold text-lg">{monthlyDeduction.toLocaleString("ar-SA")} ر.س</span></p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">سبب السلفة *</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">مرفق داعم (اختياري)</label>
            {fileUrl ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-xs text-green-700 flex-1">✅ تم رفع الملف</span>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
                <button onClick={() => setFileUrl("")} className="text-xs text-red-500">إزالة</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "جاري الرفع..." : "تقرير طبي أو مستند داعم"}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.amount || !form.reason}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}