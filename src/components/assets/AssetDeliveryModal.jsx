import { useState } from "react";
import { X, Save } from "lucide-react";

export default function AssetDeliveryModal({ request, employees = [], onClose, onSave }) {
  const [form, setForm] = useState({
    delivered_by: "",
    delivery_date: new Date().toISOString().slice(0, 10),
    condition_at_delivery: "جيد",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">تسجيل تسليم الأصل</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-4 pb-2">
          <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
            <p><span className="font-medium">الأصل:</span> {request.asset_name}</p>
            <p><span className="font-medium">الموظف:</span> {request.employee_name}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          <div>
            <label className="text-sm font-medium">سُلِّم بواسطة *</label>
            <select value={form.delivered_by} onChange={e => set("delivered_by", e.target.value)} required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">اختر الموظف المُسلِّم...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.full_name_ar}>{emp.full_name_ar} — {emp.job_title || emp.department}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">تاريخ التسليم *</label>
            <input type="date" value={form.delivery_date} onChange={e => set("delivery_date", e.target.value)} required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium">حالة الأصل عند التسليم</label>
            <select value={form.condition_at_delivery} onChange={e => set("condition_at_delivery", e.target.value)}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option>جديد</option><option>جيد</option><option>تالف</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "تأكيد التسليم"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}