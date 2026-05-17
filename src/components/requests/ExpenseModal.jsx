import { useState } from "react";
import { X, Save, DollarSign, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

const ALLOWANCE_TYPES = ["بدل سكن", "بدل نقل", "بدل غذاء", "بدل اتصالات", "بدل خاص", "مكافأة"];
const EXPENSE_CATEGORIES = ["مستلزمات مكتبية", "سفر وتنقل", "ضيافة", "صيانة", "إيجار", "فواتير", "أخرى"];

export default function ExpenseModal({ requestType, employees, onSave, onClose }) {
  const isExpense = requestType === "رفع مصروف/فاتورة";
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    amount: 0, category: isExpense ? EXPENSE_CATEGORIES[0] : ALLOWANCE_TYPES[0],
    invoice_number: "", invoice_date: "", description: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { set("employee_id", id); set("employee_name", emp.full_name_ar); set("department", emp.department || ""); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAttachmentUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const details = isExpense
      ? `نوع المصروف: ${form.category} | المبلغ: ${form.amount} ر.س | ${form.description}${form.invoice_number ? ` | رقم الفاتورة: ${form.invoice_number}` : ""}`
      : `نوع البدل: ${form.category} | المبلغ: ${form.amount} ر.س | ${form.description}`;
    await base44.entities.EmployeeRequest.create({
      employee_id: form.employee_id,
      employee_name: form.employee_name,
      department: form.department,
      request_type: requestType,
      details,
      amount: form.amount,
      attachment_url: attachmentUrl,
      status: "قيد المراجعة",
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <DollarSign className={`w-5 h-5 ${isExpense ? "text-indigo-600" : "text-green-600"}`} />
            <h3 className="font-bold text-foreground">{requestType}</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الموظف *</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{isExpense ? "فئة المصروف" : "نوع البدل"}</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                {(isExpense ? EXPENSE_CATEGORIES : ALLOWANCE_TYPES).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">المبلغ (ريال) *</label>
              <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          </div>
          {isExpense && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">رقم الفاتورة</label>
                <input value={form.invoice_number} onChange={e => set("invoice_number", e.target.value)} dir="ltr"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">تاريخ الفاتورة</label>
                <input type="date" value={form.invoice_date} onChange={e => set("invoice_date", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الوصف *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
          {isExpense && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">رفع الفاتورة / المستند</label>
              {attachmentUrl ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-xs text-green-700 flex-1">✅ تم رفع المستند</span>
                  <button onClick={() => setAttachmentUrl("")} className="text-xs text-red-500">إزالة</button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{uploading ? "جاري الرفع..." : "رفع فاتورة / صورة"}</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.amount || !form.description}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}