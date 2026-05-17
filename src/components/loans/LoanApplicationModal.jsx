import { useState, useEffect } from "react";
import { X, Save, CreditCard, Upload, AlertTriangle, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { calcServiceYears } from "@/lib/hrUtils";

export default function LoanApplicationModal({ employees, onSave, onClose }) {
  const [loanTypes, setLoanTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    loan_type_id: "", loan_type_name: "",
    amount: 0, installments: 3, reason: "",
  });
  const [fileUrl, setFileUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    base44.entities.LoanType.filter({ is_active: true }).then(setLoanTypes);
  }, []);

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    setSelectedEmp(emp || null);
    if (emp) {
      set("employee_id", id);
      set("employee_name", emp.full_name_ar);
      set("department", emp.department || "");
    }
  };

  const handleTypeSelect = (id) => {
    const t = loanTypes.find(lt => lt.id === id);
    setSelectedType(t || null);
    set("loan_type_id", id);
    set("loan_type_name", t?.name || "");
    if (t) {
      set("installments", Math.min(3, t.max_installments));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFileUrl(file_url); setUploading(false);
  };

  const monthlyDeduction = form.amount > 0 && form.installments > 0
    ? Math.ceil(form.amount / form.installments) : 0;

  // التحقق من السياسة
  const validate = () => {
    const errors = [];
    if (!selectedEmp || !selectedType) return errors;

    const maxByRatio = (selectedEmp.basic_salary || 0) * selectedType.salary_ratio;
    const maxAmount = Math.min(selectedType.max_amount, maxByRatio);

    if (form.amount > maxAmount) {
      errors.push(`المبلغ يتجاوز الحد الأقصى (${maxAmount.toLocaleString("ar-SA")} ر.س)`);
    }
    if (form.installments > selectedType.max_installments) {
      errors.push(`الأقساط تتجاوز الحد الأقصى (${selectedType.max_installments} قسط)`);
    }
    if (selectedEmp.join_date) {
      const serviceMonths = calcServiceYears(selectedEmp.join_date) * 12;
      if (serviceMonths < selectedType.min_service_months) {
        errors.push(`يشترط مدة خدمة لا تقل عن ${selectedType.min_service_months} شهر (لديك ${Math.floor(serviceMonths)} شهر)`);
      }
    }
    return errors;
  };

  const errors = validate();

  const handleSave = async () => {
    if (errors.length > 0 || !form.employee_id || !form.amount || !form.reason) return;
    setSaving(true);
    const user = await base44.auth.me();
    await base44.entities.LoanApplication.create({
      ...form,
      basic_salary: selectedEmp?.basic_salary || 0,
      monthly_deduction: monthlyDeduction,
      attachment_url: fileUrl,
      status: "قيد المراجعة",
    });
    // Audit
    await base44.entities.LoanAuditLog.create({
      employee_name: form.employee_name,
      action: "إنشاء",
      performed_by: user.full_name || user.email,
      performed_by_role: user.role,
      new_value: `${form.loan_type_name} | ${form.amount} ر.س | ${form.installments} قسط`,
      notes: form.reason,
    });
    onSave();
  };

  const maxAmount = selectedEmp && selectedType
    ? Math.min(selectedType.max_amount, (selectedEmp.basic_salary || 0) * selectedType.salary_ratio)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-foreground">طلب سلفة — نظام متكامل</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Employee */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الموظف *</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
            </select>
          </div>

          {selectedEmp && (
            <div className="bg-slate-50 border border-border rounded-lg px-4 py-3 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">الراتب الأساسي: </span><span className="font-semibold">{selectedEmp.basic_salary?.toLocaleString("ar-SA")} ر.س</span></div>
              {selectedEmp.join_date && <div><span className="text-muted-foreground">مدة الخدمة: </span><span className="font-semibold">{Math.floor(calcServiceYears(selectedEmp.join_date) * 12)} شهر</span></div>}
            </div>
          )}

          {/* Loan Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">نوع السلفة *</label>
            {loanTypes.length === 0 ? (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                لا توجد أنواع سلف — يرجى مراجعة Admin لإضافة أنواع
              </p>
            ) : (
              <select value={form.loan_type_id} onChange={e => handleTypeSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر نوع السلفة...</option>
                {loanTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
              </select>
            )}
          </div>

          {selectedType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-800 space-y-1">
              <p className="font-semibold">سياسة {selectedType.name}:</p>
              <p>• الحد الأقصى: {maxAmount.toLocaleString("ar-SA")} ر.س ({selectedType.salary_ratio}× الراتب، أو {selectedType.max_amount?.toLocaleString("ar-SA")} ر.س)</p>
              <p>• الأقساط: حتى {selectedType.max_installments} قسط | الخدمة: ≥{selectedType.min_service_months} شهر</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {selectedType.requires_manager_approval && <span className="bg-white border border-blue-200 px-2 py-0.5 rounded-full">✓ موافقة مدير</span>}
                {selectedType.requires_hr_approval && <span className="bg-white border border-blue-200 px-2 py-0.5 rounded-full">✓ موافقة HR</span>}
                {selectedType.requires_finance_approval && <span className="bg-white border border-blue-200 px-2 py-0.5 rounded-full">✓ موافقة مالية (&gt;{selectedType.finance_approval_threshold?.toLocaleString("ar-SA")})</span>}
              </div>
            </div>
          )}

          {/* Amount & Installments */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">المبلغ المطلوب *</label>
              <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              {maxAmount > 0 && <p className="text-xs text-muted-foreground">الحد الأقصى: {maxAmount.toLocaleString("ar-SA")} ر.س</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">عدد الأقساط *</label>
              <select value={form.installments} onChange={e => set("installments", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {[1, 2, 3, 4, 5, 6, 9, 12, 18, 24].filter(n => !selectedType || n <= selectedType.max_installments).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? "قسط" : "أقساط"}</option>
                ))}
              </select>
            </div>
          </div>

          {monthlyDeduction > 0 && (
            <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 text-center">
              <p className="text-sm text-teal-700">القسط الشهري: <span className="font-bold text-xl">{monthlyDeduction.toLocaleString("ar-SA")} ر.س</span></p>
              <p className="text-xs text-teal-600 mt-0.5">يُخصم تلقائياً من الراتب الشهري بعد الصرف</p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">سبب السلفة *</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>

          {/* Attachment */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">مرفق داعم (اختياري)</label>
            {fileUrl ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-700 flex-1">تم رفع الملف</span>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
                <button onClick={() => setFileUrl("")} className="text-xs text-red-500">إزالة</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{uploading ? "جاري الرفع..." : "مستند داعم أو تقرير طبي"}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">{e}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave}
            disabled={saving || !form.employee_id || !form.amount || !form.reason || errors.length > 0}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}