import { useState } from "react";
import { Send, X } from "lucide-react";
import { submitExpenseReport } from "@/api/expensesApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useToast } from "@/components/ui/use-toast";

const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SubmitReportModal({ selectedExpenses, onClose, onDone }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const total = selectedExpenses.reduce((s, e) => s + (e.total_amount || 0), 0);

  const submit = async () => {
    try {
      setSaving(true);
      await submitExpenseReport({
        name: name.trim(),
        expense_ids: selectedExpenses.map((e) => e.id),
      });
      toast({ title: "تم تقديم تقرير المصروفات بنجاح ✅" });
      onDone();
    } catch (err) {
      console.error("خطأ أثناء تقديم التقرير:", err);
      toast({
        title: "تعذّر تقديم التقرير",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Send className="w-5 h-5 text-primary" />تقديم تقرير مصروفات</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <p className="text-xs text-muted-foreground">
          هيتم تجميع {selectedExpenses.length} مصروف بإجمالي {fmt(total)} ر.س في تقرير واحد.
        </p>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">اسم التقرير *</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="مثال: مصروفات سفر أغسطس"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={submit} disabled={saving || !name.trim()} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            {saving ? "جاري التقديم..." : "تقديم"}
          </button>
        </div>
      </div>
    </div>
  );
}
