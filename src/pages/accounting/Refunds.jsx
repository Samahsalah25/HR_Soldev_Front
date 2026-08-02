// src/components/accounting/Refunds.jsx
import { useState } from "react";
import {
  ReceiptText, Plus, ArrowRight, Send, Printer, Eye, RotateCcw, Trash2, Cog, X,
} from "lucide-react";

// ===== Mock Data =====
const MOCK_VENDORS = ["شركة التوريدات الحديثة", "مؤسسة النقل السريع", "شركة الخليج للمعدات"];
const MOCK_PRODUCTS = ["[RAW_MAT] مواد خام", "[SRV_TRN] خدمة نقل", "[EXP_GEN] مصروفات عامة"];
const MOCK_JOURNALS = ["فواتير الموردين", "فواتير الموردين - فرع جدة"];
const TAX_OPTIONS = ["0%", "5%", "15%"];

const MOCK_REFUNDS = [
  {
    id: 1,
    number: "RBILL/2026/07/0001",
    vendor: "شركة التوريدات الحديثة",
    bill_reference: "",
    reversal_of: "BILL/2026/07/0001",
    reason: "بضاعة تالفة",
    bill_date: "2026-07-30",
    accounting_date: "2026-07-30",
    due_date: "2026-07-30",
    payment_reference: "",
    recipient_bank: "",
    payment_terms: "",
    journal: "فواتير الموردين",
    status: "posted",
    payment_status: "paid",
    lines: [
      { id: 1, product: "[RAW_MAT] مواد خام", asset_category: "-", account: "500000 تكلفة المشتريات", qty: 5, price: 5, tax: "15%", amount: 25 },
    ],
    untaxed: 25, tax: 3.75, total: 28.75, amount_due: 0, paid_on: "2026-07-30",
  },
  {
    id: 2,
    number: "/",
    vendor: "مؤسسة النقل السريع",
    bill_reference: "",
    reversal_of: null,
    bill_date: "2026-07-25",
    accounting_date: "2026-07-25",
    due_date: "",
    payment_reference: "",
    recipient_bank: "",
    payment_terms: "",
    journal: "فواتير الموردين",
    status: "cancelled",
    payment_status: "cancelled",
    lines: [
      { id: 1, product: "[SRV_TRN] خدمة نقل", asset_category: "-", account: "510000 مصاريف نقل", qty: 1, price: 50, tax: "15%", amount: 50 },
    ],
    untaxed: 50, tax: 7.5, total: 57.5, amount_due: 0, paid_on: null,
  },
];

const STATUS_LABELS = { draft: "مسودة", posted: "مرحل", cancelled: "ملغي" };

