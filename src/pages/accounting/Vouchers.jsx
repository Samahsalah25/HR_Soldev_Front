// import { useState, useEffect } from "react";
// import { Receipt, X, CheckCircle, Upload, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
// import { base44 } from "@/api/base44Client";

// const STATUS_COLORS = {
//   "مسودة": "bg-amber-100 text-amber-700",
//   "معتمد": "bg-green-100 text-green-700",
//   "ملغي": "bg-red-100 text-red-600",
// };

// function VoucherForm({ type, accounts, onSave, onClose }) {
//   const isReceipt = type === "receipt";
//   const [form, setForm] = useState({
//     voucher_date: new Date().toISOString().slice(0, 10),
//     payer_name: "", payee_name: "",
//     from_account_id: "", from_account_code: "", from_account_name: "",
//     to_account_id: "", to_account_code: "", to_account_name: "",
//     amount: 0, payment_method: "نقداً", description: "", reference: "", attachment_url: "",
//   });
//   const [saving, setSaving] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

//   const cashBankAccounts = accounts.filter(a => a.is_active && !a.is_parent &&
//     (a.account_category === "أصول متداولة" || a.account_name?.includes("نقد") || a.account_name?.includes("بنك") || a.account_name?.includes("صندوق")));

//   const handleAccSelect = (prefix, id) => {
//     const acc = accounts.find(a => a.id === id);
//     if (acc) { set(`${prefix}_account_id`, id); set(`${prefix}_account_code`, acc.account_code); set(`${prefix}_account_name`, acc.account_name); }
//   };

//   const handleUpload = async (e) => {
//     const file = e.target.files[0]; if (!file) return;
//     setUploading(true);
//     const { file_url } = await base44.integrations.Core.UploadFile({ file });
//     set("attachment_url", file_url);
//     setUploading(false);
//   };

//   const handleSave = async (approve = false) => {
//     setSaving(true);
//     const vNum = `${isReceipt ? "RV" : "PV"}-${Date.now().toString().slice(-6)}`;
//     const Entity = isReceipt ? base44.entities.ReceiptVoucher : base44.entities.PaymentVoucher;
//     const voucher = await Entity.create({ ...form, voucher_number: vNum, status: approve ? "معتمد" : "مسودة" });

//     if (approve) {
//       const user = await base44.auth.me();
//       // Create automatic journal entry
//       const lines = isReceipt
//         ? [
//             { account_id: form.to_account_id, account_code: form.to_account_code, account_name: form.to_account_name, debit: form.amount, credit: 0, description: form.description },
//             { account_id: form.from_account_id, account_code: form.from_account_code, account_name: form.from_account_name, debit: 0, credit: form.amount, description: form.description },
//           ]
//         : [
//             { account_id: form.to_account_id, account_code: form.to_account_code, account_name: form.to_account_name, debit: form.amount, credit: 0, description: form.description },
//             { account_id: form.from_account_id, account_code: form.from_account_code, account_name: form.from_account_name, debit: 0, credit: form.amount, description: form.description },
//           ];

//       const entry = await base44.entities.JournalEntry.create({
//         entry_number: `JE-${vNum}`,
//         entry_date: form.voucher_date,
//         description: `${isReceipt ? "سند قبض" : "سند دفع"}: ${isReceipt ? form.payer_name : form.payee_name} — ${form.description}`,
//         lines,
//         total_debit: form.amount,
//         total_credit: form.amount,
//         status: "مرحل",
//         source: isReceipt ? "سند قبض" : "سند دفع",
//         source_id: voucher.id,
//         posted_by: user.full_name || user.email,
//         posted_date: new Date().toISOString().slice(0, 10),
//       });
//       await Entity.update(voucher.id, { journal_entry_id: entry.id });
//     }
//     onSave();
//   };

