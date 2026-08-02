import { useState, useEffect } from "react";
import { Receipt, X, CheckCircle, Upload, ArrowDownCircle, ArrowUpCircle, Edit2 } from "lucide-react";
import {
  getVouchers,
  createReceiptVoucher,
  createPaymentVoucher,
  updateVoucher,
  postVoucher,
  validateVoucher,
  markVoucherAsSent,
  unmarkVoucherAsSent,
  resetVoucherToDraft,
  cancelVoucher,
  rejectVoucher,
  uploadVoucherAttachment,
} from "@/api/accountingApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import api from "@/api/axios";

// ملاحظة: الباك إند مش راجع قايمة documented لكل الـ states الممكنة،
// فالماب دي أفضل تخمين حسب أسامي الإجراءات المتاحة (post/validate/mark-as-sent/reset-to-draft/cancel/reject)
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
  draft: "bg-amber-100 text-amber-700",
  posted: "bg-blue-100 text-blue-700",
  in_process: "bg-blue-100 text-blue-700",
  sent: "bg-purple-100 text-purple-700",
  paid: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-600",
  cancelled: "bg-red-100 text-red-600",
  rejected: "bg-red-100 text-red-600",
};

function VoucherForm({ type, voucher, onSave, onClose }) {
  const isReceipt = type === "receipt";
  const isEdit = Boolean(voucher?.id);

  const [form, setForm] = useState({
    date: voucher?.date || new Date().toISOString().slice(0, 10),
    partner_id: voucher?.partner_id ?? "",
    journal_id: voucher?.journal_id ?? "",
    amount: voucher?.amount || 0,
    memo: voucher?.memo || "",
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (thenPost = false) => {
    setError("");
    try {
      setSaving(true);

      const payload = {
        partner_id: Number(form.partner_id),
        journal_id: Number(form.journal_id),
        amount: Number(form.amount) || 0,
        date: form.date,
        memo: form.memo,
      };

      let result;
      if (isEdit) {
        result = await updateVoucher(voucher.id, payload);
      } else if (isReceipt) {
        result = await createReceiptVoucher(payload);
      } else {
        result = await createPaymentVoucher(payload);
      }

      const voucherId = voucher?.id || result?.voucher?.id || result?.id;
      if (attachmentFile && voucherId) {
        await uploadVoucherAttachment(voucherId, attachmentFile);
      }

      if (thenPost && voucherId) {
        await postVoucher(voucherId);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ السند:", err);
      setError(err?.response?.data?.message || "حصل خطأ أثناء حفظ السند، حاول تاني.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            {isReceipt ? <ArrowDownCircle className="w-5 h-5 text-green-600" /> : <ArrowUpCircle className="w-5 h-5 text-red-600" />}
            {isEdit ? `تعديل ${isReceipt ? "سند قبض" : "سند دفع"}` : (isReceipt ? "سند قبض جديد" : "سند دفع جديد")}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تاريخ السند *</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم دفتر اليومية *</label>
              <input type="number" value={form.journal_id} onChange={e => set("journal_id", e.target.value)} dir="ltr"
                placeholder="7" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              {voucher?.journal_name && <p className="text-xs text-muted-foreground">{voucher.journal_name}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{isReceipt ? "رقم العميل (Partner ID) *" : "رقم المورد (Partner ID) *"}</label>
            <input type="number" value={form.partner_id} onChange={e => set("partner_id", e.target.value)} dir="ltr"
              placeholder="5" className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            {voucher?.partner_name && <p className="text-xs text-muted-foreground">{voucher.partner_name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">المبلغ (ريال) *</label>
            <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none text-lg font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">البيان</label>
            <textarea value={form.memo} onChange={e => set("memo", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">مرفق</label>
            {voucher?.attachment_url && !attachmentFile && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 mb-2">
                <span>📎 مرفق حالي: {voucher.attachment_name || "ملف"}</span>
                <a href={voucher.attachment_url} target="_blank" rel="noopener noreferrer" className="underline mr-auto">عرض</a>
              </div>
            )}
            {attachmentFile ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                <span>✅ {attachmentFile.name}</span>
                <button onClick={() => setAttachmentFile(null)} className="mr-auto text-red-500">✕</button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-2.5 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 text-sm text-primary">
                <Upload className="w-4 h-4" />{voucher?.attachment_url ? "استبدال المرفق" : "رفع مرفق (هيتم رفعه بعد الحفظ)"}
                <input type="file" className="hidden" onChange={e => setAttachmentFile(e.target.files[0] || null)} />
              </label>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={() => handleSave(false)} disabled={saving || !form.amount || !form.partner_id || !form.journal_id}
            className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "حفظ مسودة"}
          </button>
          <button onClick={() => handleSave(true)}
            disabled={saving || !form.amount || !form.partner_id || !form.journal_id}
            className={`flex items-center gap-2 px-5 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${isReceipt ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
            <CheckCircle className="w-4 h-4" />{saving ? "جاري الاعتماد..." : "اعتماد وترحيل"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Vouchers() {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("receipts");
  const [showForm, setShowForm] = useState(null); // "receipt" | "payment" | null
  const [editVoucher, setEditVoucher] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const confirmDialog = useConfirm();

  const load = async () => {
    try {
      setLoading(true);
      const vRes = await getVouchers();
      setReceipts(vRes?.receipt_vouchers || []);
      setPayments(vRes?.payment_vouchers || []);
    } catch (err) {
      console.error("خطأ أثناء تحميل السندات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // الباك إند مش بيرجع kpis لقائمة السندات، فبنحسبها من الـ receipts/payments نفسهم
  const CLOSED_STATES = new Set(["canceled", "cancelled", "rejected"]);
  const totalReceipts = receipts.filter(r => !CLOSED_STATES.has(r.state)).reduce((s, r) => s + (r.amount || 0), 0);
  const totalPayments = payments.filter(p => !CLOSED_STATES.has(p.state)).reduce((s, p) => s + (p.amount || 0), 0);
  const draftReceipts = receipts.filter(r => r.state === "draft").length;
  const draftPayments = payments.filter(p => p.state === "draft").length;

  const runAction = async (id, actionFn, { confirmOpts, successMsg, errorTitle } = {}) => {
    if (confirmOpts) {
      const ok = await confirmDialog(confirmOpts);
      if (!ok) return;
    }
    try {
      setActionLoadingId(id);
      await actionFn(id);
      await load();
      if (successMsg) toast({ title: successMsg });
    } catch (err) {
      console.error(`${errorTitle || "خطأ"}:`, err);
      toast({
        title: errorTitle || "تعذّر تنفيذ الإجراء",
        description: err?.response?.data?.message || "حصل خطأ أثناء الاتصال بالسيرفر، حاول تاني.",
        variant: "destructive",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePost = (id) => runAction(id, postVoucher, {
    confirmOpts: { title: "اعتماد وترحيل السند", message: "هل أنت متأكد من اعتماد هذا السند؟ سيتم إنشاء قيد محاسبي تلقائي مرتبط به.", confirmText: "اعتماد" },
    errorTitle: "تعذّر اعتماد السند",
  });

  const handleValidate = (id) => runAction(id, validateVoucher, {
    confirmOpts: { title: "تحقق من السند", message: "هل أنت متأكد من اعتماد التحقق من هذا السند؟", confirmText: "تحقق" },
    errorTitle: "تعذّر التحقق من السند",
  });

  const handleMarkSent = (id) => runAction(id, markVoucherAsSent, { errorTitle: "تعذّر تعليم السند كمُرسل" });
  const handleUnmarkSent = (id) => runAction(id, unmarkVoucherAsSent, { errorTitle: "تعذّر إلغاء تعليم السند كمُرسل" });

  const handleResetToDraft = (id) => runAction(id, resetVoucherToDraft, {
    confirmOpts: { title: "إرجاع لمسودة", message: "هل تريد إرجاع هذا السند لحالة المسودة؟", confirmText: "إرجاع" },
    errorTitle: "تعذّر إرجاع السند لمسودة",
  });

  const handleCancel = (id) => runAction(id, cancelVoucher, {
    confirmOpts: { title: "إلغاء السند", message: "هل أنت متأكد من إلغاء هذا السند؟ لا يمكن التراجع عن هذا الإجراء.", confirmText: "إلغاء السند", variant: "destructive" },
    errorTitle: "تعذّر إلغاء السند",
  });

  const handleReject = (id) => runAction(id, rejectVoucher, {
    confirmOpts: { title: "رفض السند", message: "هل أنت متأكد من رفض هذا السند؟", confirmText: "رفض", variant: "destructive" },
    errorTitle: "تعذّر رفض السند",
  });

  const openEdit = (voucher, type) => {
    setEditVoucher(voucher);
    setShowForm(type);
  };

  const openCreate = (type) => {
    setEditVoucher(null);
    setShowForm(type);
  };

  const closeForm = () => {
    setShowForm(null);
    setEditVoucher(null);
  };

  const renderTable = (items, type) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-muted/30 border-b border-border">
          {["رقم السند", "التاريخ", "الجهة", "دفتر اليومية", "المبلغ", "الحالة", "مرفق", "إجراءات"].map(h => (
            <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد سندات</td></tr>
          ) : items.map(v => (
            <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{v.voucher_number || "—"}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{v.date ? new Date(v.date).toLocaleDateString("ar-SA") : "—"}</td>
              <td className="px-4 py-3 font-medium text-foreground">{v.partner_name || "—"}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{v.journal_name || "—"}</td>
              <td className="px-4 py-3 font-bold text-foreground">{(v.amount || 0)?.toLocaleString("ar-SA")} ر.س</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[v.state] || "bg-muted text-muted-foreground"}`}>{STATE_LABELS[v.state] || v.state}</span></td>
              <td className="px-4 py-3">
                {v.attachment_url ? (
                  <a
                    href={`${api.defaults.baseURL}${v.attachment_url.replace(/^\/api\/v1/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    عرض
                  </a>
                ) : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {v.state === "draft" && (
                    <>
                      <button onClick={() => openEdit(v, type)} className="p-1.5 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/70" title="تعديل">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handlePost(v.id)} disabled={actionLoadingId === v.id}
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium disabled:opacity-50">
                        {actionLoadingId === v.id ? "..." : "اعتماد"}
                      </button>
                    </>
                  )}
                  {(v.state === "posted" || v.state === "in_process") && (
                    <>
                      <button onClick={() => handleValidate(v.id)} disabled={actionLoadingId === v.id}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 font-medium disabled:opacity-50">
                        {actionLoadingId === v.id ? "..." : "تحقق"}
                      </button>
                      <button onClick={() => handleMarkSent(v.id)} disabled={actionLoadingId === v.id}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 font-medium disabled:opacity-50">
                        {actionLoadingId === v.id ? "..." : "تعليم كمُرسل"}
                      </button>
                    </>
                  )}
                  {v.state === "sent" && (
                    <button onClick={() => handleUnmarkSent(v.id)} disabled={actionLoadingId === v.id}
                      className="px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs hover:bg-purple-100 font-medium disabled:opacity-50">
                      {actionLoadingId === v.id ? "..." : "إلغاء التعليم كمُرسل"}
                    </button>
                  )}
                  {!["draft", "canceled", "cancelled", "rejected"].includes(v.state) && (
                    <button onClick={() => handleResetToDraft(v.id)} disabled={actionLoadingId === v.id}
                      className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/70 font-medium disabled:opacity-50">
                      {actionLoadingId === v.id ? "..." : "إرجاع لمسودة"}
                    </button>
                  )}
                  {!["canceled", "cancelled", "rejected"].includes(v.state) && (
                    <>
                      <button onClick={() => handleCancel(v.id)} disabled={actionLoadingId === v.id}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium disabled:opacity-50">
                        {actionLoadingId === v.id ? "..." : "إلغاء"}
                      </button>
                      <button onClick={() => handleReject(v.id)} disabled={actionLoadingId === v.id}
                        className="px-2 py-1 bg-red-50 text-red-500 rounded text-xs hover:bg-red-100 font-medium disabled:opacity-50">
                        {actionLoadingId === v.id ? "..." : "رفض"}
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Receipt className="w-6 h-6 text-primary" />سندات القبض والدفع</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة سندات القبض والدفع مع الترحيل التلقائي</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCreate("receipt")} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            <ArrowDownCircle className="w-4 h-4" />سند قبض
          </button>
          <button onClick={() => openCreate("payment")} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            <ArrowUpCircle className="w-4 h-4" />سند دفع
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "إجمالي المقبوض", value: `${totalReceipts?.toLocaleString("ar-SA")} ر.س`, color: "text-green-600" },
          { label: "إجمالي المدفوع", value: `${totalPayments?.toLocaleString("ar-SA")} ر.س`, color: "text-red-600" },
          { label: "سندات قبض مسودة", value: draftReceipts, color: "text-amber-600" },
          { label: "سندات دفع مسودة", value: draftPayments, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { id: "receipts", label: `سندات القبض (${receipts.length})`, icon: ArrowDownCircle },
          { id: "payments", label: `سندات الدفع (${payments.length})`, icon: ArrowUpCircle },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {activeTab === "receipts" && renderTable(receipts, "receipt")}
      {activeTab === "payments" && renderTable(payments, "payment")}

      {showForm && (
        <VoucherForm
          type={showForm}
          voucher={editVoucher}
          onSave={() => { closeForm(); load(); }}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
