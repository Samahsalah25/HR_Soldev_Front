import { useState } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import { receiveCustodyRequest } from "@/api/assetsApi";

const CONDITION_OPTIONS = [
    { value: "new", label: "جديد" },
    { value: "good", label: "جيد" },
    { value: "damaged", label: "تالف" },
];

export default function CustodyReceiveModal({ request, employees, onClose, onSave }) {
    const [form, setForm] = useState({
        received_by: "",
        receive_date: new Date().toISOString().slice(0, 10),
        condition_at_return: "good",
        notes: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const assetName = request?.equipment_name || request?.asset_name || request?.equipment?.name || "—";
    const employeeName = request?.employee_name || request?.employee?.name || "—";

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.received_by) { setError("اختر الموظف المستلِم"); return; }
        setError("");
        setSaving(true);
        try {
            await receiveCustodyRequest(request.id, {
                received_by: Number(form.received_by),
                receive_date: form.receive_date,
                condition_at_return: form.condition_at_return,
                notes: form.notes,
            });
            onSave();
        } catch (err) {
            console.error("Receive error:", err);
            setError(err?.response?.data?.message ?? "حدث خطأ أثناء تسجيل الاستلام");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
            <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <h2 className="text-lg font-bold">تسجيل استلام الأصل</h2>
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

                    {/* استُلم بواسطة */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">استُلم بواسطة *</label>
                        <select
                            value={form.received_by}
                            onChange={e => set("received_by", e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                        >
                            <option value="">اختر الموظف المستلِم...</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* تاريخ الاستلام */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">تاريخ الاستلام *</label>
                        <input
                            type="date"
                            value={form.receive_date}
                            onChange={e => set("receive_date", e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                        />
                    </div>

                    {/* حالة الأصل عند الإعادة */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">حالة الأصل عند الإعادة</label>
                        <select
                            value={form.condition_at_return}
                            onChange={e => set("condition_at_return", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                        >
                            {CONDITION_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* ملاحظات */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">ملاحظات</label>
                        <textarea
                            value={form.notes}
                            onChange={e => set("notes", e.target.value)}
                            rows={2}
                            placeholder="أي ملاحظات عند الاستلام..."
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
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
                            <RotateCcw className="w-4 h-4" />
                            {saving ? "جاري الحفظ..." : "تأكيد الاستلام"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
