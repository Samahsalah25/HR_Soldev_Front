import { useState } from "react";
import { X, Save, Briefcase } from "lucide-react";
import { base44 } from "@/api/base44Client";

const CUSTODY_ITEMS = ["لابتوب", "جوال", "سيارة", "بطاقة دفع", "أجهزة", "مفاتيح", "أخرى"];

export default function CustodyRequestModal({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    item_name: "", item_category: CUSTODY_ITEMS[0], estimated_value: 0,
    reason: "", expected_return_date: "", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    if (emp) { set("employee_id", id); set("employee_name", emp.full_name_ar); set("department", emp.department || ""); }
  };

  const handleSave = async () => {
    setSaving(true);
    const details = `العهدة: ${form.item_name} (${form.item_category}) | القيمة التقديرية: ${form.estimated_value} ر.س | السبب: ${form.reason}${form.expected_return_date ? ` | تاريخ الإعادة: ${form.expected_return_date}` : ""}`;
    const req = await base44.entities.EmployeeRequest.create({
      employee_id: form.employee_id,
      employee_name: form.employee_name,
      department: form.department,
      request_type: "طلب عهدة",
      details,
      amount: form.estimated_value,
      status: "قيد المراجعة",
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-foreground">طلب عهدة جديدة</h3>
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
              <label className="text-sm font-medium text-foreground">نوع العهدة</label>
              <select value={form.item_category} onChange={e => { set("item_category", e.target.value); set("item_name", e.target.value !== "أخرى" ? e.target.value : ""); }}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
                {CUSTODY_ITEMS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">اسم/وصف العهدة *</label>
              <input value={form.item_name} onChange={e => set("item_name", e.target.value)} placeholder="مثال: لابتوب Dell XPS"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">القيمة التقديرية (ريال)</label>
              <input type="number" min={0} value={form.estimated_value} onChange={e => set("estimated_value", +e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">تاريخ الإعادة المتوقع</label>
              <input type="date" value={form.expected_return_date} onChange={e => set("expected_return_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">سبب الطلب *</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.item_name || !form.reason}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}