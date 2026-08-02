// src/components/accounting/Bills.jsx
import { useState, useEffect } from "react";
import {
  FileText, Plus, ArrowRight, Send, Printer, Eye, RotateCcw,
  CreditCard, ReceiptText, Trash2, Cog, X, Loader2, AlertCircle, Ban,
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
  openBillPrint,
} from "../../api/billsApi";

import { getVendors } from "../../api/partnersApi";
import { getJournals, getPurchaseJournals, getPaymentTerms, getPaymentMethodsForJournal } from "../../api/accountingMetaApi";
import { extractErrorMessage } from "../../utils/errorUtils";

const TAX_OPTIONS = [
  { label: "0%", ids: [] },
  { label: "5%", ids: [2] },
  { label: "15%", ids: [1] },
];

const STATUS_LABELS = { draft: "مسودة", posted: "مرحل", cancel: "ملغي", cancelled: "ملغي" };

const PAYMENT_STATUS = {
  not_paid: { label: "غير مدفوع", badge: "bg-muted text-muted-foreground", ribbon: null },
  in_payment: { label: "قيد السداد", badge: "bg-amber-100 text-amber-700", ribbon: "bg-amber-500" },
  paid: { label: "مدفوع", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
  partial: { label: "مدفوع جزئيًا", badge: "bg-amber-100 text-amber-700", ribbon: "bg-amber-500" },
  reversed: { label: "معكوس", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
};

const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);

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
        <span
          key={s}
          className={`px-3 py-1.5 ${i > 0 ? "border-r border-border" : ""} ${
            status === s ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
          }`}
        >
          {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  );
}

/* ========================================================================
   Modal بسيط قابل لإعادة الاستخدام
   ======================================================================== */
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ========================================================================
   حقل عام لاختيار دفتر يومية من قايمة جاهزة (loader بيرجّع مصفوفة journals)
   بيعرض كود الدفتر جنب اسمه عشان يبقى واضح أكتر (زي "Vendor Bills (BILL)")
   ولو الطلب فشل بيرجع لخانة رقم يدوية عشان الفورم ميتكسرش
   ======================================================================== */
function JournalSelect({ value, onChange, label, loader, emptyHint }) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await loader();
        if (alive) {
          setJournals(data);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && (failed || journals.length === 0)) {
    return (
      <div>
        <label className="text-sm font-medium mb-1 block">{label}</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="رقم دفتر اليومية (journal_id)"
          className="w-full border border-border rounded-lg p-2 text-sm"
        />
        <p className="text-[11px] text-amber-600 mt-1">
          {failed ? "تعذر تحميل قايمة دفاتر اليومية من السيرفر" : emptyHint || "مفيش دفاتر يومية من النوع ده حاليًا"}
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded-lg p-2 text-sm"
      >
        <option value="">{loading ? "جاري التحميل..." : "اختر دفتر اليومية"}</option>
        {journals.map((j) => (
          <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
        ))}
      </select>
    </div>
  );
}

/* اختصارات جاهزة حسب نوع الدفتر المطلوب */
function PurchaseJournalSelect(props) {
  return <JournalSelect {...props} loader={getPurchaseJournals} />;
}
function AllJournalsSelect(props) {
  return <JournalSelect {...props} loader={() => getJournals()} />;
}

/* ========================================================================
   حقل اختيار طريقة الدفع — بتتغير حسب دفتر اليومية المختار (كل journal
   ليه طرق دفع مختلفة، بنجيبها من GET /accounting/journals/<id>/payment-methods)
   ======================================================================== */
