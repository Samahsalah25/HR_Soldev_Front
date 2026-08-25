import { useState } from "react";
import { Paperclip, X } from "lucide-react";
import { attachExpenseReceipt } from "@/api/expensesApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useToast } from "@/components/ui/use-toast";

export default function AttachReceiptModal({ expense, onClose, onDone }) {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!file) return;
    try {
      setSaving(true);
      await attachExpenseReceipt(expense.id, file, fileName || file.name);
      toast({ title: "تم رفع الإيصال بنجاح ✅" });
      onDone();
    } catch (err) {
      console.error("خطأ أثناء رفع الإيصال:", err);
      toast({
        title: "تعذّر رفع الإيصال",
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
          <h3 className="font-bold text-foreground flex items-center gap-2"><Paperclip className="w-5 h-5 text-primary" />رفع إيصال</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">الملف *</label>
          <input type="file" onChange={(e) => {
            const f = e.target.files[0];
            setFile(f || null);
            if (f && !fileName) setFileName(f.name);
          }} className="w-full text-sm" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">اسم الملف</label>
          <input value={fileName} onChange={(e) => setFileName(e.target.value)} dir="ltr"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={submit} disabled={saving || !file} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            {saving ? "جاري الرفع..." : "رفع"}
          </button>
        </div>
      </div>
    </div>
  );
}
