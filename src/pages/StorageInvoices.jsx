import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Plus, RefreshCw, Eye, CheckCircle, Clock, X, AlertCircle } from "lucide-react";
import InvoiceTemplate from "../components/storage/InvoiceTemplate";

function addMonths(dateStr, months) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

async function issueInvoice(booking, isRenewal = false) {
  const count = await base44.entities.StorageInvoice.list();
  const num = `INV-${Date.now().toString().slice(-8)}`;
  const periodStart = isRenewal ? (booking.contract_end || booking.contract_start) : booking.contract_start;
  const months = booking.contract_months || 1;
  const periodEnd = addMonths(periodStart, months);
  const subtotal = (booking.monthly_price || 0) * months;
  const vatAmount = Math.round(subtotal * 0.15);
  const total = subtotal + vatAmount;
  const due = addMonths(periodStart, 0); // due at start of period

  const inv = await base44.entities.StorageInvoice.create({
    invoice_number: num,
    booking_id: booking.id,
    booking_number: booking.booking_number,
    customer_name: booking.full_name,
    customer_email: booking.email,
    customer_phone: booking.phone,
    customer_id_number: booking.id_number || booking.commercial_reg || "",
    unit_number: booking.unit_number,
    unit_name: booking.unit_name || "",
    branch: booking.branch,
    period_start: periodStart,
    period_end: periodEnd,
    months_count: months,
    monthly_price: booking.monthly_price || 0,
    subtotal,
    vat_rate: 15,
    vat_amount: vatAmount,
    total_amount: total,
    due_date: due,
    status: "غير مدفوعة",
    is_renewal: isRenewal,
  });

  // Create receivable journal entry
  const accounts = await base44.entities.AccountChart.list();
  const receivableAcc = accounts.find(a => a.account_name?.includes("عملاء") && !a.is_parent);
  const revenueAcc = accounts.find(a => a.account_name?.includes("إيراد") && !a.is_parent);
  if (receivableAcc && revenueAcc) {
    await base44.entities.JournalEntry.create({
      entry_number: `JE-REC-${num}`,
      entry_date: periodStart,
      description: `مديونية إيجار تخزين — ${booking.full_name} — ${booking.unit_number}`,
      lines: [
        { account_id: receivableAcc.id, account_code: receivableAcc.account_code, account_name: receivableAcc.account_name, debit: total, credit: 0, description: "مديونية عميل تخزين" },
        { account_id: revenueAcc.id, account_code: revenueAcc.account_code, account_name: revenueAcc.account_name, debit: 0, credit: subtotal, description: "إيراد إيجار" },
      ],
      total_debit: total, total_credit: subtotal,
      status: "مرحل", source: "فاتورة تخزين", source_id: inv.id,
    });
  }

  // If renewal, update contract_end on booking
  if (isRenewal) {
    await base44.entities.StorageBooking.update(booking.id, { contract_end: periodEnd });
  }

  return inv;
}

export default function StorageInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewInvoice, setViewInvoice] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const load = async () => {
    const [invs, bks] = await Promise.all([
      base44.entities.StorageInvoice.list("-created_date"),
      base44.entities.StorageBooking.filter({ status: "Confirmed" }),
    ]);
    setInvoices(invs);
    setBookings(bks);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Check for bookings that need renewal (contract_end <= today and auto_renew = true)
  const checkRenewals = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const expiring = bookings.filter(b => b.auto_renew !== false && b.contract_end && b.contract_end <= today);
    for (const b of expiring) {
      // Check if renewal invoice already exists for this booking this period
      const existing = invoices.find(i => i.booking_id === b.id && i.is_renewal && i.period_start >= b.contract_end);
      if (!existing) {
        setProcessingId(b.id);
        await issueInvoice(b, true);
      }
    }
    setProcessingId(null);
    load();
    alert(`✅ تم فحص التجديدات. ${expiring.length} عقد تم مراجعته.`);
  };

  const handleIssue = async (booking) => {
    setProcessingId(booking.id);
    await issueInvoice(booking, false);
    setProcessingId(null);
    load();
  };

  const filtered = invoices.filter(i => !filterStatus || i.status === filterStatus);
  const totalUnpaid = invoices.filter(i => i.status === "غير مدفوعة").reduce((s, i) => s + i.total_amount, 0);
  const totalPaid = invoices.filter(i => i.status === "مدفوعة").reduce((s, i) => s + i.total_amount, 0);

  // Bookings without invoices
  const noInvoice = bookings.filter(b => !invoices.some(i => i.booking_id === b.id && !i.is_renewal));

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />فواتير التخزين
          </h1>
          <p className="text-sm text-muted-foreground">إدارة الفواتير وتجديد العقود</p>
        </div>
        <button onClick={checkRenewals}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary/90">
          <RefreshCw className="w-4 h-4" />فحص التجديدات التلقائية
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{invoices.length}</p>
          <p className="text-xs text-muted-foreground mt-1">إجمالي الفواتير</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{totalUnpaid.toLocaleString("ar-SA")} ر.س</p>
          <p className="text-xs text-muted-foreground mt-1">غير مدفوعة</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString("ar-SA")} ر.س</p>
          <p className="text-xs text-muted-foreground mt-1">محصَّلة</p>
        </div>
      </div>

      {/* Bookings without invoice */}
      {noInvoice.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
            <AlertCircle className="w-4 h-4" />حجوزات لم تُصدر لها فاتورة بعد
          </div>
          <div className="space-y-2">
            {noInvoice.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5">
                <div>
                  <span className="font-semibold text-sm text-foreground">{b.full_name}</span>
                  <span className="text-xs text-muted-foreground mr-2">— وحدة {b.unit_number} ({b.branch})</span>
                </div>
                <button onClick={() => handleIssue(b)} disabled={processingId === b.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" />{processingId === b.id ? "جاري الإصدار..." : "إصدار فاتورة"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {[["","الكل"],["غير مدفوعة","غير مدفوعة"],["مدفوعة","مدفوعة"],["ملغية","ملغية"]].map(([v,l]) => (
          <button key={v} onClick={() => setFilterStatus(v)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterStatus === v ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["رقم الفاتورة","العميل","الوحدة","الفترة","المبلغ","الحالة",""].map(h => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد فواتير</td></tr>
              : filtered.map(inv => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{inv.invoice_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{inv.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{inv.customer_email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{inv.unit_number}</p>
                    <p className="text-xs text-muted-foreground">{inv.branch}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{inv.period_start} — {inv.period_end}</td>
                  <td className="px-4 py-3 font-bold text-foreground">{inv.total_amount?.toLocaleString("ar-SA")} ر.س</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === "مدفوعة" ? "bg-green-100 text-green-700" : inv.status === "ملغية" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                      {inv.status} {inv.is_renewal && "🔄"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setViewInvoice(inv)} className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {viewInvoice && <InvoiceTemplate invoice={viewInvoice} onClose={() => setViewInvoice(null)} />}
    </div>
  );
}