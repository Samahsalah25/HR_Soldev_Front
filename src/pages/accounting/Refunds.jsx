// src/pages/accounting/Refunds.jsx
import { useState, useEffect } from "react";
import {
  ReceiptText, ArrowRight, Printer, RotateCcw, CreditCard, Ban, Loader2, AlertCircle, X,
} from "lucide-react";

import {
  getBills,
  getBillById,
  confirmBill,
  resetBillToDraft,
  cancelBill,
  registerBillPayment,
  openBillPrint,
} from "../../api/billsApi";
import { getJournals, getPaymentMethodsForJournal } from "../../api/accountingMetaApi";
import { extractErrorMessage } from "../../utils/errorUtils";

const STATUS_LABELS = { draft: "مسودة", posted: "مرحل", cancel: "ملغي", cancelled: "ملغي" };

const PAYMENT_STATUS = {
  not_paid: { label: "غير مدفوع", badge: "bg-muted text-muted-foreground", ribbon: null },
  in_payment: { label: "قيد السداد", badge: "bg-amber-100 text-amber-700", ribbon: "bg-amber-500" },
  paid: { label: "مدفوع", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
  partial: { label: "مدفوع جزئيًا", badge: "bg-amber-100 text-amber-700", ribbon: "bg-amber-500" },
  reversed: { label: "معكوس", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
};

const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* دفتر يومية عام (كل الدفاتر) — لتسجيل دفعة على المرتجع */
function AllJournalsSelect({ value, onChange, label }) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getJournals().then((data) => { if (alive) { setJournals(data); setFailed(false); } })
      .catch(() => { if (alive) setFailed(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (!loading && (failed || journals.length === 0)) {
    return (
      <div>
        <label className="text-sm font-medium mb-1 block">{label}</label>
        <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder="رقم دفتر اليومية (journal_id)" className="w-full border border-border rounded-lg p-2 text-sm" />
        <p className="text-[11px] text-amber-600 mt-1">{failed ? "تعذر تحميل قايمة دفاتر اليومية من السيرفر" : "مفيش دفاتر يومية حاليًا"}</p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-border rounded-lg p-2 text-sm">
        <option value="">{loading ? "جاري التحميل..." : "اختر دفتر اليومية"}</option>
        {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
      </select>
    </div>
  );
}

function PaymentMethodSelect({ journalId, value, onChange }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    onChange("");
    if (!journalId) { setMethods([]); return; }
    let alive = true;
    setLoading(true);
    getPaymentMethodsForJournal(journalId)
      .then((data) => { if (alive) setMethods(data); })
      .catch(() => { if (alive) setMethods([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  if (!journalId) {
    return (
      <div>
        <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-2">اختر دفتر اليومية الأول عشان تظهر طرق الدفع المتاحة عليه</p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-border rounded-lg p-2 text-sm">
        <option value="">{loading ? "جاري التحميل..." : "بدون"}</option>
        {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
    </div>
  );
}

function RegisterPaymentModal({ refund, onClose, onDone }) {
  const [journalId, setJournalId] = useState("");
  const [amount, setAmount] = useState(refund.amount_residual ?? 0);
  const [memo, setMemo] = useState(`${refund.name || ""} دفعة`);
  const [paymentMethodLineId, setPaymentMethodLineId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!journalId || !amount) { setError("لازم تحدد دفتر اليومية والمبلغ"); return; }
    setSaving(true);
    setError(null);
    try {
      await registerBillPayment(refund.id, {
        journal_id: Number(journalId),
        amount: parseFloat(amount),
        memo,
        payment_method_line_id: paymentMethodLineId ? Number(paymentMethodLineId) : undefined,
      });
      onDone();
    } catch (err) {
      setError(extractErrorMessage(err, "تعذر تسجيل الدفعة"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="تسجيل دفعة على المرتجع" onClose={onClose}>
      <div className="space-y-4">
        <AllJournalsSelect value={journalId} onChange={setJournalId} label="ادفع من (journal_id) *" />
        <div>
          <label className="text-sm font-medium mb-1 block">المبلغ *</label>
          <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-border rounded-lg p-2 text-sm" />
          {refund.amount_residual != null && (
            <p className="text-[11px] text-muted-foreground mt-1">المبلغ المتبقي: ر.س {fmt(refund.amount_residual)}</p>
          )}
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">ملاحظة</label>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} className="w-full border border-border rounded-lg p-2 text-sm" />
        </div>
        <PaymentMethodSelect journalId={journalId} value={paymentMethodLineId} onChange={setPaymentMethodLineId} />
        {error && (
          <p className="text-sm text-red-600 flex items-start gap-1 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm">إلغاء</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2 disabled:opacity-60">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} تسجيل الدفعة
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ========================================================================
   عرض تفاصيل مرتجع (إشعار مدين مورد)
   ======================================================================== */
function RefundDetail({ refundId, onBack }) {
  const [refund, setRefund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("lines");
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const flashSuccess = (msg) => { setSuccessMessage(msg); setTimeout(() => setSuccessMessage(null), 4000); };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBillById(refundId);
      setRefund(data);
    } catch (err) {
      setError(extractErrorMessage(err, "تعذر تحميل المرتجع"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [refundId]);

  const runAction = async (fn, successMsg) => {
    setBusy(true);
    setActionError(null);
    try {
      await fn();
      await load();
      if (successMsg) flashSuccess(successMsg);
    } catch (err) {
      setActionError(extractErrorMessage(err, "حدث خطأ أثناء تنفيذ العملية"));
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    setActionError(null);
    try {
      await openBillPrint(refund.id);
    } catch (err) {
      setActionError(extractErrorMessage(err, "تعذر تجهيز ملف الطباعة"));
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل المرتجع...
      </div>
    );
  }

  if (error || !refund) {
    return (
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4" /> {error || "المرتجع غير موجود"}
        </div>
        <button onClick={onBack} className="mt-4 text-sm text-primary hover:underline">رجوع</button>
      </div>
    );
  }

  const ps = PAYMENT_STATUS[refund.payment_state] || PAYMENT_STATUS.not_paid;
  const isDraft = refund.state === "draft";
  const isPosted = refund.state === "posted";
  const isCancelled = refund.state === "cancel" || refund.state === "cancelled";
  const isSettled = refund.payment_state === "paid" || refund.payment_state === "reversed" || (refund.amount_residual != null && refund.amount_residual <= 0);

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> المرتجعات
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{refund.name || `#${refund.id}`}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <button onClick={() => runAction(() => confirmBill(refund.id), "تم تأكيد المرتجع")} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} تأكيد
            </button>
          )}

          <button onClick={handlePrint} disabled={printing}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-60">
            {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} طباعة
          </button>

          {isPosted && (
            <button onClick={() => setShowPayment(true)} disabled={isSettled}
              title={isSettled ? "المرتجع متسدد بالفعل" : undefined}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed">
              <CreditCard className="w-4 h-4" /> دفع
            </button>
          )}

          {isPosted && (
            <button onClick={() => runAction(() => resetBillToDraft(refund.id), "تم إرجاع المرتجع لمسودة")} disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-60">
              <RotateCcw className="w-4 h-4" /> إعادة لمسودة
            </button>
          )}

          {!isCancelled && (
            <button
              onClick={() => { if (window.confirm("متأكد من إلغاء المرتجع؟")) runAction(() => cancelBill(refund.id), "تم إلغاء المرتجع"); }}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60">
              <Ban className="w-4 h-4" /> إلغاء
            </button>
          )}
        </div>
        <StatusStepper status={refund.state} />
      </div>

      {actionError && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{actionError}</span>
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 px-4 py-2.5 rounded-lg">
          <span>✓ {successMessage}</span>
        </div>
      )}

      <div className="relative bg-card rounded-2xl border border-border p-6 overflow-hidden">
        <Ribbon text={ps.label} color={ps.ribbon} />
        <p className="text-sm text-muted-foreground mb-1">إشعار مدين مورد (مرتجع)</p>
        <h2 className="text-3xl font-bold text-foreground mb-6">{refund.name || `#${refund.id}`}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">المورد</p>
              <p className="text-sm font-medium text-foreground">{refund.partner_name || `#${refund.partner_id}`}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">مرجع الدفع</p>
              <p className="text-sm font-medium text-foreground">{refund.payment_reference || "—"}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ المرتجع</p>
              <p className="text-sm font-medium text-foreground">{refund.invoice_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-foreground">{refund.invoice_date_due || "—"}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-3">
          {[
            { id: "lines", label: "البنود" },
            { id: "journal", label: "قيود اليومية" },
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
                  {["المنتج", "الكمية", "السعر", "الإجمالي (بدون ضريبة)", "الإجمالي شامل"].map((h) => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(refund.invoice_line_ids || []).map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{l.name}</td>
                    <td className="px-4 py-2.5">{l.quantity}</td>
                    <td className="px-4 py-2.5">{fmt(l.price_unit)}</td>
                    <td className="px-4 py-2.5 font-semibold">ر.س {fmt(l.price_subtotal)}</td>
                    <td className="px-4 py-2.5 font-semibold">ر.س {fmt(l.price_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "journal" && (
          <p className="text-sm text-muted-foreground text-center py-8">قيود اليومية المرتبطة بهذا المرتجع</p>
        )}
        {tab === "other" && (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد معلومات إضافية</p>
        )}

        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي غير شامل الضريبة</span>
              <span className="font-medium">ر.س {fmt(refund.amount_untaxed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الضريبة</span>
              <span className="font-medium">ر.س {fmt(refund.amount_tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>الإجمالي</span>
              <span>ر.س {fmt(refund.amount_total)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border text-primary">
              <span>المبلغ المستحق</span>
              <span>ر.س {fmt(refund.amount_residual)}</span>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <RegisterPaymentModal
          refund={refund}
          onClose={() => setShowPayment(false)}
          onDone={() => { setShowPayment(false); load(); flashSuccess("تم تسجيل الدفعة بنجاح"); }}
        />
      )}
    </div>
  );
}

/* ========================================================================
   الصفحة الرئيسية: قائمة المرتجعات
   ملحوظة: مفيش فورم "إنشاء مرتجع من الصفر" — المرتجع بيتعمل كـ "إشعار مدين"
   من داخل فاتورة مورد موجودة (زرار "إشعار مدين" في Bills.jsx)
   ======================================================================== */
export default function Refunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBills({ type: "in_refund" });
      setRefunds(data);
    } catch (err) {
      setError(extractErrorMessage(err, "تعذر تحميل المرتجعات"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = refunds.reduce((s, r) => s + (r.amount_untaxed || 0), 0);

  if (selectedId) {
    return <RefundDetail refundId={selectedId} onBack={() => { setSelectedId(null); load(); }} />;
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-primary" /> المرتجعات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إشعارات مدين واردة من الموردين (مرتجعات / تخفيضات)</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل المرتجعات...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={load} className="underline mr-auto">إعادة المحاولة</button>
        </div>
      )}

      {!loading && !error && refunds.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          لا توجد مرتجعات حتى الآن — يتم إنشاء المرتجع كـ "إشعار مدين" من داخل فاتورة مورد موجودة
        </div>
      )}

      {!loading && !error && refunds.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الرقم", "المورد", "التاريخ", "تاريخ الاستحقاق", "غير شامل الضريبة", "الحالة", "حالة الدفع"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => {
                const ps = PAYMENT_STATUS[r.payment_state] || PAYMENT_STATUS.not_paid;
                return (
                  <tr key={r.id} onClick={() => setSelectedId(r.id)}
                    className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{r.name || `#${r.id}`}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{r.partner_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.invoice_date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.invoice_date_due || "—"}</td>
                    <td className="px-4 py-3 font-semibold">ر.س {fmt(r.amount_untaxed)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {STATUS_LABELS[r.state] || r.state}
                      </span>
                    </td>
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
      )}
    </div>
  );
}
