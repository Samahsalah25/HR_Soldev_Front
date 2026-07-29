import { useState } from "react";
import {
  FileText, Plus, ArrowRight, Send, Printer, Eye, RotateCcw,
  CreditCard, ReceiptText,
} from "lucide-react";

// ===== Mock Data (فيك داتا مؤقتة لحد ما نربطها بالـ API) =====
const MOCK_INVOICES = [
  {
    id: 6,
    number: "INV/2026/00006",
    customer: "Ahmed",
    invoice_date: "2026-07-29",
    due_date: "2026-07-29",
    journal: "فواتير العملاء",
    tax_excluded: 10,
    status: "posted",
    payment_status: "reversed",
    payments_count: 0,
    lines: [
      { id: 1, product: "[EXP_GEN] Expenses", account: "400000 مبيعات المنتجات", qty: 10, price: 1, tax: "15%", amount: 10 },
    ],
    untaxed: 10, tax: 1.5, total: 11.5, amount_due: 0,
  },
  {
    id: 4,
    number: "INV/2026/00004",
    customer: "Acme Corp",
    invoice_date: "2026-07-29",
    due_date: "2026-07-29",
    journal: "فواتير العملاء",
    tax_excluded: 1,
    status: "posted",
    payment_status: "reversed",
    payments_count: 0,
    lines: [
      { id: 1, product: "[EXP_GEN] Expenses", account: "400000 مبيعات المنتجات", qty: 1, price: 1, tax: "15%", amount: 1 },
    ],
    untaxed: 1, tax: 0.15, total: 1.15, amount_due: 0,
  },
  {
    id: 5,
    number: "INV/2026/00005",
    customer: "Ahmed",
    invoice_date: "2026-07-28",
    due_date: "2026-07-28",
    journal: "فواتير العملاء",
    tax_excluded: 1500,
    status: "cancelled",
    payment_status: "cancelled",
    payments_count: 0,
    lines: [
      { id: 1, product: "[EXP_GEN] Expenses", account: "400000 مبيعات المنتجات", qty: 1500, price: 1, tax: "15%", amount: 1500 },
    ],
    untaxed: 1500, tax: 225, total: 1725, amount_due: 0,
  },
  {
    id: 3,
    number: "INV/2026/00003",
    customer: "Ahmed",
    invoice_date: "2026-07-28",
    due_date: "2026-07-28",
    journal: "فواتير العملاء",
    tax_excluded: 1,
    status: "posted",
    payment_status: "in_payment",
    payments_count: 1,
    lines: [
      { id: 1, product: "[EXP_GEN] Expenses", account: "400000 مبيعات المنتجات", qty: 1, price: 1, tax: "15%", amount: 1 },
    ],
    untaxed: 1, tax: 0.15, total: 1.15, amount_due: 1.15,
  },
];

const STATUS_LABELS = { draft: "مسودة", posted: "مرحل", cancelled: "ملغي" };

