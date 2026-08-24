import { useState, useEffect } from "react";
import {
  UserCog, Plus, X, Save, Trash2, Paperclip, ArrowRight,
  CheckCircle, XCircle, Send, CreditCard, FileCheck,
} from "lucide-react";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  attachExpenseReceipt,
  getExpenseReports,
  getExpenseReport,
  submitExpenseReport,
  approveExpenseReport,
  refuseExpenseReport,
  postExpenseReportToAccountant,
  registerExpenseReportPayment,
} from "@/api/expensesApi";
import { getProducts, getPaymentJournals } from "@/api/accountingApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

// ملاحظة: "own_account" و"company_account" دي القيم القياسية لحقل payment_mode في Odoo hr_expense.
const PAYMENT_MODES = [
  { value: "own_account", label: "على حساب الموظف (تعويض لاحقًا)" },
  { value: "company_account", label: "على حساب الشركة مباشرة" },
];

// ⚠️ مفيش قائمة قيم مؤكدة من الباك إند لـ expense_category غير "travel" (من عينة الـ Postman)،
// فالحقل ده نص حر بدل dropdown لحد ما تتأكد القيم المسموح بيها.
const EXPENSE_STATE_LABELS = { draft: "مسودة", reported: "مُقدَّم", done: "مُعتمد", refused: "مرفوض" };
const EXPENSE_STATE_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  reported: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-600",
};

// ⚠️ مفيش عينة رد فيها تقرير فعلي من الـ API (الرد كان فاضي: reports: [])،
// فالـ labels دي افتراضية مبنية على تدفق Odoo القياسي (draft → submitted → approved → posted → paid)
// ولازم تتأكد من القيم الحقيقية اللي بترجع من الباك إند وتتعدّل هنا لو مختلفة.
const REPORT_STATE_LABELS = {
  draft: "مسودة",
  submitted: "بانتظار الاعتماد",
  approved: "معتمد",
  posted: "مُرحَّل للمحاسب",
  paid: "مدفوع",
  refused: "مرفوض",
  cancelled: "ملغي",
};
const REPORT_STATE_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  posted: "bg-purple-100 text-purple-700",
  paid: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
};

const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ────────────────────────────────────────────────────────────────────────
   فورم إنشاء / تعديل مصروف
   ──────────────────────────────────────────────────────────────────── */
