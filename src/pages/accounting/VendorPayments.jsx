import { useState, useEffect } from "react";
import {
  Plus,
  ArrowRight,
  Save,
  Search,
  Filter,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  getVouchers,
  createPaymentVoucher,
  updateVoucher,
  postVoucher,
  validateVoucher,
  markVoucherAsSent,
  unmarkVoucherAsSent,
  resetVoucherToDraft,
  cancelVoucher,
  rejectVoucher,
} from "@/api/accountingApi";
import { getVendors } from "@/api/partnersApi";
import { getPaymentJournals, getPaymentMethodsForJournal } from "@/api/accountingMetaApi";
import { extractErrorMessage } from "@/utils/errorUtils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

const STATE_LABELS = {
  draft: "مسودة",
  posted: "مرحل",
  in_process: "قيد المعالجة",
  sent: "مُرسل",
  paid: "مدفوع",
  canceled: "ملغي",
  cancelled: "ملغي",
  rejected: "مرفوض",
};

const STATE_COLORS = {
  draft: "bg-secondary text-secondary-foreground",
  posted: "bg-blue-100 text-blue-700",
  in_process: "bg-blue-100 text-blue-700",
  sent: "bg-purple-100 text-purple-700",
  paid: "bg-emerald-100 text-emerald-800",
  canceled: "bg-rose-100 text-rose-800",
  cancelled: "bg-rose-100 text-rose-800",
  rejected: "bg-rose-100 text-rose-800",
};

