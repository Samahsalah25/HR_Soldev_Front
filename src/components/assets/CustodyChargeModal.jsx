import { useState, useEffect } from "react";
import { X, Wallet } from "lucide-react";
import { chargeCustodyRequest, CHARGE_PAYMENT_METHOD_OPTIONS } from "@/api/assetsApi";
import { getSalaryAdvanceTypes } from "@/api/salaryAdvanceTypesApi";
import { getJournals } from "@/api/Journalsapi";
import { extractApiErrorMessage } from "@/lib/apiErrors";

export default function CustodyChargeModal({ request, onClose, onSave }) {
  const [advanceTypes, setAdvanceTypes] = useState([]);
  const [journals, setJournals] = useState([]);
  const [form, setForm] = useState({
    // مؤكَّد عبر Postman: لو الحقل ده اتسيب فاضي بيتحسب افتراضيًا من damage_cost
    amount: request?.damage_cost ?? "",
    payment_method: "deduction",
    advance_type_id: "",
    installments_count: 3,
    journal_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSalaryAdvanceTypes().then(res => setAdvanceTypes(res?.data || [])).catch(() => setAdvanceTypes([]));
    getJournals().then(setJournals).catch(() => setJournals([]));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const assetName = request?.equipment_name || request?.asset_name || request?.equipment?.name || "—";
  const employeeName = request?.employee_name || request?.employee?.name || "—";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.payment_method === "advance" && !form.advance_type_id) {
      setError("اختر نوع السلفة");
      return;
    }
    if (form.payment_method === "upfront" && !form.journal_id) {
      setError("اختر دفتر اليومية");
      return;
    }

    setSaving(true);
    try {
      const payload = { payment_method: form.payment_method };
      if (form.amount !== "" && form.amount != null) payload.amount = Number(form.amount);

      if (form.payment_method === "advance") {
        payload.advance_type_id = Number(form.advance_type_id);
        payload.installments_count = Number(form.installments_count) || 1;
      } else if (form.payment_method === "upfront") {
        payload.journal_id = Number(form.journal_id);
      }

      await chargeCustodyRequest(request.id, payload);
      onSave();
    } catch (err) {
      console.error("Charge custody error:", err);
      setError(extractApiErrorMessage(err, "حدث خطأ أثناء تسجيل التحصيل"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Wallet className="w-5 h-5 text-muted-foreground" /> تحصيل من الموظف
          </h2>
          <button onClick={onClose} type="button"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm space-y-1">
            <p><span className="font-medium">الموظف:</span> {employeeName}</p>
            <p><span className="font-medium">الأصل:</span> {assetName}</p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">المبلغ (ريال)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={e => set("amount", e.target.value)}
              placeholder="افتراضيًا = تكلفة التلف المسجّلة على الإعادة"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">طريقة التحصيل *</label>
            <div className="space-y-2">
              {CHARGE_PAYMENT_METHOD_OPTIONS.map(o => (
                <label key={o.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="payment_method"
                    value={o.value}
                    checked={form.payment_method === o.value}
                    onChange={e => set("payment_method", e.target.value)}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          {form.payment_method === "advance" && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نوع السلفة *</label>
                <select
                  value={form.advance_type_id}
                  onChange={e => set("advance_type_id", e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                >
                  <option value="">اختر نوع السلفة...</option>
                  {advanceTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">عدد الأقساط *</label>
                <input
                  type="number"
                  min={1}
                  value={form.installments_count}
                  onChange={e => set("installments_count", e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                />
              </div>
            </>
          )}

          {form.payment_method === "upfront" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">دفتر اليومية (Bank / Cash) *</label>
              <select
                value={form.journal_id}
                onChange={e => set("journal_id", e.target.value)}
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              >
                <option value="">اختر دفتر اليومية...</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
          )}

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
              <Wallet className="w-4 h-4" />
              {saving ? "جاري التحصيل..." : "تأكيد التحصيل"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
