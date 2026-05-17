import { useState } from "react";
import { X, Save } from "lucide-react";

export default function AssetReturnModal({ request, assets, employees = [], onClose, onSave }) {
  const asset = assets.find(a => a.id === request.asset_id);
  const [form, setForm] = useState({
    received_by: "",
    return_date: new Date().toISOString().slice(0, 10),
    condition_at_return: "جيد",
    notes: "",
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
          <h2 className="text-lg font-bold">تسجيل استلام الأصل</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="px-6 pt-4 pb-2">
          <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
            <p><span className="font-medium">الأصل:</span> {request.asset_name}</p>
            <p><span className="font-medium">الموظف:</span> {request.employee_name}</p>
            {asset?.assigned_date && <p><span className="font-medium">تاريخ التخصيص:</span> {new Date(asset.assigned_date).toLocaleDateString("ar-SA")}</p>}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 pt-3 space-y-4">
          <div>
            <label className="text-sm font-medium">استُلم بواسطة *</label>
            <select value={form.received_by} onChange={e => set("received_by", e.target.value)} required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">اختر الموظف المُستلِم...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.full_name_ar}>{emp.full_name_ar} — {emp.job_title || emp.department}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">تاريخ الإعادة *</label>
            <input type="date" value={form.return_date} onChange={e => set("return_date", e.target.value)} required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium">حالة الأصل عند الإعادة</label>
            <select value={form.condition_at_return} onChange={e => set("condition_at_return", e.target.value)}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option>جديد</option><option>جيد</option><option>تالف</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">ملاحظات</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "تأكيد الاستلام"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}