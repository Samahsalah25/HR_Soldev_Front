import { useState } from "react";
import { X, Save, DollarSign, Upload, CheckCircle } from "lucide-react";
import { createAllowanceRequest, createExpenseRequest } from "@/api/requestsApi";
import { base44 } from "@/api/base44Client";

// allowance_type options
const ALLOWANCE_TYPE_MAP = {
  "بدل سكن": "housing",
  "بدل مواصلات": "transportation",
  "بدل طعام": "food",
  "بدل اتصالات": "communication",
  "بدل خاص": "special",
  "مكافأة": "reward",
};

// expense_type — free text from backend (stationary, travel, etc.)
const EXPENSE_TYPES = [
  "stationary",
  "travel",
  "hospitality",
  "maintenance",
  "rent",
  "utilities",
  "other",
];

const EXPENSE_TYPE_LABELS = {
  stationary: "مستلزمات مكتبية",
  travel: "سفر وتنقل",
  hospitality: "ضيافة",
  maintenance: "صيانة",
  rent: "إيجار",
  utilities: "فواتير",
  other: "أخرى",
};

export default function ExpenseModal({ requestType, employees, onSave, onClose }) {
  const isExpense = requestType === "رفع مصروف/فاتورة";

  const [form, setForm] = useState({
    employee_id: "",
    // allowance fields
    allowance_type: "housing",
    // expense fields
    expense_type: "stationary",
    amount: "",
    receipt_number: "",
    receipt_date: "",
    description: "",
    attachment: null,
  });
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachmentUrl(file_url);
      set("attachment", file_url);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isExpense) {
        // form-data
        const fd = new FormData();
        fd.append("employee_id", form.employee_id);
        fd.append("expense_type", form.expense_type);
        fd.append("amount", form.amount);
        fd.append("receipt_number", form.receipt_number);
        fd.append("receipt_date", form.receipt_date);
        fd.append("description", form.description);
        if (attachmentUrl) fd.append("attachment", attachmentUrl);
        await createExpenseRequest(fd);
      } else {
        await createAllowanceRequest({
          employee_id: form.employee_id,
          allowance_type: form.allowance_type,
          amount: Number(form.amount),
          description: form.description,
        });
      }
      onSave();
    } catch (err) {
      console.error(err?.response?.data || err);
      alert("حصل خطأ أثناء إرسال الطلب");
    } finally {
      setSaving(false);
    }
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

          {/* الموظف */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الموظف *</label>
            <select value={form.employee_id} onChange={e => set("employee_id", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name_ar || e.name || e.full_name_ar} — {e.department_name || e.department || ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* النوع */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{isExpense ? "نوع المصروف" : "نوع البدل"} *</label>
              {isExpense ? (
                <select value={form.expense_type} onChange={e => set("expense_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  {EXPENSE_TYPES.map(t => (
                    <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t]}</option>
                  ))}
                </select>
              ) : (
                <select value={form.allowance_type} onChange={e => set("allowance_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  {Object.entries(ALLOWANCE_TYPE_MAP).map(([label, val]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* المبلغ */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المبلغ (ريال) *</label>
              <input type="number" min={0} value={form.amount} onChange={e => set("amount", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>

          {/* حقول المصروف فقط */}
          {isExpense && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">رقم الإيصال</label>
                <input value={form.receipt_number} onChange={e => set("receipt_number", e.target.value)} dir="ltr"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">تاريخ الإيصال</label>
                <input type="date" value={form.receipt_date} onChange={e => set("receipt_date", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
            </div>
          )}

          {/* الوصف */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الوصف *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>

          {/* رفع مستند - للمصروف فقط */}
          {isExpense && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المرفق</label>
              {attachmentUrl ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 flex-1">تم رفع المستند</span>
                  <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
                  <button onClick={() => { setAttachmentUrl(""); set("attachment", null); }} className="text-xs text-red-500">إزالة</button>
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
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.amount || !form.description}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}
