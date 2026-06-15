import { useState } from "react";
import { X, Save } from "lucide-react";
import { createCustodyRequest } from "@/api/assetsApi";

export default function AssetRequestModal({ assets, employees, onClose, onSave }) {
  const [form, setForm] = useState({
    employee_id: "",
    equipment_id: "",
    request_type: "custody_request",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const selectedEmployee = employees.find(e => String(e.id) === String(form.employee_id));

  // Filter assets based on request type and selected employee
  const isReturn = form.request_type === "custody_return";
  const availableAssets = isReturn
    ? assets.filter(a =>
      (a.state === "assigned" || a.state === "in_use") &&
      (
        !form.employee_id ||
        String(a.employee_id) === String(form.employee_id) ||
        a.employee_name === selectedEmployee?.name
      )
    )
    : assets.filter(a => a.state === "available");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id) { setError("اختر الموظف"); return; }
    if (!form.equipment_id) { setError("اختر الأصل"); return; }
    setError("");
    setSaving(true);
    try {
      await createCustodyRequest({
        employee_id: Number(form.employee_id),
        equipment_id: Number(form.equipment_id),
        request_type: form.request_type,
        reason: form.reason,
      });
      onSave();
    } catch (err) {
      console.error("Custody request error:", err);
      setError(err?.response?.data?.message ?? "حدث خطأ أثناء إرسال الطلب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">طلب أصل</h2>
          <button onClick={onClose} type="button"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* نوع الطلب */}
          <div>
            <label className="text-sm font-medium">نوع الطلب</label>
            <select
              value={form.request_type}
              onChange={e => setForm(f => ({ ...f, request_type: e.target.value, equipment_id: "" }))}
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            >
              <option value="custody_request">طلب أصل</option>
              <option value="custody_return">إعادة أصل</option>
            </select>
          </div>

          {/* الموظف */}
          <div>
            <label className="text-sm font-medium">الموظف *</label>
            <select
              value={form.employee_id}
              onChange={e => setForm(f => ({ ...f, employee_id: e.target.value, equipment_id: "" }))}
              required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            >
              <option value="">اختر الموظف...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} {emp.department ? `— ${emp.department}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* الأصل */}
          <div>
            <label className="text-sm font-medium">
              {form.request_type === "custody_request"
                ? "الأصل المطلوب (متاح فقط) *"
                : "الأصل المراد إعادته *"}
            </label>
            <select
              value={form.equipment_id}
              onChange={e => set("equipment_id", e.target.value)}
              required
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            >
              <option value="">اختر الأصل...</option>
              {availableAssets.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} {(a.serialNumber || a.serial_number) ? `(${a.serialNumber || a.serial_number})` : ""}
                </option>
              ))}
            </select>
            {availableAssets.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {isReturn
                  ? form.employee_id
                    ? "لا توجد أصول مخصصة لهذا الموظف"
                    : "اختر الموظف أولاً لعرض أصوله"
                  : "لا توجد أصول متاحة حالياً"}
              </p>
            )}
          </div>

          {/* السبب */}
          <div>
            <label className="text-sm font-medium">السبب</label>
            <textarea
              value={form.reason}
              onChange={e => set("reason", e.target.value)}
              rows={2}
              placeholder="سبب الطلب..."
              className="w-full mt-1.5 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