function PaymentMethodSelect({ journalId, value, onChange }) {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onChange(""); // نصفّر الاختيار كل ما دفتر اليومية يتغير
    if (!journalId) {
      setMethods([]);
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getPaymentMethodsForJournal(journalId);
        if (alive) {
          setMethods(data);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId]);

  if (!journalId) {
    return (
      <div>
        <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
        <p className="text-xs text-muted-foreground border border-dashed border-border rounded-lg p-2">
          اختاري دفتر اليومية الأول عشان تظهر طرق الدفع المتاحة عليه
        </p>
      </div>
    );
  }

  if (!loading && (failed || methods.length === 0)) {
    return (
      <div>
        <label className="text-sm font-medium mb-1 block">طريقة الدفع (payment_method_line_id)</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اختياري"
          className="w-full border border-border rounded-lg p-2 text-sm"
        />
        {failed && <p className="text-[11px] text-amber-600 mt-1">تعذر تحميل طرق الدفع لدفتر اليومية ده</p>}
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded-lg p-2 text-sm"
      >
        <option value="">{loading ? "جاري التحميل..." : "اختر طريقة الدفع"}</option>
        {methods.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
    </div>
  );
}

/* ========================================================================
   حقل اختيار شروط الدفع (payment terms)
   ======================================================================== */
function PaymentTermSelect({ value, onChange }) {
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getPaymentTerms();
        if (alive) {
          setTerms(data);
          setFailed(false);
        }
      } catch {
        if (alive) setFailed(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!loading && (failed || terms.length === 0)) {
    return (
      <div>
        <label className="text-xs font-medium text-foreground block mb-1">شروط الدفع (invoice_payment_term_id)</label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اختياري"
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-[11px] text-amber-600 mt-1">تعذر تحميل شروط الدفع من السيرفر</p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium text-foreground block mb-1">شروط الدفع</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      >
        <option value="">{loading ? "جاري التحميل..." : "بدون تحديد"}</option>
        {terms.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </div>
  );
}

/* ========================================================================
   مودال تسجيل دفعة (register-payment)
   ======================================================================== */
function RegisterPaymentModal({ bill, onClose, onDone }) {
  const [journalId, setJournalId] = useState("");
  const [amount, setAmount] = useState(bill.amount_residual ?? bill.amount_due ?? 0);
  const [memo, setMemo] = useState(`${bill.name || bill.number || ""} دفعة`);
  const [paymentMethodLineId, setPaymentMethodLineId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!journalId || !amount) {
      setError("لازم تحددي دفتر اليومية والمبلغ");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await registerBillPayment(bill.id, {
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
    <Modal title="تسجيل دفعة" onClose={onClose}>
      <div className="space-y-4">
        <AllJournalsSelect value={journalId} onChange={setJournalId} label="ادفع من (journal_id) *" />

        <div>
          <label className="text-sm font-medium mb-1 block">المبلغ *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-border rounded-lg p-2 text-sm"
          />
          {bill.amount_residual != null && (
            <p className="text-[11px] text-muted-foreground mt-1">
              المبلغ المتبقي على الفاتورة: ر.س {fmt(bill.amount_residual)}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">ملاحظة</label>
          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full border border-border rounded-lg p-2 text-sm"
          />
        </div>

        <PaymentMethodSelect journalId={journalId} value={paymentMethodLineId} onChange={setPaymentMethodLineId} />

        {error && (
          <p className="text-sm text-red-600 flex items-start gap-1 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm">إلغاء</button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            تسجيل الدفعة
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ========================================================================
   مودال إشعار مدين (credit-note)
   ======================================================================== */
function CreditNoteModal({ bill, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayISO());
  const [journalId, setJournalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!journalId) {
      setError("لازم تحددي دفتر اليومية");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createBillCreditNote(bill.id, {
        reason,
        date,
        journal_id: Number(journalId),
      });
      onDone();
    } catch (err) {
      setError(extractErrorMessage(err, "تعذر إنشاء إشعار المدين"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="إنشاء إشعار مدين" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">السبب</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="مثال: بضاعة تالفة، خصم..."
            className="w-full border border-border rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">التاريخ</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-border rounded-lg p-2 text-sm"
          />
        </div>

        <PurchaseJournalSelect value={journalId} onChange={setJournalId} label="دفتر اليومية (journal_id) *" />

        {error && (
          <p className="text-sm text-red-600 flex items-start gap-1 bg-red-50 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-sm">إلغاء</button>
          <button
            onClick={submit}
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            إنشاء الإشعار
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ========================================================================
   فورم إنشاء / تعديل فاتورة مورد
   ======================================================================== */
function emptyLine(id) {
  return { id, product_id: "", account_id: "", quantity: 1, price_unit: 0, tax: "15%", amount: 0 };
}

function BillForm({ bill, onBack, onSaved }) {
  const isEdit = !!bill;
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);

  const [partnerId, setPartnerId] = useState(bill?.partner_id || "");
  const [billDate, setBillDate] = useState(bill?.invoice_date || todayISO());
  const [dueDate, setDueDate] = useState(bill?.invoice_date_due || todayISO());
  const [paymentTermId, setPaymentTermId] = useState(bill?.invoice_payment_term_id || "");
  const [journalId, setJournalId] = useState(bill?.journal_id || "");
  const [lines, setLines] = useState(
    bill?.invoice_line_ids?.length
      ? bill.invoice_line_ids.map((l, idx) => ({
          id: l.id || idx + 1,
          product_id: l.product_id || "",
          account_id: l.account_id || "",
          quantity: l.quantity || 1,
          price_unit: l.price_unit || 0,
          tax: TAX_OPTIONS.find((t) => JSON.stringify(t.ids) === JSON.stringify(l.tax_ids))?.label || "15%",
          amount: l.price_subtotal || 0,
        }))
      : [emptyLine(1)]
  );
  const [nextLineId, setNextLineId] = useState(lines.length + 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoadingVendors(true);
      try {
        const data = await getVendors();
        setVendors(data);
      } catch {
        // تجاهل، الفورم لسه شغال بإدخال يدوي
      } finally {
        setLoadingVendors(false);
      }
    })();
  }, []);

  const updateLine = (id, field, value) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === "quantity" || field === "price_unit") {
          updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.price_unit) || 0);
        }
        return updated;
      })
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine(nextLineId)]);
    setNextLineId((id) => id + 1);
  };

  const removeLine = (id) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.id !== id) : prev));
  };

  const taxAmountFor = (l) => {
    const rate = parseFloat(l.tax) / 100 || 0;
    return (parseFloat(l.amount) || 0) * rate;
  };

  const untaxed = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const tax = lines.reduce((s, l) => s + taxAmountFor(l), 0);
  const total = untaxed + tax;

  const isValid =
    !!partnerId &&
    !!journalId &&
    lines.some((l) => l.product_id && l.account_id && l.quantity > 0 && l.price_unit > 0);

  const handleSave = async () => {
    if (!isValid) {
      setError("لازم تختاري المورد، دفتر اليومية، وسطر واحد على الأقل كامل البيانات");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        partner_id: Number(partnerId),
        invoice_date: billDate,
        invoice_date_due: dueDate,
        invoice_payment_term_id: paymentTermId ? Number(paymentTermId) : undefined,
        journal_id: Number(journalId),
        invoice_line_ids: lines
          .filter((l) => l.product_id && l.account_id)
          .map((l) => ({
            product_id: Number(l.product_id),
            quantity: parseFloat(l.quantity) || 0,
            price_unit: parseFloat(l.price_unit) || 0,
            account_id: Number(l.account_id),
            tax_ids: TAX_OPTIONS.find((t) => t.label === l.tax)?.ids || [],
          })),
      };

      if (isEdit) {
        await updateBill(bill.id, payload);
      } else {
        await createBill(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err, "حدث خطأ أثناء حفظ الفاتورة"));
    } finally {
      setSaving(false);
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
        <span className="text-foreground font-medium">{isEdit ? bill.name || "تعديل فاتورة" : "فاتورة جديدة"}</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            حفظ
          </button>
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <X className="w-4 h-4" /> إلغاء
          </button>
        </div>
        <StatusStepper status="draft" />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}

      {/* Document card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">فاتورة مورد</p>
          <Cog className="w-4 h-4 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold text-muted-foreground/50 mb-6">
          {isEdit ? bill.name || "BILL/جديد" : "BILL/جديد"}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 mb-6">
          {/* يمين */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">المورد *</label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{loadingVendors ? "جاري التحميل..." : "اختر مورد"}</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            <PaymentTermSelect value={paymentTermId} onChange={setPaymentTermId} />
          </div>

          {/* شمال */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">تاريخ الفاتورة</label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">تاريخ الاستحقاق</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <PurchaseJournalSelect value={journalId} onChange={setJournalId} label="دفتر اليومية (journal_id) *" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-3">
          <span className="px-4 py-2.5 text-sm font-medium border-b-2 border-primary text-primary">بنود الفاتورة</span>
        </div>

        {/* جدول البنود القابل للتعديل */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["المنتج (product_id)", "الحساب (account_id)", "الكمية", "السعر", "الضريبة", "الإجمالي", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={l.product_id}
                      onChange={(e) => updateLine(l.id, "product_id", e.target.value)}
                      placeholder="رقم المنتج"
                      className="w-24 px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      value={l.account_id}
                      onChange={(e) => updateLine(l.id, "account_id", e.target.value)}
                      placeholder="رقم الحساب"
                      className="w-24 px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      value={l.quantity}
                      onChange={(e) => updateLine(l.id, "quantity", e.target.value)}
                      className="w-20 px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.price_unit}
                      onChange={(e) => updateLine(l.id, "price_unit", e.target.value)}
                      className="w-24 px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={l.tax}
                      onChange={(e) => updateLine(l.id, "tax", e.target.value)}
                      className="px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-xs focus:outline-none"
                    >
                      {TAX_OPTIONS.map((t) => <option key={t.label} value={t.label}>{t.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-1.5 font-semibold whitespace-nowrap">ر.س {fmt(l.amount)}</td>
                  <td className="px-2 py-1.5">
                    <button
                      onClick={() => removeLine(l.id)}
                      className="text-muted-foreground hover:text-red-600"
                      title="حذف السطر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-4 px-4 py-2.5 text-xs text-primary font-medium">
            <button onClick={addLine} className="hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> إضافة سطر
            </button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground mt-2">
          * حقول المنتج/الحساب بأرقام IDs مؤقتًا لحد ما تتوفر endpoints لجلب القوائم (منتجات، حسابات)
        </p>

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي غير شامل الضريبة</span>
              <span className="font-medium">ر.س {fmt(untaxed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الضريبة</span>
              <span className="font-medium">ر.س {fmt(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>الإجمالي</span>
              <span>ر.س {fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   عرض تفاصيل فاتورة موجودة
   ======================================================================== */
function BillDetail({ billId, onBack, onEdit }) {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("lines");
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showCreditNote, setShowCreditNote] = useState(false);

  const flashSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBillById(billId);
      setBill(data);
    } catch (err) {
      setError(extractErrorMessage(err, "تعذر تحميل الفاتورة"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [billId]);

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
      await openBillPrint(bill.id);
    } catch (err) {
      setActionError(extractErrorMessage(err, "تعذر تجهيز ملف الطباعة"));
    } finally {
      setPrinting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل الفاتورة...
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="p-6 max-w-5xl mx-auto" dir="rtl">
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4" /> {error || "الفاتورة غير موجودة"}
        </div>
        <button onClick={onBack} className="mt-4 text-sm text-primary hover:underline">رجوع</button>
      </div>
    );
  }

  const ps = PAYMENT_STATUS[bill.payment_state] || PAYMENT_STATUS.not_paid;
  const isDraft = bill.state === "draft";
  const isPosted = bill.state === "posted";
  const isCancelled = bill.state === "cancel" || bill.state === "cancelled";
  const isSettled =
    bill.payment_state === "paid" ||
    bill.payment_state === "reversed" ||
    (bill.amount_residual != null && bill.amount_residual <= 0);

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> فواتير الموردين
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{bill.name || `#${bill.id}`}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {isDraft && (
            <>
              <button
                onClick={() => runAction(() => confirmBill(bill.id), "تم تأكيد الفاتورة")}
                disabled={busy}
                className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-60"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />} تأكيد
              </button>
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"
              >
                تعديل
              </button>
            </>
          )}

          <button
            onClick={handlePrint}
            disabled={printing}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-60"
          >
            {printing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} طباعة
          </button>

          {isPosted && (
            <button
              onClick={() => setShowPayment(true)}
              disabled={isSettled}
              title={isSettled ? "الفاتورة متسددة بالفعل أو اتعمللها إشعار مدين" : undefined}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4" /> دفع
            </button>
          )}

          {isPosted && (
            <button
              onClick={() => setShowCreditNote(true)}
              disabled={isSettled}
              title={isSettled ? "اتعمل إشعار مدين للفاتورة دي بالفعل، أو مفيش مبلغ متبقي" : undefined}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ReceiptText className="w-4 h-4" /> إشعار مدين
            </button>
          )}

          {isPosted && (
            <button
              onClick={() => runAction(() => resetBillToDraft(bill.id), "تم إرجاع الفاتورة لمسودة")}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-60"
            >
              <RotateCcw className="w-4 h-4" /> إعادة لمسودة
            </button>
          )}

          {!isCancelled && (
            <button
              onClick={() => {
                if (window.confirm("متأكدة من إلغاء الفاتورة؟")) {
                  runAction(() => cancelBill(bill.id), "تم إلغاء الفاتورة");
                }
              }}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60"
            >
              <Ban className="w-4 h-4" /> إلغاء الفاتورة
            </button>
          )}
        </div>
        <StatusStepper status={bill.state} />
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
        <p className="text-sm text-muted-foreground mb-1">فاتورة مورد</p>
        <h2 className="text-3xl font-bold text-foreground mb-6">{bill.name || `#${bill.id}`}</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">المورد</p>
              <p className="text-sm font-medium text-foreground">{bill.partner_name || `#${bill.partner_id}`}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">مرجع الدفع</p>
              <p className="text-sm font-medium text-foreground">{bill.payment_reference || "—"}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الفاتورة</p>
              <p className="text-sm font-medium text-foreground">{bill.invoice_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-foreground">{bill.invoice_date_due}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-1 border-b border-border mb-3">
          {[
            { id: "lines", label: "بنود الفاتورة" },
            { id: "journal", label: "قيود اليومية" },
            { id: "other", label: "معلومات إضافية" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
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
                {(bill.invoice_line_ids || []).map((l) => (
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
          <p className="text-sm text-muted-foreground text-center py-8">قيود اليومية المرتبطة بهذه الفاتورة</p>
        )}
        {tab === "other" && (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد معلومات إضافية</p>
        )}

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
        <RegisterPaymentModal
          bill={bill}
          onClose={() => setShowPayment(false)}
          onDone={() => { setShowPayment(false); load(); flashSuccess("تم تسجيل الدفعة بنجاح"); }}
        />
      )}
      {showCreditNote && (
        <CreditNoteModal
          bill={bill}
          onClose={() => setShowCreditNote(false)}
          onDone={() => { setShowCreditNote(false); load(); flashSuccess("تم إنشاء إشعار المدين بنجاح"); }}
        />
      )}
    </div>
  );
}

/* ========================================================================
   الصفحة الرئيسية: List + New + Detail
   ======================================================================== */
export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingBill, setEditingBill] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBills();
      setBills(data);
    } catch (err) {
      setError(extractErrorMessage(err, "تعذر تحميل فواتير الموردين"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = bills.reduce((s, b) => s + (b.amount_untaxed || 0), 0);

  const handleSaved = () => {
    setCreating(false);
    setEditingBill(null);
    setSelectedId(null);
    load();
  };

  if (creating) {
    return <BillForm onBack={() => setCreating(false)} onSaved={handleSaved} />;
  }

  if (editingBill) {
    return <BillForm bill={editingBill} onBack={() => setEditingBill(null)} onSaved={handleSaved} />;
  }

  if (selectedId) {
    return (
      <BillDetail
        billId={selectedId}
        onBack={() => setSelectedId(null)}
        onEdit={async () => {
          const full = await getBillById(selectedId);
          setEditingBill(full);
          setSelectedId(null);
        }}
      />
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
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> فاتورة جديدة
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل الفواتير...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={load} className="underline mr-auto">إعادة المحاولة</button>
        </div>
      )}

      {!loading && !error && bills.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">لا توجد فواتير موردين حتى الآن</div>
      )}

      {!loading && !error && bills.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الرقم", "المورد", "تاريخ الفاتورة", "تاريخ الاستحقاق", "غير شامل الضريبة", "الحالة", "حالة الدفع"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => {
                const ps = PAYMENT_STATUS[b.payment_state] || PAYMENT_STATUS.not_paid;
                return (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedId(b.id)}
                    className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{b.name || `#${b.id}`}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{b.partner_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.invoice_date}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.invoice_date_due}</td>
                    <td className="px-4 py-3 font-semibold">ر.س {fmt(b.amount_untaxed)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        {STATUS_LABELS[b.state] || b.state}
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