const PAYMENT_STATUS = {
  not_paid: { label: "غير مدفوع", badge: "bg-muted text-muted-foreground", ribbon: null },
  paid: { label: "مدفوع", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
  cancelled: { label: "ملغي", badge: "bg-muted text-muted-foreground", ribbon: null },
};

const fmt = (n) => Math.abs(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const todayISO = () => new Date().toISOString().slice(0, 10);
const taxRate = (t) => parseFloat(t) / 100 || 0;

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
  if (status === "cancelled") {
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
   فورم إنشاء إشعار دائن مورد (زي فورم الأودو في الصورة)
   ======================================================================== */
function emptyLine(id) {
  return { id, product: "", account: "", qty: 1, price: 0, tax: "15%", amount: 0 };
}

function RefundForm({ onBack, onSave }) {
  const [vendor, setVendor] = useState("");
  const [billReference, setBillReference] = useState("");
  const [billDate, setBillDate] = useState(todayISO());
  const [accountingDate, setAccountingDate] = useState(todayISO());
  const [paymentReference, setPaymentReference] = useState("");
  const [recipientBank, setRecipientBank] = useState("");
  const [dueDate, setDueDate] = useState(todayISO());
  const [paymentTerms, setPaymentTerms] = useState("");
  const [journal, setJournal] = useState(MOCK_JOURNALS[0]);
  const [lines, setLines] = useState([emptyLine(1)]);
  const [nextLineId, setNextLineId] = useState(2);

  const updateLine = (id, field, value) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        if (field === "qty" || field === "price") {
          updated.amount = (parseFloat(updated.qty) || 0) * (parseFloat(updated.price) || 0);
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

  const untaxed = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0), 0);
  const tax = lines.reduce((s, l) => s + (parseFloat(l.amount) || 0) * taxRate(l.tax), 0);
  const total = untaxed + tax;

  const isValid = vendor.trim() !== "" && lines.some((l) => l.product.trim() !== "" && l.amount > 0);

  const handleSave = () => {
    if (!isValid) return;
    const newRefund = {
      id: Date.now(),
      number: `RBILL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/DRAFT`,
      vendor,
      bill_reference: billReference,
      reversal_of: null,
      bill_date: billDate,
      accounting_date: accountingDate,
      due_date: dueDate,
      payment_reference: paymentReference,
      recipient_bank: recipientBank,
      payment_terms: paymentTerms,
      journal,
      status: "draft",
      payment_status: "not_paid",
      lines: lines
        .filter((l) => l.product.trim() !== "")
        .map((l) => ({ ...l, account: l.account || "500000 تكلفة المشتريات" })),
      untaxed,
      tax,
      total,
      amount_due: total,
      paid_on: null,
    };
    onSave(newRefund);
  };

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> المرتجعات
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">إشعار دائن جديد</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            تأكيد
          </button>
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <X className="w-4 h-4" /> إلغاء
          </button>
        </div>
        <StatusStepper status="draft" />
      </div>

      {/* Document card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-muted-foreground">إشعار دائن مورد</p>
          <button className="text-muted-foreground hover:text-foreground" title="إعدادات">
            <Cog className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-3xl font-bold text-muted-foreground/50 mb-6">
          RBILL/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, "0")}/جديد
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 mb-6">
          {/* يمين */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">المورد *</label>
              <input
                list="vendors-list"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="ابحث بالاسم أو الرقم الضريبي..."
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <datalist id="vendors-list">
                {MOCK_VENDORS.map((v) => <option key={v} value={v} />)}
              </datalist>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">مرجع الفاتورة</label>
              <input
                value={billReference}
                onChange={(e) => setBillReference(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
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
              <label className="text-xs font-medium text-foreground block mb-1">تاريخ الترحيل المحاسبي</label>
              <input
                type="date"
                value={accountingDate}
                onChange={(e) => setAccountingDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                مرجع الدفع <span className="text-muted-foreground" title="مرجع يظهر في كشف الحساب البنكي">؟</span>
              </label>
              <input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="استخدام مرجع الفاتورة"
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">
                حساب المستلم <span className="text-muted-foreground" title="الحساب البنكي الذي سيُحوّل إليه المبلغ">؟</span>
              </label>
              <input
                value={recipientBank}
                onChange={(e) => setRecipientBank(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-medium text-foreground block mb-1">تاريخ الاستحقاق</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-end pb-2.5 text-xs text-muted-foreground">أو</div>
              <div className="flex-1">
                <label className="text-xs font-medium text-foreground block mb-1">شروط الدفع</label>
                <input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  placeholder="—"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">دفتر اليومية</label>
              <select
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MOCK_JOURNALS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
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
                {["المنتج", "الكمية", "السعر", "الضريبة", "الإجمالي", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-2 py-1.5">
                    <input
                      list="products-list"
                      value={l.product}
                      onChange={(e) => updateLine(l.id, "product", e.target.value)}
                      placeholder="اختر منتج..."
                      className="w-full px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      value={l.qty}
                      onChange={(e) => updateLine(l.id, "qty", e.target.value)}
                      className="w-20 px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={l.price}
                      onChange={(e) => updateLine(l.id, "price", e.target.value)}
                      className="w-24 px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-sm focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <select
                      value={l.tax}
                      onChange={(e) => updateLine(l.id, "tax", e.target.value)}
                      className="px-2 py-1.5 border border-transparent hover:border-border focus:border-border rounded text-xs focus:outline-none"
                    >
                      {TAX_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
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
          <datalist id="products-list">
            {MOCK_PRODUCTS.map((p) => <option key={p} value={p} />)}
          </datalist>
          <div className="flex gap-4 px-4 py-2.5 text-xs text-primary font-medium">
            <button onClick={addLine} className="hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> إضافة سطر
            </button>
            <button className="hover:underline">+ إضافة قسم</button>
            <button className="hover:underline">+ إضافة ملاحظة</button>
            <button className="hover:underline">الكتالوج</button>
          </div>
        </div>

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

        {!isValid && (
          <p className="text-xs text-amber-600 mt-4">* لازم تختاري المورد وتضيفي سطر واحد على الأقل بمنتج وقيمة أكبر من صفر.</p>
        )}
      </div>
    </div>
  );
}

/* ========================================================================
   عرض تفاصيل إشعار موجود
   ======================================================================== */
function RefundDetail({ note, onBack }) {
  const [tab, setTab] = useState("lines");
  const ps = PAYMENT_STATUS[note.payment_status] || PAYMENT_STATUS.not_paid;

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> المرتجعات
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">
          {note.number}
          {note.reversal_of && (
            <span className="text-muted-foreground font-normal">
              {" "}(إشعار عكسي لـ {note.reversal_of}{note.reason ? `، ${note.reason}` : ""})
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {note.status === "draft" && (
            <button className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              تأكيد
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <Send className="w-4 h-4" /> إرسال
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <Eye className="w-4 h-4" /> معاينة
          </button>
          {note.status === "posted" && (
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
              <RotateCcw className="w-4 h-4" /> إعادة لمسودة
            </button>
          )}
        </div>
        <StatusStepper status={note.status} />
      </div>

      <div className="relative bg-card rounded-2xl border border-border p-6 overflow-hidden">
        <Ribbon text={ps.label} color={ps.ribbon} />

        <p className="text-sm text-muted-foreground mb-1">إشعار دائن مورد</p>
        <h2 className="text-3xl font-bold text-foreground mb-6">{note.number}</h2>

        <div className="flex flex-wrap justify-between gap-6 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">المورد</p>
            <p className="text-sm font-medium text-foreground">{note.vendor}</p>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الفاتورة</p>
              <p className="text-sm font-medium text-foreground">{note.bill_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-foreground">{note.due_date || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">دفتر اليومية</p>
              <p className="text-sm font-medium text-foreground">{note.journal}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-3">
          {[
            { id: "lines", label: "بنود الإشعار" },
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
                  {["المنتج", "الحساب", "الكمية", "السعر", "الضريبة", "الإجمالي"].map((h) => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {note.lines.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{l.product}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.account}</td>
                    <td className="px-4 py-2.5">{l.qty}</td>
                    <td className="px-4 py-2.5">{fmt(l.price)}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{l.tax}</span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold">ر.س {fmt(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "journal" && (
          <p className="text-sm text-muted-foreground text-center py-8">قيود اليومية المرتبطة بهذا الإشعار</p>
        )}
        {tab === "other" && (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد معلومات إضافية</p>
        )}

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي غير شامل الضريبة</span>
              <span className="font-medium">ر.س {fmt(note.untaxed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ضريبة 15%</span>
              <span className="font-medium">ر.س {fmt(note.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>الإجمالي</span>
              <span>ر.س {fmt(note.total)}</span>
            </div>
            {note.paid_on && (
              <div className="flex justify-between text-xs text-muted-foreground pt-1">
                <span>مدفوع بتاريخ {note.paid_on}</span>
                <span>ر.س {fmt(note.total)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border text-primary">
              <span>المبلغ المستحق</span>
              <span>ر.س {fmt(note.amount_due)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================
   الصفحة الرئيسية: List + New + Detail
   ======================================================================== */
export default function Refunds() {
  const [refunds, setRefunds] = useState(MOCK_REFUNDS);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const total = refunds.reduce((s, n) => s + n.untaxed, 0);

  const handleSaveNew = (newRefund) => {
    setRefunds((prev) => [newRefund, ...prev]);
    setCreating(false);
    setSelected(newRefund);
  };

  if (creating) {
    return <RefundForm onBack={() => setCreating(false)} onSave={handleSaveNew} />;
  }

  if (selected) {
    return <RefundDetail note={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-primary" /> المرتجعات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إشعارات دائن واردة من الموردين (مرتجعات / تخفيضات)</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> إشعار جديد
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["الرقم", "المورد", "تاريخ الفاتورة", "تاريخ الاستحقاق", "غير شامل الضريبة", "الحالة"].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {refunds.map((n) => {
              const ps = PAYMENT_STATUS[n.payment_status] || PAYMENT_STATUS.not_paid;
              return (
                <tr
                  key={n.id}
                  onClick={() => setSelected(n)}
                  className={`border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer ${
                    n.status === "cancelled" ? "text-muted-foreground" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{n.number}</td>
                  <td className="px-4 py-3 font-medium">{n.vendor}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{n.bill_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{n.due_date || "—"}</td>
                  <td className="px-4 py-3 font-semibold">ر.س {fmt(n.untaxed)}</td>
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
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}