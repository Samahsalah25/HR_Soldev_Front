import { useState, useEffect } from "react";
import {
  FileText, Plus, ArrowRight, Printer, RotateCcw,
  CreditCard, ReceiptText, X, Trash2, CheckCircle, Ban,
} from "lucide-react";
import {
  getBills,
  getBillById,
  createBill,
  updateBill,
  confirmBill,
  resetBillToDraft,
  cancelBill,
  registerBillPayment,
  createBillCreditNote,
  printBill,
  openBillPrint,
} from "@/api/billsApi";
import { getVendors } from "@/api/partnersApi";
import { getAccounts, getProducts, getTaxes } from "@/api/accountingApi";
import { getJournals, getPurchaseJournals, getPaymentJournals, getPaymentTerms, getPaymentMethodsForJournal } from "@/api/accountingMetaApi";
import { extractErrorMessage } from "@/utils/errorUtils";
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

// ── فورم إنشاء/تعديل فاتورة مورد ──────────────────────────────────────────────
function BillForm({ bill, vendors, accounts, taxes, paymentTerms, products, journals, onSave, onClose }) {
  const { toast } = useToast();
  const isEdit = Boolean(bill?.id);

  const [form, setForm] = useState({
    partner_id: bill?.partner_id || "",
    invoice_date: bill?.invoice_date || new Date().toISOString().slice(0, 10),
    invoice_date_due: bill?.invoice_date_due || "",
    invoice_payment_term_id: bill?.invoice_payment_term_id || "",
    journal_id: bill?.journal_id || "",
  });
  const [lines, setLines] = useState(
    bill?.lines?.length
      ? bill.lines.map((l) => ({
          product_id: l.product_id || "",
          name: l.name || "",
          quantity: l.quantity ?? 1,
          price_unit: l.price_unit ?? 0,
          account_id: l.account_id || "",
          tax_id: l.tax_ids?.[0] || "",
        }))
      : [{ product_id: "", name: "", quantity: 1, price_unit: 0, account_id: "", tax_id: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setLine = (i, k, v) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));
  const addLine = () => setLines((ls) => [...ls, { product_id: "", name: "", quantity: 1, price_unit: 0, account_id: "", tax_id: "" }]);
  const removeLine = (i) => { if (lines.length > 1) setLines((ls) => ls.filter((_, idx) => idx !== i)); };

  const handleProductSelect = (i, productId) => {
    const product = products.find((p) => String(p.id) === String(productId));
    setLines((ls) => ls.map((l, idx) => (idx === i
      ? {
          ...l,
          product_id: productId,
          name: product ? product.name : l.name,
          price_unit: product ? product.list_price : l.price_unit,
          account_id: product?.property_account_expense_id || l.account_id,
          tax_id: product?.supplier_taxes_id?.[0] || l.tax_id,
        }
      : l)));
  };

  const activeAccounts = accounts.filter((a) => a.is_active);
  const purchaseTaxes = taxes.filter((t) => t.type_tax_use === "purchase");
  const linesTotal = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.price_unit) || 0), 0);

  const handleSave = async () => {
    setError("");
    try {
      setSaving(true);

      const payload = {
        partner_id: Number(form.partner_id),
        invoice_date: form.invoice_date,
        invoice_date_due: form.invoice_date_due || undefined,
        invoice_payment_term_id: form.invoice_payment_term_id ? Number(form.invoice_payment_term_id) : undefined,
        journal_id: Number(form.journal_id),
        invoice_line_ids: lines.map((l) => ({
          product_id: l.product_id ? Number(l.product_id) : undefined,
          name: l.name,
          quantity: Number(l.quantity) || 0,
          price_unit: Number(l.price_unit) || 0,
          account_id: l.account_id ? Number(l.account_id) : undefined,
          tax_ids: l.tax_id ? [Number(l.tax_id)] : [],
        })),
      };

      if (isEdit) {
        await updateBill(bill.id, payload);
      } else {
        await createBill(payload);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ فاتورة المورد:", err);
      setError(extractErrorMessage(err, "حصل خطأ أثناء حفظ الفاتورة، حاول تاني."));
      toast({
        title: "تعذّر حفظ الفاتورة",
        description: extractErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isEdit ? `تعديل الفاتورة ${bill.name || ""}` : "فاتورة مورد جديدة"}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المورد *</label>
              <select value={form.partner_id} onChange={(e) => set("partner_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر المورد...</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">دفتر اليومية *</label>
              <select value={form.journal_id} onChange={(e) => set("journal_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر دفتر اليومية...</option>
                {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تاريخ الفاتورة *</label>
              <input type="date" value={form.invoice_date} onChange={(e) => set("invoice_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تاريخ الاستحقاق</label>
              <input type="date" value={form.invoice_date_due} onChange={(e) => set("invoice_date_due", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">شروط الدفع</label>
              <select value={form.invoice_payment_term_id} onChange={(e) => set("invoice_payment_term_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">بدون</option>
                {paymentTerms.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">بنود الفاتورة</label>
              <button onClick={addLine} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />إضافة بند</button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/30 border-b border-border">
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">المنتج</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">الوصف</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">الحساب</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">الكمية</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">السعر</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">الضريبة</th>
                  <th className="px-2 py-2"></th>
                </tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <select value={l.product_id} onChange={(e) => handleProductSelect(i, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-32">
                          <option value="">بدون منتج...</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.default_code ? `[${p.default_code}] ` : ""}{p.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input value={l.name} onChange={(e) => setLine(i, "name", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-32" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.account_id} onChange={(e) => setLine(i, "account_id", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-32">
                          <option value="">اختر الحساب...</option>
                          {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.quantity} onChange={(e) => setLine(i, "quantity", e.target.value)}
                          className="w-16 px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.price_unit} onChange={(e) => setLine(i, "price_unit", e.target.value)}
                          className="w-20 px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none" />
                      </td>
                      <td className="px-3 py-2">
                        <select value={l.tax_id} onChange={(e) => setLine(i, "tax_id", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-24">
                          <option value="">بدون</option>
                          {purchaseTaxes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeLine(i)} className="p-1 hover:bg-red-50 text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-bold">
                    <td colSpan={4} className="px-3 py-2 text-xs text-muted-foreground">الإجمالي (غير شامل الضريبة)</td>
                    <td colSpan={3} className="px-3 py-2 text-xs text-foreground">{fmt(linesTotal)} ر.س</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.partner_id || !form.journal_id || !form.invoice_date}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── مودال تسجيل دفعة ──────────────────────────────────────────────────────────
function PaymentModal({ bill, onClose, onDone }) {
  const { toast } = useToast();
  const [journals, setJournals] = useState([]);
  const [journalId, setJournalId] = useState("");
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentMethodLineId, setPaymentMethodLineId] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPaymentJournals().then((js) => {
      setJournals(js);
      if (js.length === 1) setJournalId(String(js[0].id));
    }).catch(() => setJournals([]));
  }, []);

  useEffect(() => {
    setPaymentMethodLineId("");
    if (!journalId) { setPaymentMethods([]); return; }
    getPaymentMethodsForJournal(journalId, "outbound")
      .then((methods) => {
        setPaymentMethods(methods);
        if (methods.length === 1) setPaymentMethodLineId(String(methods[0].id));
      })
      .catch(() => setPaymentMethods([]));
  }, [journalId]);

  const submit = async () => {
    try {
      setSaving(true);
      await registerBillPayment(bill.id, {
        journal_id: Number(journalId),
        amount: amount ? Number(amount) : undefined,
        memo: memo || undefined,
        payment_method_line_id: Number(paymentMethodLineId),
      });
      toast({ title: "تم تسجيل الدفعة بنجاح ✅" });
      onDone();
    } catch (err) {
      console.error("خطأ أثناء تسجيل الدفعة:", err);
      toast({
        title: "تعذّر تسجيل الدفعة",
        description: extractErrorMessage(err),
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
            placeholder={fmt(bill.amount_residual)} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">طريقة الدفع *</label>
          <select value={paymentMethodLineId} onChange={(e) => setPaymentMethodLineId(e.target.value)}
            disabled={!journalId}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none disabled:opacity-50">
            <option value="">اختر طريقة الدفع...</option>
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
          <button onClick={submit} disabled={saving || !journalId || !paymentMethodLineId} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            {saving ? "جاري التسجيل..." : "تسجيل الدفعة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── مودال إشعار مدين ──────────────────────────────────────────────────────────
function CreditNoteModal({ bill, onClose, onDone }) {
  const { toast } = useToast();
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [journals, setJournals] = useState([]);
  const [journalId, setJournalId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getJournals().then((all) => {
      const billJournal = all.find((j) => j.id === bill.journal_id);
      setJournals(billJournal ? all.filter((j) => j.type === billJournal.type) : all);
      setJournalId(String(bill.journal_id || ""));
    }).catch(() => setJournals([]));
  }, [bill.journal_id]);

  const submit = async () => {
    try {
      setSaving(true);
      await createBillCreditNote(bill.id, {
        reason: reason.trim(),
        date,
        journal_id: Number(journalId),
      });
      toast({ title: "تم إنشاء إشعار المدين بنجاح ✅" });
      onDone();
    } catch (err) {
      console.error("خطأ أثناء إنشاء إشعار المدين:", err);
      toast({
        title: "تعذّر إنشاء إشعار المدين",
        description: extractErrorMessage(err),
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
          <h3 className="font-bold text-foreground flex items-center gap-2"><ReceiptText className="w-5 h-5 text-primary" />إنشاء إشعار مدين</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">السبب</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: بضاعة تالفة، خصم..."
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">التاريخ</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">دفتر اليومية (journal_id) *</label>
          <select value={journalId} onChange={(e) => setJournalId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
            <option value="">اختر دفتر اليومية...</option>
            {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
          </select>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={submit} disabled={saving || !journalId} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg disabled:opacity-50">
            {saving ? "جاري الإنشاء..." : "إنشاء الإشعار"}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ── عرض تفاصيل الفاتورة ───────────────────────────────────────────────────────
function BillDetail({ billId, refreshKey, onBack, onEdit, onChanged }) {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const [bill, setBill] = useState(null);
  const [loadingBill, setLoadingBill] = useState(true);
  const [tab, setTab] = useState("lines");
  const [showPayment, setShowPayment] = useState(false);
  const [showCreditNote, setShowCreditNote] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      if (!bill) setLoadingBill(true);
      const data = await getBillById(billId);
      setBill(data);
    } catch (err) {
      console.error("تعذّر تحميل الفاتورة:", err);
      toast({ title: "تعذّر تحميل الفاتورة", description: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setLoadingBill(false);
    }
  };

  useEffect(() => { load(); }, [billId, refreshKey]);

  if (loadingBill || !bill) {
    return <div className="p-6 text-center text-muted-foreground">جاري تحميل الفاتورة...</div>;
  }

  const ps = PAYMENT_STATUS[bill.payment_state] || PAYMENT_STATUS.not_paid;
  const isDraft = bill.state === "draft";
  const isCancelled = bill.state === "cancel" || bill.state === "cancelled";
  const isPosted = bill.state === "posted";
  const isFullyPaid = bill.payment_state === "paid" || bill.payment_state === "reversed";

  const run = async (fn, successMsg, errorTitle) => {
    try {
      setBusy(true);
      await fn();
      if (successMsg) toast({ title: successMsg });
      await load();
      onChanged();
    } catch (err) {
      console.error(`${errorTitle}:`, err);
      toast({
        title: errorTitle,
        description: extractErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    const ok = await confirmDialog({ title: "اعتماد الفاتورة", message: "هل أنت متأكد من اعتماد وترحيل هذه الفاتورة؟", confirmText: "اعتماد" });
    if (!ok) return;
    run(() => confirmBill(bill.id), "تم اعتماد الفاتورة بنجاح ✅", "تعذّر اعتماد الفاتورة");
  };

  const handleResetToDraft = async () => {
    const ok = await confirmDialog({ title: "إرجاع لمسودة", message: "هل تريد إرجاع هذه الفاتورة لحالة المسودة؟", confirmText: "إرجاع" });
    if (!ok) return;
    run(() => resetBillToDraft(bill.id), "تم إرجاع الفاتورة لمسودة", "تعذّر إرجاع الفاتورة لمسودة");
  };

  const handleCancel = async () => {
    const ok = await confirmDialog({ title: "إلغاء الفاتورة", message: "هل أنت متأكد من إلغاء هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.", confirmText: "إلغاء الفاتورة", variant: "destructive" });
    if (!ok) return;
    run(() => cancelBill(bill.id), "تم إلغاء الفاتورة", "تعذّر إلغاء الفاتورة");
  };

  const handlePrint = async () => {
    try {
      setBusy(true);
      await openBillPrint(bill.id);
    } catch (err) {
      console.error("تعذّر فتح الفاتورة:", err);
      toast({ title: "تعذّر فتح الفاتورة", description: extractErrorMessage(err, "حصل خطأ أثناء تحميل ملف PDF."), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    try {
      setBusy(true);
      const { blob } = await printBill(bill.id);
      downloadBlob(blob, `${bill.name || "bill"}.pdf`);
    } catch (err) {
      console.error("تعذّر تحميل الفاتورة:", err);
      toast({ title: "تعذّر تحميل الفاتورة", description: extractErrorMessage(err, "حصل خطأ أثناء تحميل ملف PDF."), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> فواتير الموردين
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{bill.name || `#${bill.id}`}</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <button onClick={() => onEdit(bill)} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
              تعديل
            </button>
          )}
          {isDraft && (
            <button onClick={handleConfirm} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
              <CheckCircle className="w-4 h-4" /> اعتماد
            </button>
          )}
          <button onClick={handlePrint} disabled={busy || !isPosted} title={!isPosted ? "لازم تعتمد الفاتورة أولاً قبل الطباعة" : undefined} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button onClick={handleDownload} disabled={busy || !isPosted} title={!isPosted ? "لازم تعتمد الفاتورة أولاً قبل تحميل PDF" : undefined} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <FileText className="w-4 h-4" /> تحميل PDF
          </button>
          {isPosted && !isFullyPaid && (
            <button onClick={() => setShowPayment(true)} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
              <CreditCard className="w-4 h-4" /> دفع
            </button>
          )}
          {isPosted && (
            <button onClick={() => setShowCreditNote(true)} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
              <ReceiptText className="w-4 h-4" /> إشعار مدين
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
        <StatusStepper status={bill.state} />
      </div>

      {/* Document card */}
      <div className="relative bg-card rounded-2xl border border-border p-6 overflow-hidden">
        <Ribbon text={ps.label} color={ps.ribbon} />

        <p className="text-sm text-muted-foreground mb-1">فاتورة مورد</p>
        <h2 className="text-3xl font-bold text-foreground mb-6">{bill.name || `#${bill.id}`}</h2>

        <div className="flex flex-wrap justify-between gap-6 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">المورد</p>
            <p className="text-sm font-medium text-foreground">{bill.partner_name}</p>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الفاتورة</p>
              <p className="text-sm font-medium text-foreground">{bill.invoice_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-foreground">{bill.invoice_date_due || "—"}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-3">
          {[
            { id: "lines", label: "بنود الفاتورة" },
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
                {(bill.invoice_line_ids || []).map((l) => (
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
            <p>مرجع الدفع: {bill.payment_reference || "—"}</p>
            <p>معرّف العملة: {bill.currency_id ?? "—"}</p>
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي غير شامل الضريبة</span>
              <span className="font-medium">ر.س {fmt(bill.amount_untaxed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الضريبة</span>
              <span className="font-medium">ر.س {fmt(bill.amount_tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>الإجمالي</span>
              <span>ر.س {fmt(bill.amount_total)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border text-primary">
              <span>المبلغ المستحق</span>
              <span>ر.س {fmt(bill.amount_residual)}</span>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal bill={bill} onClose={() => setShowPayment(false)} onDone={() => { setShowPayment(false); load(); onChanged(); }} />
      )}
      {showCreditNote && (
        <CreditNoteModal bill={bill} onClose={() => setShowCreditNote(false)} onDone={() => { setShowCreditNote(false); load(); onChanged(); }} />
      )}
    </div>
  );
}

export default function Bills() {
  const { toast } = useToast();
  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [products, setProducts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = async () => {
    try {
      setLoading(true);
      const [bls, vends, accs, taxesRes, termsRes, prods, jrnls] = await Promise.all([
        getBills(),
        getVendors().catch(() => []),
        getAccounts().catch(() => []),
        getTaxes().catch(() => []),
        getPaymentTerms().catch(() => []),
        getProducts("purchase").catch(() => []),
        getPurchaseJournals().catch(() => []),
      ]);

      setBills(bls);
      setVendors(vends);
      setTaxes(taxesRes);
      setPaymentTerms(termsRes);
      setProducts(prods);
      setJournals(jrnls);
      setAccounts(
        (accs || []).map((item) => ({
          id: item.id,
          account_code: item.code ?? item.account_code,
          account_name: item.name_ar ?? item.account_name,
          is_active: item.active ?? item.is_active,
        }))
      );
    } catch (err) {
      console.error("خطأ أثناء تحميل فواتير الموردين:", err);
      toast({
        title: "تعذّر تحميل فواتير الموردين",
        description: extractErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = bills.reduce((s, b) => s + (b.amount_untaxed || 0), 0);

  const openCreate = () => { setEditBill(null); setShowForm(true); };
  const openEditForm = (fullBill) => {
    setEditBill({ ...fullBill, lines: (fullBill.invoice_line_ids || []).map((l) => ({ ...l })) });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditBill(null); };

  if (selectedId) {
    return (
      <>
        <BillDetail
          billId={selectedId}
          refreshKey={refreshKey}
          onBack={() => setSelectedId(null)}
          onEdit={openEditForm}
          onChanged={load}
        />
        {showForm && (
          <BillForm
            bill={editBill}
            vendors={vendors}
            accounts={accounts}
            taxes={taxes}
            paymentTerms={paymentTerms}
            products={products}
            journals={journals}
            onSave={() => { closeForm(); load(); setRefreshKey((k) => k + 1); }}
            onClose={closeForm}
          />
        )}
      </>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> فواتير الموردين
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة فواتير المشتريات الواردة من الموردين</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> فاتورة جديدة
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["الرقم", "المورد", "تاريخ الفاتورة", "تاريخ الاستحقاق", "غير شامل الضريبة", "الحالة", "حالة السداد"].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
            ) : bills.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد فواتير موردين بعد</td></tr>
            ) : bills.map((b) => {
              const ps = PAYMENT_STATUS[b.payment_state] || PAYMENT_STATUS.not_paid;
              return (
                <tr key={b.id} onClick={() => setSelectedId(b.id)} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{b.name || `#${b.id}`}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{b.partner_name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.invoice_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.invoice_date_due || "—"}</td>
                  <td className="px-4 py-3 font-semibold">ر.س {fmt(b.amount_untaxed)}</td>
                  <td className="px-4 py-3"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">{STATUS_LABELS[b.state] || b.state}</span></td>
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

      {showForm && (
        <BillForm
          bill={editBill}
          vendors={vendors}
          accounts={accounts}
          taxes={taxes}
          paymentTerms={paymentTerms}
          products={products}
          journals={journals}
          onSave={() => { closeForm(); load(); }}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