function ExpenseForm({ expense, products, onSave, onClose }) {
  const { toast } = useToast();
  const isEdit = Boolean(expense?.id);

  const [form, setForm] = useState({
    name: expense?.name || "",
    total_amount: expense?.total_amount ?? "",
    product_id: expense?.product_id || "",
    date: expense?.date || new Date().toISOString().slice(0, 10),
    payment_mode: expense?.payment_mode || "own_account",
    expense_category: expense?.expense_category || "",
    receipt_number: expense?.receipt_number || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError("");
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        total_amount: Number(form.total_amount) || 0,
        product_id: form.product_id ? Number(form.product_id) : undefined,
        date: form.date,
        payment_mode: form.payment_mode,
        expense_category: form.expense_category || undefined,
        receipt_number: form.receipt_number || undefined,
      };

      if (isEdit) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ المصروف:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ المصروف، حاول تاني."));
      toast({
        title: "تعذّر حفظ المصروف",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            {isEdit ? "تعديل مصروف" : "مصروف جديد"}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">وصف المصروف *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="مثال: غداء عمل مع عميل"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المنتج / نوع المصروف</label>
              <select value={form.product_id} onChange={(e) => set("product_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المبلغ *</label>
              <input type="number" min={0} dir="ltr" value={form.total_amount}
                onChange={(e) => set("total_amount", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التاريخ *</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <select value={form.payment_mode} onChange={(e) => set("payment_mode", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تصنيف المصروف</label>
              <input value={form.expense_category} onChange={(e) => set("expense_category", e.target.value)}
                placeholder="مثال: travel"
                dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم الإيصال</label>
              <input value={form.receipt_number} onChange={(e) => set("receipt_number", e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.total_amount || !form.date}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   مودال رفع إيصال
   ──────────────────────────────────────────────────────────────────── */
function AttachReceiptModal({ expense, onClose, onDone }) {
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

/* ────────────────────────────────────────────────────────────────────────
   مودال تقديم تقرير مصروفات جديد
   ──────────────────────────────────────────────────────────────────── */
function SubmitReportModal({ selectedExpenses, onClose, onDone }) {
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

/* ────────────────────────────────────────────────────────────────────────
   مودال رفض تقرير
   ──────────────────────────────────────────────────────────────────── */
function RefuseReportModal({ report, onClose, onDone }) {
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

/* ────────────────────────────────────────────────────────────────────────
   مودال تسجيل دفعة سداد لتقرير
   ──────────────────────────────────────────────────────────────────── */
function RegisterPaymentModal({ report, onClose, onDone }) {
  const { toast } = useToast();
  const [journals, setJournals] = useState([]);
  const [journalId, setJournalId] = useState("");
  const [amount, setAmount] = useState(report.total_amount ?? "");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPaymentJournals().then((js) => {
      setJournals(js);
      if (js.length === 1) setJournalId(String(js[0].id));
    }).catch(() => setJournals([]));
  }, []);

  const submit = async () => {
    try {
      setSaving(true);
      await registerExpenseReportPayment(report.id, {
        journal_id: Number(journalId),
        amount: Number(amount) || 0,
        payment_date: paymentDate,
      });
      toast({ title: "تم تسجيل الدفعة بنجاح ✅" });
      onDone();
    } catch (err) {
      console.error("خطأ أثناء تسجيل الدفعة:", err);
      toast({
        title: "تعذّر تسجيل الدفعة",
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
          <h3 className="font-bold text-foreground flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />تسجيل دفعة</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ادفع من (دفتر اليومية) *</label>
          <select value={journalId} onChange={(e) => setJournalId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
            <option value="">اختر دفتر اليومية...</option>
            {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">المبلغ *</label>
          <input type="number" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">تاريخ الدفع</label>
          <input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={submit} disabled={saving || !journalId || !amount} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            {saving ? "جاري التسجيل..." : "تسجيل الدفعة"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   تفاصيل تقرير مصروفات
   ──────────────────────────────────────────────────────────────────── */
function ReportDetail({ reportId, onBack, onChanged }) {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRefuse, setShowRefuse] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const load = () => {
    setLoading(true);
    getExpenseReport(reportId)
      .then((res) => setReport(res?.report || res?.data || res))
      .catch((err) => {
        console.error("تعذّر تحميل التقرير:", err);
        toast({ title: "تعذّر تحميل التقرير", description: extractApiErrorMessage(err), variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [reportId]);

  const run = async (fn, successMsg, errorTitle) => {
    try {
      setBusy(true);
      await fn();
      if (successMsg) toast({ title: successMsg });
      load();
      onChanged();
    } catch (err) {
      console.error(`${errorTitle}:`, err);
      toast({ title: errorTitle, description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    const ok = await confirmDialog({ title: "اعتماد التقرير", message: "هل أنت متأكد من اعتماد تقرير المصروفات ده؟", confirmText: "اعتماد" });
    if (!ok) return;
    run(() => approveExpenseReport(reportId), "تم اعتماد التقرير بنجاح ✅", "تعذّر اعتماد التقرير");
  };

  const handlePost = async () => {
    const ok = await confirmDialog({ title: "ترحيل للمحاسب", message: "هل تريد ترحيل هذا التقرير للمحاسب؟", confirmText: "ترحيل" });
    if (!ok) return;
    run(() => postExpenseReportToAccountant(reportId), "تم الترحيل للمحاسب بنجاح ✅", "تعذّر الترحيل للمحاسب");
  };

  if (loading || !report) {
    return (
      <div className="p-6 text-center text-muted-foreground" dir="rtl">جاري التحميل...</div>
    );
  }

  const state = report.state || report.status || "draft";
  const expenseLines = report.expenses || report.expense_lines || report.lines || [];

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> تقارير المصروفات
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{report.name}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={handleApprove} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            <CheckCircle className="w-4 h-4" /> اعتماد
          </button>
          <button onClick={() => setShowRefuse(true)} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
            <XCircle className="w-4 h-4" /> رفض
          </button>
          <button onClick={handlePost} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <FileCheck className="w-4 h-4" /> ترحيل للمحاسب
          </button>
          <button onClick={() => setShowPayment(true)} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <CreditCard className="w-4 h-4" /> تسجيل دفعة
          </button>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${REPORT_STATE_COLORS[state] || "bg-muted text-muted-foreground"}`}>
          {REPORT_STATE_LABELS[state] || state}
        </span>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-sm text-muted-foreground mb-1">تقرير مصروفات</p>
        <h2 className="text-2xl font-bold text-foreground mb-6">{report.name}</h2>

        <div className="flex flex-wrap justify-between gap-6 mb-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">الموظف</p>
            <p className="font-medium text-foreground">{report.employee_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
            <p className="font-bold text-primary">{fmt(report.total_amount)} ر.س</p>
          </div>
        </div>

        {expenseLines.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["الوصف", "التاريخ", "المبلغ"].map((h) => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenseLines.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{l.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.date}</td>
                    <td className="px-4 py-2.5 font-semibold">{fmt(l.total_amount)} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRefuse && (
        <RefuseReportModal report={report} onClose={() => setShowRefuse(false)}
          onDone={() => { setShowRefuse(false); load(); onChanged(); }} />
      )}
      {showPayment && (
        <RegisterPaymentModal report={report} onClose={() => setShowPayment(false)}
          onDone={() => { setShowPayment(false); load(); onChanged(); }} />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية
   ──────────────────────────────────────────────────────────────────── */
export default function EmployeeExpenses() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [activeTab, setActiveTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [receiptExpense, setReceiptExpense] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showSubmitReport, setShowSubmitReport] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [expRes, repRes, prods] = await Promise.all([
        getExpenses(),
        getExpenseReports(),
        getProducts("expense").catch(() => []),
      ]);
      setExpenses(expRes?.expenses || []);
      setReports(repRes?.reports || []);
      setProducts(prods);
    } catch (err) {
      console.error("خطأ أثناء تحميل المصروفات:", err);
      toast({
        title: "تعذّر تحميل المصروفات",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditExpense(null); setShowExpenseForm(true); };
  const openEdit = (exp) => { setEditExpense(exp); setShowExpenseForm(true); };
  const closeForm = () => { setShowExpenseForm(false); setEditExpense(null); };

  const toggleSelect = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  const handleDelete = async (exp) => {
    const ok = await confirmDialog({
      title: "حذف المصروف",
      message: "هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await deleteExpense(exp.id);
      toast({ title: "تم حذف المصروف" });
      setSelectedIds((ids) => ids.filter((i) => i !== exp.id));
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف المصروف:", err);
      toast({
        title: "تعذّر حذف المصروف",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const selectedExpenses = expenses.filter((e) => selectedIds.includes(e.id));

  const expensesPagination = usePagination(expenses, 20);
  const reportsPagination = usePagination(reports, 20);

  if (selectedReportId) {
    return (
      <ReportDetail
        reportId={selectedReportId}
        onBack={() => setSelectedReportId(null)}
        onChanged={load}
      />
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" /> مصروفات الموظفين
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">تسجيل مصروفات الموظفين وتقديمها للاعتماد والسداد</p>
        </div>
        {activeTab === "expenses" && (
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <button onClick={() => setShowSubmitReport(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5">
                <Send className="w-4 h-4" /> تقديم كتقرير ({selectedIds.length})
              </button>
            )}
            <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" /> مصروف جديد
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { id: "expenses", label: `المصروفات (${expenses.length})` },
          { id: "reports", label: `تقارير المصروفات (${reports.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "expenses" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="w-10 px-4 py-3" />
                {["الوصف", "الموظف", "النوع", "التاريخ", "المبلغ", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد مصروفات بعد</td></tr>
              ) : expensesPagination.pageItems.map((exp) => (
                <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    {!exp.sheet_id && (
                      <input type="checkbox" checked={selectedIds.includes(exp.id)} onChange={() => toggleSelect(exp.id)}
                        className="w-4 h-4 accent-primary" />
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{exp.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{exp.employee_name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{exp.product_name || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{exp.date}</td>
                  <td className="px-4 py-3 font-semibold">{fmt(exp.total_amount)} ر.س</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EXPENSE_STATE_COLORS[exp.state] || "bg-muted text-muted-foreground"}`}>
                      {EXPENSE_STATE_LABELS[exp.state] || exp.state}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setReceiptExpense(exp)} title="رفع إيصال" className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      {!exp.sheet_id && (
                        <>
                          <button onClick={() => openEdit(exp)} title="تعديل" className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(exp)} title="حذف" className="p-1.5 hover:bg-red-50 rounded text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <TablePagination
            page={expensesPagination.page}
            totalPages={expensesPagination.totalPages}
            totalItems={expensesPagination.totalItems}
            pageSize={expensesPagination.pageSize}
            onPageChange={expensesPagination.setPage}
          />
        </div>
      )}

      {activeTab === "reports" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["اسم التقرير", "الموظف", "الإجمالي", "الحالة", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد تقارير مصروفات بعد</td></tr>
              ) : reportsPagination.pageItems.map((r) => {
                const state = r.state || r.status || "draft";
                return (
                  <tr key={r.id} onClick={() => setSelectedReportId(r.id)} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.employee_name || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(r.total_amount)} ر.س</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REPORT_STATE_COLORS[state] || "bg-muted text-muted-foreground"}`}>
                        {REPORT_STATE_LABELS[state] || state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <TablePagination
            page={reportsPagination.page}
            totalPages={reportsPagination.totalPages}
            totalItems={reportsPagination.totalItems}
            pageSize={reportsPagination.pageSize}
            onPageChange={reportsPagination.setPage}
          />
        </div>
      )}

      {showExpenseForm && (
        <ExpenseForm expense={editExpense} products={products}
          onSave={() => { closeForm(); load(); }} onClose={closeForm} />
      )}
      {receiptExpense && (
        <AttachReceiptModal expense={receiptExpense} onClose={() => setReceiptExpense(null)}
          onDone={() => { setReceiptExpense(null); load(); }} />
      )}
      {showSubmitReport && (
        <SubmitReportModal selectedExpenses={selectedExpenses}
          onClose={() => setShowSubmitReport(false)}
          onDone={() => { setShowSubmitReport(false); setSelectedIds([]); load(); }} />
      )}
    </div>
  );
}
