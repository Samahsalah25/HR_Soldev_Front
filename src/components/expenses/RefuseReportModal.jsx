import { useState } from "react";
import { XCircle, X } from "lucide-react";
import { refuseExpenseReport } from "@/api/expensesApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useToast } from "@/components/ui/use-toast";

export default function RefuseReportModal({ report, onClose, onDone }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    try {
      setSaving(true);
      await refuseExpenseReport(report.id, reason.trim());
      toast({ title: "تم رفض التقرير" });
      onDone();
    } catch (err) {
      console.error("خطأ أثناء رفض التقرير:", err);
      toast({
        title: "تعذّر رفض التقرير",
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
          <h3 className="font-bold text-foreground flex items-center gap-2"><XCircle className="w-5 h-5 text-red-500" />رفض التقرير</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">سبب الرفض *</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={submit} disabled={saving || !reason.trim()} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50">
            {saving ? "جاري الرفض..." : "تأكيد الرفض"}
          </button>
        </div>
      </div>
    </div>
  );
}
