import { useState } from "react";
import { X, Save } from "lucide-react";
import { deliverCustodyRequest } from "@/api/assetsApi";

const CONDITION_OPTIONS = [
    { value: "new", label: "جديد" },
    { value: "good", label: "جيد" },
    { value: "damaged", label: "تالف" },
];

export default function CustodyDeliverModal({ request, employees, onClose, onSave }) {
    const [form, setForm] = useState({
        delivered_by: "",
        delivery_date: new Date().toISOString().slice(0, 10),
        condition_at_delivery: "good",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const assetName = request?.equipment_name || request?.asset_name || request?.equipment?.name || "—";
    const employeeName = request?.employee_name || request?.employee?.name || "—";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.delivered_by) { setError("اختر الموظف المُسلِّم"); return; }
        setError("");
        setSaving(true);
        try {
            await deliverCustodyRequest(request.id, {
                delivered_by: Number(form.delivered_by),
                delivery_date: form.delivery_date,
                condition_at_delivery: form.condition_at_delivery,
            });
            onSave();
        } catch (err) {
            console.error("Deliver error:", err);
            setError(err?.response?.data?.message ?? "حدث خطأ أثناء تسجيل التسليم");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
            <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-bold">تسجيل تسليم الأصل</h2>
                    <button onClick={onClose} type="button"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Summary */}
                    <div className="bg-muted/40 rounded-lg px-4 py-3 text-sm space-y-1">
                        <p><span className="font-medium">الأصل:</span> {assetName}</p>
                        <p><span className="font-medium">الموظف:</span> {employeeName}</p>
                    </div>

                    {error && (
                        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
                    )}

                    {/* سُلِّم بواسطة */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">سُلِّم بواسطة *</label>
                        <select
                            value={form.delivered_by}
                            onChange={e => set("delivered_by", e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                        >
                            <option value="">اختر الموظف المُسلِّم...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* تاريخ التسليم */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">تاريخ التسليم *</label>
                        <input
                            type="date"
                            value={form.delivery_date}
                            onChange={e => set("delivery_date", e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                        />
                    </div>

                    {/* حالة الأصل عند التسليم */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">حالة الأصل عند التسليم</label>
                        <select
                            value={form.condition_at_delivery}
                            onChange={e => set("condition_at_delivery", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                        >
                            {CONDITION_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
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
                            {saving ? "جاري الحفظ..." : "تأكيد التسليم"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