// ===== فورم / تفاصيل سند دفع مورد =====
function PaymentForm({ payment, vendors, journals, onBack, onSave }) {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const isEdit = Boolean(payment?.id);

  const [form, setForm] = useState({
    partner_id: payment?.partner_id ?? "",
    journal_id: payment?.journal_id ?? "",
    amount: payment?.amount ?? "",
    date: payment?.date || new Date().toISOString().slice(0, 10),
    memo: payment?.memo || "",
    payment_method_line_id: payment?.payment_method_line_id || "",
  });
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    if (!form.journal_id) { setPaymentMethods([]); return; }
    getPaymentMethodsForJournal(form.journal_id, "outbound")
      .then(setPaymentMethods)
      .catch(() => setPaymentMethods([]));
  }, [form.journal_id]);

  const handleSave = async () => {
    setError("");
    try {
      setSaving(true);

      const payload = {
        partner_id: Number(form.partner_id),
        journal_id: Number(form.journal_id),
        amount: Number(form.amount) || 0,
        date: form.date,
        memo: form.memo,
        payment_method_line_id: form.payment_method_line_id ? Number(form.payment_method_line_id) : undefined,
      };

      if (isEdit) {
        await updateVoucher(payment.id, payload);
      } else {
        await createPaymentVoucher(payload);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ سند الدفع:", err);
      setError(extractErrorMessage(err, "حصل خطأ أثناء حفظ سند الدفع، حاول تاني."));
      toast({
        title: "تعذّر حفظ سند الدفع",
        description: extractErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (fn, confirmOpts, successMsg, errorTitle) => {
    if (confirmOpts) {
      const ok = await confirmDialog(confirmOpts);
      if (!ok) return;
    }
    try {
      setBusy(true);
      await fn(payment.id);
      toast({ title: successMsg });
      onSave();
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

  const state = payment?.state;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
            <ArrowRight className="w-4 h-4" />
            دفعات الموردين
          </button>
          <span>/</span>
          <span className="text-foreground font-bold">{payment ? (payment.voucher_number || `#${payment.id}`) : "سند جديد"}</span>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !form.partner_id || !form.journal_id || !form.amount}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200">{error}</div>
      )}

      {/* Status Bar + Actions (لسند موجود بالفعل بس) */}
      {isEdit && (
        <div className="flex flex-wrap justify-between items-center gap-3 bg-card border rounded-xl p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {state === "draft" && (
              <button disabled={busy} onClick={() => runAction(postVoucher, { title: "اعتماد وترحيل السند", message: "هل أنت متأكد من اعتماد هذا السند؟", confirmText: "اعتماد" }, "تم اعتماد السند ✅", "تعذّر اعتماد السند")}
                className="px-3 py-1.5 rounded-md text-xs font-medium border bg-primary text-primary-foreground disabled:opacity-50">
                اعتماد
              </button>
            )}
            {(state === "posted" || state === "in_process") && (
              <>
                <button disabled={busy} onClick={() => runAction(validateVoucher, null, "تم التحقق من السند ✅", "تعذّر التحقق من السند")}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-50">تحقق</button>
                <button disabled={busy} onClick={() => runAction(markVoucherAsSent, null, "تم تعليم السند كمُرسل ✅", "تعذّر تعليم السند كمُرسل")}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-50">تعليم كمُرسل</button>
              </>
            )}
            {state === "sent" && (
              <button disabled={busy} onClick={() => runAction(unmarkVoucherAsSent, null, "تم إلغاء تعليم السند كمُرسل", "تعذّر إلغاء التعليم كمُرسل")}
                className="px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-50">إلغاء التعليم كمُرسل</button>
            )}
            {!["draft", "canceled", "cancelled", "rejected"].includes(state) && (
              <button disabled={busy} onClick={() => runAction(resetVoucherToDraft, { title: "إرجاع لمسودة", message: "هل تريد إرجاع هذا السند لحالة المسودة؟", confirmText: "إرجاع" }, "تم إرجاع السند لمسودة", "تعذّر إرجاع السند لمسودة")}
                className="px-3 py-1.5 rounded-md text-xs font-medium border disabled:opacity-50">إرجاع لمسودة</button>
            )}
            {!["canceled", "cancelled", "rejected"].includes(state) && (
              <>
                <button disabled={busy} onClick={() => runAction(cancelVoucher, { title: "إلغاء السند", message: "هل أنت متأكد من إلغاء هذا السند؟ لا يمكن التراجع عن هذا الإجراء.", confirmText: "إلغاء السند", variant: "destructive" }, "تم إلغاء السند", "تعذّر إلغاء السند")}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-rose-200 text-rose-700 disabled:opacity-50">إلغاء</button>
                <button disabled={busy} onClick={() => runAction(rejectVoucher, { title: "رفض السند", message: "هل أنت متأكد من رفض هذا السند؟", confirmText: "رفض", variant: "destructive" }, "تم رفض السند", "تعذّر رفض السند")}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-rose-200 text-rose-700 disabled:opacity-50">رفض</button>
              </>
            )}
          </div>

          <div className={`text-xs px-3 py-1.5 rounded-full font-semibold ${STATE_COLORS[state] || "bg-muted text-muted-foreground"}`}>
            {STATE_LABELS[state] || state}
          </div>
        </div>
      )}

      {/* Form Content */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold">{payment?.voucher_number || "سند دفع مورد جديد"}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium mb-1 block">المورد *</label>
            <select value={form.partner_id} onChange={(e) => change("partner_id", e.target.value)}
              className="w-full border rounded-lg p-2 text-sm bg-background">
              <option value="">اختر المورد...</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">دفتر اليومية *</label>
            <select value={form.journal_id} onChange={(e) => { change("journal_id", e.target.value); change("payment_method_line_id", ""); }}
              className="w-full border rounded-lg p-2 text-sm bg-background">
              <option value="">اختر دفتر اليومية...</option>
              {journals.map((j) => <option key={j.id} value={j.id}>{j.name} ({j.code})</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
            <select value={form.payment_method_line_id} onChange={(e) => change("payment_method_line_id", e.target.value)}
              disabled={!form.journal_id}
              className="w-full border rounded-lg p-2 text-sm bg-background disabled:opacity-50">
              <option value="">بدون</option>
              {paymentMethods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">المبلغ (ر.س) *</label>
            <input type="number" value={form.amount} onChange={(e) => change("amount", e.target.value)}
              className="w-full border rounded-lg p-2 text-sm bg-background" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">التاريخ</label>
            <input type="date" value={form.date} onChange={(e) => change("date", e.target.value)}
              className="w-full border rounded-lg p-2 text-sm bg-background" />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">ملاحظات (Memo)</label>
            <input value={form.memo} onChange={(e) => change("memo", e.target.value)}
              placeholder="وصف مختصر للمعاملة..." className="w-full border rounded-lg p-2 text-sm bg-background" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== قائمة دفعات الموردين =====
export default function VendorPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const [vRes, vends, jrnls] = await Promise.all([
        getVouchers(),
        getVendors().catch(() => []),
        getPaymentJournals().catch(() => []),
      ]);
      setPayments(vRes?.payment_vouchers || []);
      setVendors(vends);
      setJournals(jrnls);
      setSelected((prev) => (prev ? (vRes?.payment_vouchers || []).find((p) => p.id === prev.id) || null : prev));
    } catch (err) {
      console.error("خطأ أثناء تحميل دفعات الموردين:", err);
      toast({
        title: "تعذّر تحميل دفعات الموردين",
        description: extractErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = search
    ? payments.filter((p) => p.partner_name?.includes(search) || p.voucher_number?.includes?.(search) || p.memo?.includes(search))
    : payments;

  const totalAmount = filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const paymentsPagination = usePagination(filtered, 20);

  if (selected) {
    return (
      <PaymentForm
        payment={selected}
        vendors={vendors}
        journals={journals}
        onBack={() => setSelected(null)}
        onSave={() => { setSelected(null); load(); }}
      />
    );
  }

  if (creating) {
    return (
      <PaymentForm
        payment={null}
        vendors={vendors}
        journals={journals}
        onBack={() => setCreating(false)}
        onSave={() => { setCreating(false); load(); }}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            دفعات الموردين
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">متابعة وسداد فواتير وحركات الموردين المالية</p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium shadow hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          سند جديد
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 w-1/3 border rounded-lg px-3 py-1.5 bg-background">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الدفعات..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>{filtered.length} سند</span>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
              <th className="p-4">التاريخ</th>
              <th className="p-4">رقم السند</th>
              <th className="p-4">اليومية</th>
              <th className="p-4">البيان</th>
              <th className="p-4">المورد</th>
              <th className="p-4">المبلغ</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">جاري التحميل...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">لا توجد دفعات بعد</td></tr>
            ) : paymentsPagination.pageItems.map((payment) => (
              <tr
                key={payment.id}
                onClick={() => setSelected(payment)}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    {payment.date}
                  </div>
                </td>
                <td className="p-4 font-medium text-primary">{payment.voucher_number || "—"}</td>
                <td className="p-4">{payment.journal_name || "—"}</td>
                <td className="p-4 text-muted-foreground">{payment.memo || "—"}</td>
                <td className="p-4 font-semibold">{payment.partner_name || "—"}</td>
                <td className="p-4 font-bold text-foreground">ر.س {(payment.amount || 0).toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATE_COLORS[payment.state] || "bg-muted text-muted-foreground"}`}>
                    {STATE_LABELS[payment.state] || payment.state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={paymentsPagination.page}
          totalPages={paymentsPagination.totalPages}
          totalItems={paymentsPagination.totalItems}
          pageSize={paymentsPagination.pageSize}
          onPageChange={paymentsPagination.setPage}
        />

        <div className="p-4 bg-muted/20 border-t flex justify-between items-center font-bold text-sm">
          <span>الإجمالي الكلي:</span>
          <span className="text-primary text-base">ر.س {totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
