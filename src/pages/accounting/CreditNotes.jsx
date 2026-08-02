import { useState, useEffect } from "react";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import {
  ReceiptText, ArrowRight, Send, Printer, RotateCcw, CreditCard, Ban, FileText,
} from "lucide-react";
import {
  getInvoices,
  confirmInvoice,
  resetInvoiceToDraft,
  cancelInvoice,
  registerInvoicePayment,
  downloadInvoicePDF,
  sendInvoiceEmail,
  getJournals,
  getPaymentMethodsForJournal,
} from "@/api/accountingApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

const STATUS_LABELS = { draft: "مسودة", posted: "مرحل", cancel: "ملغي", cancelled: "ملغي" };

const PAYMENT_STATUS = {
  not_paid: { label: "غير مدفوع", badge: "bg-muted text-muted-foreground", ribbon: null },
  in_payment: { label: "قيد السداد", badge: "bg-amber-100 text-amber-700", ribbon: "bg-amber-500" },
  partial: { label: "مدفوع جزئيًا", badge: "bg-amber-100 text-amber-700", ribbon: "bg-amber-500" },
  paid: { label: "مدفوع", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
  reversed: { label: "معكوس", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
  cancelled: { label: "ملغي", badge: "bg-muted text-muted-foreground", ribbon: null },
};

const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function Ribbon({ text, color }) {
  if (!color) return null;
  return (
    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none">
      <div className={`absolute top-6 -left-9 w-40 text-center text-white text-xs font-bold py-1 -rotate-45 shadow ${color}`}>
        {text}
      </div>
    </div>
  );
}

function StatusStepper({ status }) {
  const steps = ["draft", "posted"];
  if (status === "cancel" || status === "cancelled") {
    return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">ملغي</span>;
  }
  return (
    <div className="flex items-center border border-border rounded-lg overflow-hidden text-xs font-medium">
      {steps.map((s, i) => (
        <span key={s} className={`px-3 py-1.5 ${i > 0 ? "border-r border-border" : ""} ${status === s ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"}`}>
          {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  );
}

// ── مودال تسجيل دفعة على إشعار الدائن ─────────────────────────────────────────
function PaymentModal({ note, onClose, onDone }) {
  const { toast } = useToast();
  const [journals, setJournals] = useState([]);
  const [journalId, setJournalId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodLineId, setPaymentMethodLineId] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJournals().then(setJournals).catch(() => setJournals([]));
  }, []);

  useEffect(() => {
    setPaymentMethodLineId("");
    if (!journalId) { setPaymentMethods([]); return; }
    getPaymentMethodsForJournal(journalId, "inbound")
      .then(setPaymentMethods)
      .catch(() => setPaymentMethods([]));
  }, [journalId]);

  const submit = async () => {
    try {
      setSaving(true);
      await registerInvoicePayment(note.id, {
        journal_id: Number(journalId),
        amount: amount ? Number(amount) : undefined,
        memo: memo || undefined,
        payment_method_line_id: paymentMethodLineId ? Number(paymentMethodLineId) : undefined,
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
        <h3 className="font-bold text-foreground flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" />تسجيل دفعة</h3>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ادفع من (دفتر اليومية) *</label>
          <select value={journalId} onChange={(e) => setJournalId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
            <option value="">اختر دفتر اليومية...</option>
            {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">المبلغ (اتركه فارغًا لتحصيل المبلغ المستحق بالكامل)</label>
          <input type="number" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder={fmt(note.amount_residual)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">طريقة الدفع</label>
          <select value={paymentMethodLineId} onChange={(e) => setPaymentMethodLineId(e.target.value)}
            disabled={!journalId}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none disabled:opacity-50">
            <option value="">بدون</option>
            {paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">ملاحظة</label>
          <input value={memo} onChange={(e) => setMemo(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={submit} disabled={saving || !journalId} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            {saving ? "جاري التسجيل..." : "تسجيل الدفعة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── عرض تفاصيل إشعار الدائن ────────────────────────────────────────────────────
function CreditNoteDetail({ note, onBack, onChanged }) {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const [tab, setTab] = useState("lines");
  const [showPayment, setShowPayment] = useState(false);
  const [busy, setBusy] = useState(false);

  const ps = PAYMENT_STATUS[note.payment_state] || PAYMENT_STATUS.not_paid;
  const isDraft = note.state === "draft";
  const isPosted = note.state === "posted";
  const isCancelled = note.state === "cancel" || note.state === "cancelled";
  const isFullyPaid = note.payment_state === "paid" || note.payment_state === "reversed";

  const run = async (fn, successMsg, errorTitle) => {
    try {
      setBusy(true);
      await fn();
      if (successMsg) toast({ title: successMsg });
      onChanged();
    } catch (err) {
      console.error(`${errorTitle}:`, err);
      toast({
        title: errorTitle,
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    const ok = await confirmDialog({ title: "اعتماد الإشعار", message: "هل أنت متأكد من اعتماد وترحيل هذا الإشعار؟", confirmText: "اعتماد" });
    if (!ok) return;
    run(() => confirmInvoice(note.id), "تم اعتماد الإشعار بنجاح ✅", "تعذّر اعتماد الإشعار");
  };

  const handleResetToDraft = async () => {
    const ok = await confirmDialog({ title: "إرجاع لمسودة", message: "هل تريد إرجاع هذا الإشعار لحالة المسودة؟", confirmText: "إرجاع" });
    if (!ok) return;
    run(() => resetInvoiceToDraft(note.id), "تم إرجاع الإشعار لمسودة", "تعذّر إرجاع الإشعار لمسودة");
  };

  const handleCancel = async () => {
    const ok = await confirmDialog({ title: "إلغاء الإشعار", message: "هل أنت متأكد من إلغاء هذا الإشعار؟ لا يمكن التراجع عن هذا الإجراء.", confirmText: "إلغاء الإشعار", variant: "destructive" });
    if (!ok) return;
    run(() => cancelInvoice(note.id), "تم إلغاء الإشعار", "تعذّر إلغاء الإشعار");
  };

  const handlePrint = async () => {
    try {
      setBusy(true);
      const blob = await downloadInvoicePDF(note.id);
      window.open(window.URL.createObjectURL(blob), "_blank");
    } catch (err) {
      console.error("تعذّر فتح الإشعار:", err);
      toast({ title: "تعذّر فتح الإشعار", description: "حصل خطأ أثناء تحميل ملف PDF.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    try {
      setBusy(true);
      const blob = await downloadInvoicePDF(note.id);
      downloadBlob(blob, `${note.name || "credit-note"}.pdf`);
    } catch (err) {
      console.error("تعذّر تحميل الإشعار:", err);
      toast({ title: "تعذّر تحميل الإشعار", description: "حصل خطأ أثناء تحميل ملف PDF.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    const ok = await confirmDialog({ title: "إرسال الإشعار", message: "هل تريد إرسال الإشعار بالبريد الإلكتروني للعميل؟", confirmText: "إرسال" });
    if (!ok) return;
    run(() => sendInvoiceEmail(note.id), "تم إرسال الإشعار بالبريد الإلكتروني ✅", "تعذّر إرسال الإشعار");
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> إشعارات دائن
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{note.name || `#${note.id}`}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <button onClick={handleConfirm} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              اعتماد
            </button>
          )}
          <button onClick={handleSend} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <Send className="w-4 h-4" /> إرسال
          </button>
          <button onClick={handlePrint} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button onClick={handleDownload} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <FileText className="w-4 h-4" /> تحميل PDF
          </button>
          {isPosted && !isFullyPaid && (
            <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <CreditCard className="w-4 h-4" /> دفع
            </button>
          )}
          {isPosted && (
            <button onClick={handleResetToDraft} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
              <RotateCcw className="w-4 h-4" /> إعادة لمسودة
            </button>
          )}
          {!isCancelled && (
            <button onClick={handleCancel} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
              <Ban className="w-4 h-4" /> إلغاء
            </button>
          )}
        </div>
        <StatusStepper status={note.state} />
      </div>

      <div className="relative bg-card rounded-2xl border border-border p-6 overflow-hidden">
        <Ribbon text={ps.label} color={ps.ribbon} />

        <p className="text-sm text-muted-foreground mb-1">إشعار دائن للعميل</p>
        <h2 className="text-3xl font-bold text-foreground mb-6">{note.name || `#${note.id}`}</h2>

        <div className="flex flex-wrap justify-between gap-6 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">العميل</p>
            <p className="text-sm font-medium text-foreground">{note.partner_name}</p>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="text-xs text-muted-foreground mb-1">التاريخ</p>
              <p className="text-sm font-medium text-foreground">{note.invoice_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-foreground">{note.invoice_date_due || "—"}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-3">
          {[
            { id: "lines", label: "البنود" },
            { id: "other", label: "معلومات إضافية" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "lines" && (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["الوصف", "الكمية", "السعر", "الإجمالي"].map((h) => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(note.invoice_line_ids || []).map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{l.name}</td>
                    <td className="px-4 py-2.5">{l.quantity}</td>
                    <td className="px-4 py-2.5">{fmt(l.price_unit)}</td>
                    <td className="px-4 py-2.5 font-semibold">ر.س {fmt(l.price_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "other" && (
          <div className="text-sm text-muted-foreground py-4 space-y-2">
            <p>مرجع الدفع: {note.payment_reference || "—"}</p>
            <p>معرّف العملة: {note.currency_id ?? "—"}</p>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي غير شامل الضريبة</span>
              <span className="font-medium">ر.س {fmt(note.amount_untaxed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الضريبة</span>
              <span className="font-medium">ر.س {fmt(note.amount_tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>الإجمالي</span>
              <span>ر.س {fmt(note.amount_total)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border text-primary">
              <span>المبلغ المستحق</span>
              <span>ر.س {fmt(note.amount_residual)}</span>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal note={note} onClose={() => setShowPayment(false)} onDone={() => { setShowPayment(false); onChanged(); }} />
      )}
    </div>
  );
}

// ── الصفحة الرئيسية: قائمة إشعارات الدائن ─────────────────────────────────────
// ملحوظة: مفيش فورم "إنشاء إشعار من الصفر" — الإشعار بيتعمل من داخل فاتورة
// عميل موجودة (زرار "إشعار دائن" في Invoices.jsx)
export default function CreditNotes() {
  const { toast } = useToast();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const invs = await getInvoices("out_refund");
      const mapped = invs.map((inv) => ({
        ...inv,
        lines: (inv.invoice_line_ids || []).map((l) => ({ ...l })),
      }));
      setNotes(mapped);
      setSelected((prev) => (prev ? mapped.find((i) => i.id === prev.id) || null : prev));
    } catch (err) {
      console.error("خطأ أثناء تحميل إشعارات الدائن:", err);
      toast({
        title: "تعذّر تحميل إشعارات الدائن",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = notes.reduce((s, n) => s + (n.amount_untaxed || 0), 0);

  if (selected) {
    return <CreditNoteDetail note={selected} onBack={() => setSelected(null)} onChanged={load} />;
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-primary" /> إشعارات دائن
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إشعارات دائن صادرة للعملاء (مرتجعات / تخفيضات)</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["الرقم", "العميل", "التاريخ", "تاريخ الاستحقاق", "غير شامل الضريبة", "الحالة", "حالة السداد"].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
            ) : notes.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد إشعارات دائن بعد — يتم إنشاؤها من داخل فاتورة عميل موجودة</td></tr>
            ) : notes.map((n) => {
              const ps = PAYMENT_STATUS[n.payment_state] || PAYMENT_STATUS.not_paid;
              return (
                <tr key={n.id} onClick={() => setSelected(n)} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{n.name || `#${n.id}`}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{n.partner_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{n.invoice_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{n.invoice_date_due || "—"}</td>
                  <td className="px-4 py-3 font-semibold">ر.س {fmt(n.amount_untaxed)}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{STATUS_LABELS[n.state] || n.state}</span></td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ps.badge}`}>{ps.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/10">
              <td colSpan={4} />
              <td className="px-4 py-3 font-bold text-foreground">ر.س {fmt(total)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