//   const allAccounts = accounts.filter(a => a.is_active && !a.is_parent);

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
//       <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-border">
//           <h3 className="font-bold flex items-center gap-2">
//             {isReceipt ? <ArrowDownCircle className="w-5 h-5 text-green-600" /> : <ArrowUpCircle className="w-5 h-5 text-red-600" />}
//             {isReceipt ? "سند قبض جديد" : "سند دفع جديد"}
//           </h3>
//           <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium">تاريخ السند *</label>
//               <input type="date" value={form.voucher_date} onChange={e => set("voucher_date", e.target.value)}
//                 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
//             </div>
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium">طريقة الدفع</label>
//               <select value={form.payment_method} onChange={e => set("payment_method", e.target.value)}
//                 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
//                 {["نقداً","تحويل بنكي","شيك","بطاقة ائتمان"].map(m => <option key={m}>{m}</option>)}
//               </select>
//             </div>
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">{isReceipt ? "اسم العميل / الجهة *" : "اسم المورد / الجهة *"}</label>
//             <input value={isReceipt ? form.payer_name : form.payee_name}
//               onChange={e => set(isReceipt ? "payer_name" : "payee_name", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">{isReceipt ? "الحساب المستلم منه (حساب العميل) *" : "الحساب المدفوع له (المورد/المصروف) *"}</label>
//             <select value={form.from_account_id} onChange={e => handleAccSelect("from", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
//               <option value="">اختر الحساب...</option>
//               {allAccounts.map(a => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
//             </select>
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">حساب الصندوق / البنك *</label>
//             <select value={form.to_account_id} onChange={e => handleAccSelect("to", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
//               <option value="">اختر حساب الصندوق/البنك...</option>
//               {(cashBankAccounts.length > 0 ? cashBankAccounts : allAccounts).map(a => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
//             </select>
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">المبلغ (ريال) *</label>
//             <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none text-lg font-bold" />
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">الوصف</label>
//             <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">مرفق</label>
//             {form.attachment_url ? (
//               <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
//                 <span>✅ مرفق</span>
//                 <a href={form.attachment_url} target="_blank" rel="noopener noreferrer" className="underline">عرض</a>
//                 <button onClick={() => set("attachment_url", "")} className="mr-auto text-red-500">✕</button>
//               </div>
//             ) : (
//               <label className="flex items-center gap-2 p-2.5 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 text-sm text-primary">
//                 <Upload className="w-4 h-4" />{uploading ? "جاري الرفع..." : "رفع مرفق"}
//                 <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
//               </label>
//             )}
//           </div>
//         </div>
//         <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
//           <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
//           <button onClick={() => handleSave(false)} disabled={saving || !form.amount}
//             className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium disabled:opacity-50">حفظ مسودة</button>
//           <button onClick={() => handleSave(true)}
//             disabled={saving || !form.amount || !form.from_account_id || !form.to_account_id || !(isReceipt ? form.payer_name : form.payee_name)}
//             className={`flex items-center gap-2 px-5 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${isReceipt ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
//             <CheckCircle className="w-4 h-4" />اعتماد وترحيل
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function Vouchers() {
//   const [receipts, setReceipts] = useState([]);
//   const [payments, setPayments] = useState([]);
//   const [accounts, setAccounts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("receipts");
//   const [showForm, setShowForm] = useState(null);

//   const load = async () => {
//     const [rs, ps, accs] = await Promise.all([
//       base44.entities.ReceiptVoucher.list("-voucher_date"),
//       base44.entities.PaymentVoucher.list("-voucher_date"),
//       base44.entities.AccountChart.list("account_code"),
//     ]);
//     setReceipts(rs); setPayments(ps); setAccounts(accs); setLoading(false);
//   };
//   useEffect(() => { load(); }, []);

//   const cancel = async (entity, id) => {
//     await entity.update(id, { status: "ملغي" });
//     load();
//   };

//   const renderTable = (items, entity) => (
//     <div className="bg-card rounded-xl border border-border overflow-hidden">
//       <table className="w-full text-sm">
//         <thead><tr className="bg-muted/30 border-b border-border">
//           {["رقم السند","التاريخ","الجهة","المبلغ","طريقة الدفع","الحالة","قيد مرتبط","إلغاء"].map(h => (
//             <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
//           ))}
//         </tr></thead>
//         <tbody>
//           {loading ? <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
//             : items.length === 0 ? <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد سندات</td></tr>
//             : items.map(v => (
//               <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
//                 <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{v.voucher_number}</td>
//                 <td className="px-4 py-3 text-xs text-muted-foreground">{v.voucher_date ? new Date(v.voucher_date).toLocaleDateString("ar-SA") : "—"}</td>
//                 <td className="px-4 py-3 font-medium text-foreground">{v.payer_name || v.payee_name}</td>
//                 <td className="px-4 py-3 font-bold text-foreground">{v.amount?.toLocaleString("ar-SA")} ر.س</td>
//                 <td className="px-4 py-3 text-xs text-muted-foreground">{v.payment_method}</td>
//                 <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status]}`}>{v.status}</span></td>
//                 <td className="px-4 py-3">{v.journal_entry_id ? <span className="text-xs text-green-600">✓ مرتبط</span> : "—"}</td>
//                 <td className="px-4 py-3">
//                   {v.status !== "ملغي" && (
//                     <button onClick={() => cancel(entity, v.id)} className="text-xs text-red-600 hover:underline">إلغاء</button>
//                   )}
//                 </td>
//               </tr>
//             ))}
//         </tbody>
//       </table>
//     </div>
//   );

//   return (
//     <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Receipt className="w-6 h-6 text-primary" />سندات القبض والدفع</h1>
//           <p className="text-sm text-muted-foreground mt-0.5">إدارة سندات القبض والدفع مع الترحيل التلقائي</p>
//         </div>
//         <div className="flex gap-2">
//           <button onClick={() => setShowForm("receipt")} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
//             <ArrowDownCircle className="w-4 h-4" />سند قبض
//           </button>
//           <button onClick={() => setShowForm("payment")} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
//             <ArrowUpCircle className="w-4 h-4" />سند دفع
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-4 gap-4">
//         {[
//           { label: "إجمالي المقبوض", value: `${receipts.filter(r => r.status === "معتمد").reduce((s, r) => s + (r.amount || 0), 0)?.toLocaleString("ar-SA")} ر.س`, color: "text-green-600" },
//           { label: "إجمالي المدفوع", value: `${payments.filter(p => p.status === "معتمد").reduce((s, p) => s + (p.amount || 0), 0)?.toLocaleString("ar-SA")} ر.س`, color: "text-red-600" },
//           { label: "سندات قبض مسودة", value: receipts.filter(r => r.status === "مسودة").length, color: "text-amber-600" },
//           { label: "سندات دفع مسودة", value: payments.filter(p => p.status === "مسودة").length, color: "text-amber-600" },
//         ].map(s => (
//           <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
//             <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
//             <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-1 border-b border-border">
//         {[
//           { id: "receipts", label: `سندات القبض (${receipts.length})`, icon: ArrowDownCircle },
//           { id: "payments", label: `سندات الدفع (${payments.length})`, icon: ArrowUpCircle },
//         ].map(t => (
//           <button key={t.id} onClick={() => setActiveTab(t.id)}
//             className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
//             <t.icon className="w-4 h-4" />{t.label}
//           </button>
//         ))}
//       </div>

//       {activeTab === "receipts" && renderTable(receipts, base44.entities.ReceiptVoucher)}
//       {activeTab === "payments" && renderTable(payments, base44.entities.PaymentVoucher)}

//       {showForm && <VoucherForm type={showForm} accounts={accounts} onSave={() => { setShowForm(null); load(); }} onClose={() => setShowForm(null)} />}
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { Receipt, X, CheckCircle, Upload, ArrowDownCircle, ArrowUpCircle, Edit2 } from "lucide-react";
import {
  getVouchers,
  createReceiptVoucher,
  createPaymentVoucher,
  updateVoucher,
  postVoucher,
  cancelVoucher,
  uploadVoucherAttachment,
  getAccounts,
} from "@/api/accountingApi";

const STATE_LABELS = {
  draft: "مسودة",
  posted: "مرحل",
  cancelled: "ملغي",
};

const STATE_COLORS = {
  draft: "bg-amber-100 text-amber-700",
  posted: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const PAYMENT_TYPES = {
  "نقداً": "cash",
  "تحويل بنكي": "bank_transfer",
  "شيك": "check",
  "بطاقة ائتمان": "credit_card",
};
const PAYMENT_TYPES_REVERSE = Object.fromEntries(
  Object.entries(PAYMENT_TYPES).map(([ar, en]) => [en, ar])
);

function VoucherForm({ type, accounts, voucher, onSave, onClose }) {
  const isReceipt = type === "receipt";
  const isEdit = Boolean(voucher?.id);

  const [form, setForm] = useState({
    date: voucher?.date || new Date().toISOString().slice(0, 10),
    payment_type: voucher?.payment_type
      ? (PAYMENT_TYPES_REVERSE[voucher.payment_type] || "نقداً")
      : "نقداً",
    customer_number: voucher?.customer_number || "",
    account_id: voucher?.account_id || "",
    bank_account_id: voucher?.bank_account_id || "",
    amount: voucher?.amount || 0,
    description: voucher?.description || "",
  });
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const allAccounts = accounts.filter(a => a.is_active && !a.is_parent);
  const cashBankAccounts = accounts.filter(a => a.is_active && !a.is_parent &&
    (a.account_category === "أصول متداولة" || a.account_name?.includes("نقد") || a.account_name?.includes("بنك") || a.account_name?.includes("صندوق")));

  const handleSave = async (post = false) => {
    setError("");
    try {
      setSaving(true);

      const payload = {
        date: form.date,
        payment_type: PAYMENT_TYPES[form.payment_type] || "cash",
        customer_number: form.customer_number,
        account_id: form.account_id ? Number(form.account_id) : undefined,
        bank_account_id: form.bank_account_id ? Number(form.bank_account_id) : undefined,
        amount: Number(form.amount) || 0,
        description: form.description,
        action: post ? "post" : "draft",
      };
console.log("Payload:", payload);
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

      onSave();
    }  catch (err) {
  console.error("========== PAYMENT ERROR ==========");
  console.error("Status:", err.response?.status);
  console.error("Data:", err.response?.data);
  console.error("Payload:", payload);

  setError(
    err.response?.data?.message ||
    "حصل خطأ أثناء حفظ السند، حاول تاني."
  );
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
              <label className="text-sm font-medium">طريقة الدفع</label>
              <select value={form.payment_type} onChange={e => set("payment_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {["نقداً", "تحويل بنكي", "شيك", "بطاقة ائتمان"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{isReceipt ? "رقم العميل / الجهة *" : "رقم المورد / الجهة *"}</label>
            <input value={form.customer_number} onChange={e => set("customer_number", e.target.value)} dir="ltr"
              placeholder={isReceipt ? "CUST-100" : "SUPP-200"}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{isReceipt ? "الحساب المستلم منه (حساب العميل) *" : "الحساب المدفوع له (المورد/المصروف) *"}</label>
            <select value={form.account_id} onChange={e => set("account_id", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الحساب...</option>
              {allAccounts.map(a => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">حساب الصندوق / البنك *</label>
            <select value={form.bank_account_id} onChange={e => set("bank_account_id", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر حساب الصندوق/البنك...</option>
              {(cashBankAccounts.length > 0 ? cashBankAccounts : allAccounts).map(a => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">المبلغ (ريال) *</label>
            <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none text-lg font-bold" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الوصف</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
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
          <button onClick={() => handleSave(false)} disabled={saving || !form.amount}
            className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "جاري الحفظ..." : "حفظ مسودة"}
          </button>
          <button onClick={() => handleSave(true)}
            disabled={saving || !form.amount || !form.account_id || !form.bank_account_id || !form.customer_number}
            className={`flex items-center gap-2 px-5 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${isReceipt ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
            <CheckCircle className="w-4 h-4" />{saving ? "جاري الاعتماد..." : "اعتماد وترحيل"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Vouchers() {
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [kpis, setKpis] = useState({
    total_receipts: 0, total_payments: 0,
    draft_receipt_vouchers: 0, draft_payment_vouchers: 0,
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("receipts");
  const [showForm, setShowForm] = useState(null); // "receipt" | "payment" | null
  const [editVoucher, setEditVoucher] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [vRes, accs] = await Promise.all([
        getVouchers(),
        getAccounts().catch(() => []),
      ]);

      setReceipts(vRes?.receipt_vouchers || []);
      setPayments(vRes?.payment_vouchers || []);
      setKpis(vRes?.kpis || {
        total_receipts: 0, total_payments: 0,
        draft_receipt_vouchers: 0, draft_payment_vouchers: 0,
      });

      const mappedAccounts = (accs || []).map(item => ({
        id: item.id,
        account_code: item.code ?? item.account_code,
        account_name: item.name_ar ?? item.account_name,
        account_category: item.subcategory ?? item.account_category,
        is_active: item.active ?? item.is_active,
        is_parent: item.parent_no_restrictions ?? item.is_parent,
      }));
      setAccounts(mappedAccounts);
    } catch (err) {
      console.error("خطأ أثناء تحميل السندات:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePost = async (id) => {
    try {
      setActionLoadingId(id);
      await postVoucher(id);
      await load();
    } catch (err) {
      console.error("خطأ أثناء اعتماد السند:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancel = async (id) => {
    try {
      setActionLoadingId(id);
      await cancelVoucher(id);
      await load();
    } catch (err) {
      console.error("خطأ أثناء إلغاء السند:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

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
          {["رقم السند", "التاريخ", "الجهة", "المبلغ", "طريقة الدفع", "الحالة", "قيد مرتبط", "مرفق", "إجراءات"].map(h => (
            <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
          ) : items.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد سندات</td></tr>
          ) : items.map(v => (
            <tr key={v.id} className="border-b border-border last:border-0 hover:bg-muted/20">
              <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{v.voucher_number}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{v.date ? new Date(v.date).toLocaleDateString("ar-SA") : "—"}</td>
              <td className="px-4 py-3 font-medium text-foreground" dir="ltr">{v.customer_number || "—"}</td>
              <td className="px-4 py-3 font-bold text-foreground">{(v.amount || 0)?.toLocaleString("ar-SA")} ر.س</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{PAYMENT_TYPES_REVERSE[v.payment_type] || v.payment_type}</td>
              <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[v.state]}`}>{STATE_LABELS[v.state] || v.state}</span></td>
              <td className="px-4 py-3">{v.is_linked ? <span className="text-xs text-green-600">✓ {v.linked_entry_name}</span> : "—"}</td>
              <td className="px-4 py-3">
                {v.attachment_url ? (
                  <a href={v.attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">عرض</a>
                ) : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  {v.state === "draft" && (
                    <button onClick={() => openEdit(v, type)} className="p-1.5 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/70" title="تعديل">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {(v.procedures || []).includes("post") && (
                    <button onClick={() => handlePost(v.id)} disabled={actionLoadingId === v.id}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium disabled:opacity-50">
                      {actionLoadingId === v.id ? "..." : "اعتماد"}
                    </button>
                  )}
                  {(v.procedures || []).includes("cancel") && (
                    <button onClick={() => handleCancel(v.id)} disabled={actionLoadingId === v.id}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium disabled:opacity-50">
                      {actionLoadingId === v.id ? "..." : "إلغاء"}
                    </button>
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
          { label: "إجمالي المقبوض", value: `${(kpis.total_receipts || 0)?.toLocaleString("ar-SA")} ر.س`, color: "text-green-600" },
          { label: "إجمالي المدفوع", value: `${(kpis.total_payments || 0)?.toLocaleString("ar-SA")} ر.س`, color: "text-red-600" },
          { label: "سندات قبض مسودة", value: kpis.draft_receipt_vouchers || 0, color: "text-amber-600" },
          { label: "سندات دفع مسودة", value: kpis.draft_payment_vouchers || 0, color: "text-amber-600" },
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
          accounts={accounts}
          voucher={editVoucher}
          onSave={() => { closeForm(); load(); }}
          onClose={closeForm}
        />
      )}
    </div>
  );
}