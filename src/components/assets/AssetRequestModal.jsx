import { useState } from "react";
import { X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function AssetRequestModal({ assets, employees, onClose, onSave }) {
  const [form, setForm] = useState({ asset_id: "", employee_id: "", reason: "", request_type: "طلب أصل" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedAsset = assets.find(a => a.id === form.asset_id);
  const selectedEmployee = employees.find(e => e.id === form.employee_id);

  // Assets assigned to employees for return requests
  const [showReturn, setShowReturn] = useState(false);
  const assignedAssets = []; // Will be fetched via parent if needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await base44.entities.AssetRequest.create({
      asset_id: form.asset_id,
      asset_name: selectedAsset?.asset_name || "",
      asset_category: selectedAsset?.category || "",
      employee_id: form.employee_id,
      employee_name: selectedEmployee?.full_name_ar || "",
      department: selectedEmployee?.department || "",
      request_type: form.request_type,
      reason: form.reason,
      status: "قيد المراجعة",
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">طلب أصل</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">نوع الطلب</label>
            <select value={form.request_type} onChange={e => set("request_type", e.target.value)}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option>طلب أصل</option>
              <option>إعادة أصل</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">الموظف *</label>
            <select value={form.employee_id} onChange={e => set("employee_id", e.target.value)} required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar} — {e.department}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">
              {form.request_type === "طلب أصل" ? "الأصل المطلوب (متاح فقط) *" : "الأصل المراد إعادته *"}
            </label>
            <select value={form.asset_id} onChange={e => set("asset_id", e.target.value)} required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الأصل...</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.asset_name} — {a.category} {a.serial_number ? `(${a.serial_number})` : ""}</option>
              ))}
            </select>
            {assets.length === 0 && <p className="text-xs text-amber-600 mt-1">لا توجد أصول متاحة حالياً</p>}
          </div>
          <div>
            <label className="text-sm font-medium">السبب</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={2}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
            <button type="submit" disabled={saving || assets.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}