const PAYMENT_STATUS = {
  not_paid: { label: "غير مدفوع", badge: "bg-muted text-muted-foreground", ribbon: null },
  in_payment: { label: "قيد السداد", badge: "bg-amber-100 text-amber-700", ribbon: "bg-amber-500" },
  paid: { label: "مدفوع", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
  reversed: { label: "معكوس", badge: "bg-green-100 text-green-700", ribbon: "bg-green-600" },
  cancelled: { label: "ملغي", badge: "bg-muted text-muted-foreground", ribbon: null },
};

const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Ribbon({ text, color }) {
  if (!color) return null;
  return (
    <div className="absolute top-0 left-0 w-32 h-32 overflow-hidden pointer-events-none">
      <div
        className={`absolute top-6 -left-9 w-40 text-center text-white text-xs font-bold py-1 -rotate-45 shadow ${color}`}
      >
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

function InvoiceDetail({ invoice, onBack }) {
  const [tab, setTab] = useState("lines");
  const ps = PAYMENT_STATUS[invoice.payment_status] || PAYMENT_STATUS.not_paid;

  return (
    <div className="p-6 space-y-4 max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> فواتير العملاء
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{invoice.number}</span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <Send className="w-4 h-4" /> إرسال
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <Printer className="w-4 h-4" /> طباعة
          </button>
          {invoice.status === "posted" && invoice.payment_status !== "paid" && invoice.payment_status !== "reversed" && (
            <button className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <CreditCard className="w-4 h-4" /> دفع
            </button>
          )}
          <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <Eye className="w-4 h-4" /> معاينة
          </button>
          {invoice.status === "posted" && (
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
              <ReceiptText className="w-4 h-4" /> إشعار دائن
            </button>
          )}
          {invoice.status === "posted" && (
            <button className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
              <RotateCcw className="w-4 h-4" /> إعادة لمسودة
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {invoice.payments_count > 0 && (
            <span className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-muted-foreground">
              المدفوعات: {invoice.payments_count}
            </span>
          )}
          <StatusStepper status={invoice.status} />
        </div>
      </div>

      {/* Document card */}
      <div className="relative bg-card rounded-2xl border border-border p-6 overflow-hidden">
        <Ribbon text={ps.label} color={ps.ribbon} />

        <p className="text-sm text-muted-foreground mb-1">فاتورة عميل</p>
        <h2 className="text-3xl font-bold text-foreground mb-6">{invoice.number}</h2>

        <div className="flex flex-wrap justify-between gap-6 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">العميل</p>
            <p className="text-sm font-medium text-foreground">{invoice.customer}</p>
          </div>
          <div className="flex gap-10">
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الفاتورة</p>
              <p className="text-sm font-medium text-foreground">{invoice.invoice_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">تاريخ الاستحقاق</p>
              <p className="text-sm font-medium text-foreground">{invoice.due_date}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">دفتر اليومية</p>
              <p className="text-sm font-medium text-foreground">{invoice.journal}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
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
                  {["المنتج", "الحساب", "الكمية", "السعر", "الضريبة", "الإجمالي"].map((h) => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((l) => (
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
          <p className="text-sm text-muted-foreground text-center py-8">قيود اليومية المرتبطة بهذه الفاتورة</p>
        )}
        {tab === "other" && (
          <p className="text-sm text-muted-foreground text-center py-8">لا توجد معلومات إضافية</p>
        )}

        {/* Totals */}
        <div className="flex justify-end mt-6">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">الإجمالي غير شامل الضريبة</span>
              <span className="font-medium">ر.س {fmt(invoice.untaxed)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ضريبة 15%</span>
              <span className="font-medium">ر.س {fmt(invoice.tax)}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t border-border pt-2">
              <span>الإجمالي</span>
              <span>ر.س {fmt(invoice.total)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-border text-primary">
              <span>المبلغ المستحق</span>
              <span>ر.س {fmt(invoice.amount_due)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [selected, setSelected] = useState(null);
  const invoices = MOCK_INVOICES;
  const total = invoices.reduce((s, i) => s + i.tax_excluded, 0);

  if (selected) {
    return <InvoiceDetail invoice={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" /> فواتير العملاء
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة فواتير المبيعات الصادرة للعملاء</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> فاتورة جديدة
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["الرقم", "العميل", "تاريخ الفاتورة", "تاريخ الاستحقاق", "غير شامل الضريبة", "الحالة"].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const ps = PAYMENT_STATUS[inv.payment_status] || PAYMENT_STATUS.not_paid;
              return (
                <tr
                  key={inv.id}
                  onClick={() => setSelected(inv)}
                  className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{inv.number}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{inv.customer}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{inv.invoice_date}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{inv.due_date}</td>
                  <td className="px-4 py-3 font-semibold">ر.س {fmt(inv.tax_excluded)}</td>
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