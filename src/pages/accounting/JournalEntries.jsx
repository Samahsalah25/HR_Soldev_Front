// import { useState, useEffect } from "react";
// import { FileText, Plus, X, CheckCircle, AlertCircle, Upload, Trash2 } from "lucide-react";
// import { base44 } from "@/api/base44Client";

// const STATUS_COLORS = {
//   "مسودة": "bg-amber-100 text-amber-700",
//   "مرحل": "bg-green-100 text-green-700",
//   "ملغي": "bg-red-100 text-red-600",
// };

// function JournalForm({ accounts, onSave, onClose }) {
//   const [form, setForm] = useState({
//     entry_date: new Date().toISOString().slice(0, 10),
//     description: "", reference: "", attachment_url: "",
//   });
//   const [lines, setLines] = useState([
//     { account_id: "", account_code: "", account_name: "", debit: 0, credit: 0, description: "" },
//     { account_id: "", account_code: "", account_name: "", debit: 0, credit: 0, description: "" },
//   ]);
//   const [saving, setSaving] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

//   const activeAccounts = accounts.filter(a => a.is_active && !a.is_parent);

//   const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
//   const addLine = () => setLines(ls => [...ls, { account_id: "", account_code: "", account_name: "", debit: 0, credit: 0, description: "" }]);
//   const removeLine = (i) => { if (lines.length > 2) setLines(ls => ls.filter((_, idx) => idx !== i)); };

//   const handleAccountSelect = (i, accId) => {
//     const acc = accounts.find(a => a.id === accId);
//     if (acc) setLines(ls => ls.map((l, idx) => idx === i ? { ...l, account_id: accId, account_code: acc.account_code, account_name: acc.account_name } : l));
//   };

//   const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
//   const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
//   const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

//   const handleUpload = async (e) => {
//     const file = e.target.files[0]; if (!file) return;
//     setUploading(true);
//     const { file_url } = await base44.integrations.Core.UploadFile({ file });
//     set("attachment_url", file_url);
//     setUploading(false);
//   };

//   const handleSave = async (post = false) => {
//     if (post && !isBalanced) return;
//     setSaving(true);
//     const entryNum = `JE-${Date.now().toString().slice(-6)}`;
//     const user = await base44.auth.me();
//     const entry = await base44.entities.JournalEntry.create({
//       ...form,
//       entry_number: entryNum,
//       lines,
//       total_debit: totalDebit,
//       total_credit: totalCredit,
//       status: post ? "مرحل" : "مسودة",
//       posted_by: post ? (user.full_name || user.email) : "",
//       posted_date: post ? new Date().toISOString().slice(0, 10) : "",
//       source: "يدوي",
//     });
//     onSave();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
//       <div className="bg-card rounded-2xl border border-border w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-border">
//           <h3 className="font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-primary" />قيد يومية جديد</h3>
//           <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium">تاريخ القيد *</label>
//               <input type="date" value={form.entry_date} onChange={e => set("entry_date", e.target.value)}
//                 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
//             </div>
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium">المرجع</label>
//               <input value={form.reference} onChange={e => set("reference", e.target.value)} dir="ltr"
//                 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
//             </div>
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">البيان / الوصف *</label>
//             <input value={form.description} onChange={e => set("description", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
//           </div>

//           {/* Lines */}
//           <div>
//             <div className="flex items-center justify-between mb-2">
//               <label className="text-sm font-semibold">سطور القيد</label>
//               <button onClick={addLine} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />إضافة سطر</button>
//             </div>
//             <div className="border border-border rounded-lg overflow-hidden">
//               <table className="w-full text-xs">
//                 <thead><tr className="bg-muted/30 border-b border-border">
//                   <th className="text-right px-3 py-2 font-medium text-muted-foreground">الحساب</th>
//                   <th className="text-right px-3 py-2 font-medium text-muted-foreground">البيان</th>
//                   <th className="text-right px-3 py-2 font-medium text-muted-foreground">مدين (د)</th>
//                   <th className="text-right px-3 py-2 font-medium text-muted-foreground">دائن (ه)</th>
//                   <th className="px-2 py-2"></th>
//                 </tr></thead>
//                 <tbody>
//                   {lines.map((l, i) => (
//                     <tr key={i} className="border-b border-border last:border-0">
//                       <td className="px-3 py-2">
//                         <select value={l.account_id} onChange={e => handleAccountSelect(i, e.target.value)}
//                           className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-40">
//                           <option value="">اختر الحساب...</option>
//                           {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
//                         </select>
//                       </td>
//                       <td className="px-3 py-2">
//                         <input value={l.description} onChange={e => setLine(i, "description", e.target.value)}
//                           className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-24" />
//                       </td>
//                       <td className="px-3 py-2">
//                         <input type="number" min={0} value={l.debit || ""} onChange={e => { setLine(i, "debit", +e.target.value); if (e.target.value) setLine(i, "credit", 0); }}
//                           className="w-24 px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none text-blue-700 font-medium" />
//                       </td>
//                       <td className="px-3 py-2">
//                         <input type="number" min={0} value={l.credit || ""} onChange={e => { setLine(i, "credit", +e.target.value); if (e.target.value) setLine(i, "debit", 0); }}
//                           className="w-24 px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none text-red-600 font-medium" />
//                       </td>
//                       <td className="px-2 py-2">
//                         <button onClick={() => removeLine(i)} className="p-1 hover:bg-red-50 text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
//                       </td>
//                     </tr>
//                   ))}
//                   <tr className="bg-muted/20 font-bold">
//                     <td colSpan={2} className="px-3 py-2 text-xs text-muted-foreground">الإجمالي</td>
//                     <td className="px-3 py-2 text-xs text-blue-700">{totalDebit?.toLocaleString("ar-SA")}</td>
//                     <td className="px-3 py-2 text-xs text-red-600">{totalCredit?.toLocaleString("ar-SA")}</td>
//                     <td />
//                   </tr>
//                 </tbody>
//               </table>
//             </div>
//             {totalDebit > 0 && (
//               <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isBalanced ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
//                 {isBalanced ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
//                 {isBalanced ? "القيد متوازن ✓" : `الفرق: ${Math.abs(totalDebit - totalCredit)?.toLocaleString("ar-SA")} ريال — القيد غير متوازن`}
//               </div>
//             )}
//           </div>

//           {/* Attachment */}
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium">مرفق</label>
//             {form.attachment_url ? (
//               <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
//                 <span>✅ تم رفع المرفق</span>
//                 <a href={form.attachment_url} target="_blank" rel="noopener noreferrer" className="underline">عرض</a>
//                 <button onClick={() => set("attachment_url", "")} className="mr-auto text-red-500 hover:text-red-700">✕</button>
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
//           <button onClick={() => handleSave(false)} disabled={saving || !form.description || !form.entry_date}
//             className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium disabled:opacity-50">
//             حفظ كمسودة
//           </button>
//           <button onClick={() => handleSave(true)} disabled={saving || !isBalanced || !form.description}
//             className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
//             <CheckCircle className="w-4 h-4" />ترحيل القيد
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function JournalEntries() {
//   const [entries, setEntries] = useState([]);
//   const [accounts, setAccounts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [expanded, setExpanded] = useState(null);
//   const [filterStatus, setFilterStatus] = useState("");

//   const load = async () => {
//     const [es, accs] = await Promise.all([
//       base44.entities.JournalEntry.list("-entry_date"),
//       base44.entities.AccountChart.list("account_code"),
//     ]);
//     setEntries(es); setAccounts(accs); setLoading(false);
//   };
//   useEffect(() => { load(); }, []);

//   const reverse = async (entry) => {
//     const user = await base44.auth.me();
//     const reversedLines = (entry.lines || []).map(l => ({ ...l, debit: l.credit, credit: l.debit }));
//     await base44.entities.JournalEntry.create({
//       entry_number: `JE-REV-${Date.now().toString().slice(-6)}`,
//       entry_date: new Date().toISOString().slice(0, 10),
//       description: `عكس قيد: ${entry.description}`,
//       lines: reversedLines,
//       total_debit: entry.total_credit,
//       total_credit: entry.total_debit,
//       status: "مرحل",
//       source: "قيد عكسي",
//       source_id: entry.id,
//       posted_by: user.full_name || user.email,
//       posted_date: new Date().toISOString().slice(0, 10),
//     });
//     await base44.entities.JournalEntry.update(entry.id, { status: "ملغي" });
//     load();
//   };

//   const post = async (id) => {
//     const user = await base44.auth.me();
//     await base44.entities.JournalEntry.update(id, {
//       status: "مرحل",
//       posted_by: user.full_name || user.email,
//       posted_date: new Date().toISOString().slice(0, 10),
//     });
//     load();
//   };

//   const filtered = entries.filter(e => !filterStatus || e.status === filterStatus);

//   return (
//     <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="w-6 h-6 text-primary" />القيود اليومية</h1>
//           <p className="text-sm text-muted-foreground mt-0.5">إدخال وترحيل القيود المحاسبية</p>
//         </div>
//         <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
//           <Plus className="w-4 h-4" />قيد جديد
//         </button>
//       </div>

//       <div className="grid grid-cols-3 gap-4">
//         {[
//           { label: "مسودة", value: entries.filter(e => e.status === "مسودة").length, color: "text-amber-600" },
//           { label: "مرحلة", value: entries.filter(e => e.status === "مرحل").length, color: "text-green-600" },
//           { label: "إجمالي مرحل (د)", value: `${entries.filter(e => e.status === "مرحل").reduce((s, e) => s + (e.total_debit || 0), 0)?.toLocaleString("ar-SA")} ر.س`, color: "text-primary" },
//         ].map(s => (
//           <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
//             <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
//             <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-2">
//         {[["", "الكل"], ["مسودة", "مسودة"], ["مرحل", "مرحل"], ["ملغي", "ملغي"]].map(([val, label]) => (
//           <button key={val} onClick={() => setFilterStatus(val)}
//             className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === val ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
//             {label}
//           </button>
//         ))}
//       </div>

//       <div className="bg-card rounded-xl border border-border overflow-hidden">
//         <table className="w-full text-sm">
//           <thead><tr className="bg-muted/30 border-b border-border">
//             {["رقم القيد","التاريخ","البيان","إجمالي مدين","إجمالي دائن","الحالة","إجراءات"].map(h => (
//               <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
//             ))}
//           </tr></thead>
//           <tbody>
//             {loading ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
//               : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد قيود</td></tr>
//               : filtered.map(e => (
//                 <>
//                   <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
//                     onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
//                     <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{e.entry_number}</td>
//                     <td className="px-4 py-3 text-xs text-muted-foreground">{e.entry_date ? new Date(e.entry_date).toLocaleDateString("ar-SA") : "—"}</td>
//                     <td className="px-4 py-3 font-medium text-foreground">{e.description}</td>
//                     <td className="px-4 py-3 text-blue-700 font-semibold">{e.total_debit?.toLocaleString("ar-SA")}</td>
//                     <td className="px-4 py-3 text-red-600 font-semibold">{e.total_credit?.toLocaleString("ar-SA")}</td>
//                     <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status]}`}>{e.status}</span></td>
//                     <td className="px-4 py-3">
//                       <div className="flex gap-1">
//                         {e.status === "مسودة" && (
//                           <button onClick={ev => { ev.stopPropagation(); post(e.id); }} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium">ترحيل</button>
//                         )}
//                         {e.status === "مرحل" && (
//                           <button onClick={ev => { ev.stopPropagation(); reverse(e); }} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium">عكس</button>
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                   {expanded === e.id && (e.lines || []).length > 0 && (
//                     <tr key={`${e.id}-lines`} className="bg-muted/10 border-b border-border">
//                       <td colSpan={7} className="px-8 py-3">
//                         <table className="w-full text-xs">
//                           <thead><tr className="text-muted-foreground">
//                             <th className="text-right pb-1">رقم الحساب</th>
//                             <th className="text-right pb-1">اسم الحساب</th>
//                             <th className="text-right pb-1">البيان</th>
//                             <th className="text-right pb-1 text-blue-600">مدين</th>
//                             <th className="text-right pb-1 text-red-600">دائن</th>
//                           </tr></thead>
//                           <tbody>
//                             {e.lines.map((l, i) => (
//                               <tr key={i} className="border-t border-border/50">
//                                 <td className="py-1 font-mono text-muted-foreground">{l.account_code}</td>
//                                 <td className="py-1 font-medium">{l.account_name}</td>
//                                 <td className="py-1 text-muted-foreground">{l.description}</td>
//                                 <td className="py-1 text-blue-600 font-semibold">{l.debit > 0 ? l.debit?.toLocaleString("ar-SA") : "—"}</td>
//                                 <td className="py-1 text-red-600 font-semibold">{l.credit > 0 ? l.credit?.toLocaleString("ar-SA") : "—"}</td>
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </td>
//                     </tr>
//                   )}
//                 </>
//               ))}
//           </tbody>
//         </table>
//       </div>

//       {showForm && <JournalForm accounts={accounts} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { FileText, Plus, X, CheckCircle, AlertCircle, Upload, Trash2, Edit2 } from "lucide-react";
import {
  getDailyEntries,
  createDailyEntry,
  updateDailyEntry,
  postDailyEntry,
  reverseDailyEntry,
  uploadDailyEntryAttachment,
  getAccounts,
} from "@/api/accountingApi";
import api from "@/api/axios";
import { useConfirm } from "@/components/ui/confirm-dialog";
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

function JournalForm({ accounts, entry, onSave, onClose }) {
  const isEdit = Boolean(entry?.id);

  const [form, setForm] = useState({
    date: entry?.date || new Date().toISOString().slice(0, 10),
    description: entry?.description || "",
    reference: entry?.reference || "",
  });
  const [lines, setLines] = useState(
    entry?.lines?.length
      ? entry.lines.map(l => ({
          account_id: l.account_id ?? "",
          account_code: l.account_code || "",
          account_name: l.account_name_ar || l.account_name || "",
          debit: l.debit || 0,
          credit: l.credit || 0,
          description: l.description || "",
        }))
      : [
          { account_id: "", account_code: "", account_name: "", debit: 0, credit: 0, description: "" },
          { account_id: "", account_code: "", account_name: "", debit: 0, credit: 0, description: "" },
        ]
  );
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const activeAccounts = accounts.filter(a => a.is_active && !a.is_parent);

  const setLine = (i, k, v) => setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l));
  const addLine = () => setLines(ls => [...ls, { account_id: "", account_code: "", account_name: "", debit: 0, credit: 0, description: "" }]);
  const removeLine = (i) => { if (lines.length > 2) setLines(ls => ls.filter((_, idx) => idx !== i)); };

  const handleAccountSelect = (i, accId) => {
    const acc = accounts.find(a => String(a.id) === String(accId));
    if (acc) {
      setLines(ls => ls.map((l, idx) => idx === i
        ? { ...l, account_id: accId, account_code: acc.account_code, account_name: acc.account_name }
        : l));
    } else {
      setLines(ls => ls.map((l, idx) => idx === i ? { ...l, account_id: "", account_code: "", account_name: "" } : l));
    }
  };

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSave = async (post = false) => {
    if (post && !isBalanced) return;
    setError("");
    try {
      setSaving(true);

      const payload = {
        date: form.date,
        reference: form.reference,
        description: form.description,
        action: post ? "post" : "draft",
        lines: lines.map(l => ({
          account_id: l.account_id ? Number(l.account_id) : undefined,
          description: l.description,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        })),
      };

      let result;
      if (isEdit) {
        result = await updateDailyEntry(entry.id, payload);
      } else {
        result = await createDailyEntry(payload);
      }

      // لو فيه مرفق مختار، نرفعه بعد الحفظ (محتاجين id القيد)
      const entryId = entry?.id || result?.entry?.id || result?.id;
      if (attachmentFile && entryId) {
        await uploadDailyEntryAttachment(entryId, attachmentFile);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ القيد:", err);
      setError("حصل خطأ أثناء حفظ القيد، حاول تاني.");
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
            {isEdit ? `تعديل القيد ${entry.entry_number || ""}` : "قيد يومية جديد"}
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
              <label className="text-sm font-medium">تاريخ القيد *</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المرجع</label>
              <input value={form.reference} onChange={e => set("reference", e.target.value)} dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">البيان / الوصف *</label>
            <input value={form.description} onChange={e => set("description", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold">سطور القيد</label>
              <button onClick={addLine} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" />إضافة سطر</button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/30 border-b border-border">
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">الحساب</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">البيان</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">مدين (د)</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">دائن (ه)</th>
                  <th className="px-2 py-2"></th>
                </tr></thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <select value={l.account_id} onChange={e => handleAccountSelect(i, e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-40">
                          <option value="">اختر الحساب...</option>
                          {activeAccounts.map(a => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input value={l.description} onChange={e => setLine(i, "description", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none min-w-24" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.debit || ""} onChange={e => { setLine(i, "debit", +e.target.value); if (e.target.value) setLine(i, "credit", 0); }}
                          className="w-24 px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none text-blue-700 font-medium" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min={0} value={l.credit || ""} onChange={e => { setLine(i, "credit", +e.target.value); if (e.target.value) setLine(i, "debit", 0); }}
                          className="w-24 px-2 py-1.5 text-xs border border-border rounded bg-background focus:outline-none text-red-600 font-medium" />
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeLine(i)} className="p-1 hover:bg-red-50 text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/20 font-bold">
                    <td colSpan={2} className="px-3 py-2 text-xs text-muted-foreground">الإجمالي</td>
                    <td className="px-3 py-2 text-xs text-blue-700">{totalDebit?.toLocaleString("ar-SA")}</td>
                    <td className="px-3 py-2 text-xs text-red-600">{totalCredit?.toLocaleString("ar-SA")}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
            {totalDebit > 0 && (
              <div className={`mt-2 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isBalanced ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                {isBalanced ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {isBalanced ? "القيد متوازن ✓" : `الفرق: ${Math.abs(totalDebit - totalCredit)?.toLocaleString("ar-SA")} ريال — القيد غير متوازن`}
              </div>
            )}
          </div>

          {/* Attachment */}
         <div className="space-y-1.5">
  <label className="text-sm font-medium">مرفق</label>

  {entry?.attachment_url && !attachmentFile && (
    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 mb-2">
      <span>📎 مرفق حالي: {entry.attachment_name || "ملف"}</span>

      <a
        href={`${api.defaults.assetURL}${entry.attachment_url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="underline mr-auto"
      >
        عرض
      </a>
    </div>
  )}

  {attachmentFile ? (
    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
      <span>✅ {attachmentFile.name}</span>
      <button
        onClick={() => setAttachmentFile(null)}
        className="mr-auto text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  ) : (
    <label className="flex items-center gap-2 p-2.5 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 text-sm text-primary">
      <Upload className="w-4 h-4" />
      {entry?.attachment_url ? "استبدال المرفق" : "اختيار ملف (هيتم رفعه بعد الحفظ)"}

      <input
        type="file"
        className="hidden"
        onChange={e => setAttachmentFile(e.target.files[0] || null)}
      />
    </label>
  )}
</div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={() => handleSave(false)} disabled={saving || !form.description || !form.date}
            className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium disabled:opacity-50">
            {saving ? "جاري الحفظ..." : isEdit ? "حفظ التعديلات" : "حفظ كمسودة"}
          </button>
          <button onClick={() => handleSave(true)} disabled={saving || !isBalanced || !form.description}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <CheckCircle className="w-4 h-4" />{saving ? "جاري الترحيل..." : "ترحيل القيد"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [kpis, setKpis] = useState({ draft_entries: 0, posted_entries: 0, total_posted_amount: 0 });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const confirmDialog = useConfirm();
  const load = async () => {
    try {
      setLoading(true);
      const [entriesRes, accs] = await Promise.all([
        getDailyEntries(),
        getAccounts().catch(() => []),
      ]);

      setEntries(entriesRes?.entries || []);
      setKpis(entriesRes?.kpis || { draft_entries: 0, posted_entries: 0, total_posted_amount: 0 });

      // ملاحظة: getAccounts بترجع نفس شكل item الخام من الـ API (مش الشكل المُحوَّل)
      // فهنعمل mapping بسيط هنا عشان الفورم يقدر يستخدم account_code / account_name / is_active / is_parent
      const mappedAccounts = (accs || []).map(item => ({
        id: item.id,
        account_code: item.code ?? item.account_code,
        account_name: item.name_ar ?? item.account_name,
        is_active: item.active ?? item.is_active,
        is_parent: item.parent_no_restrictions ?? item.is_parent,
      }));
      setAccounts(mappedAccounts);
    } catch (err) {
      console.error("خطأ أثناء تحميل القيود:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

const handlePost = async (id) => {
  const ok = await confirmDialog({
    title: "ترحيل القيد",
    message: "هل أنت متأكد من ترحيل هذا القيد؟ بعد الترحيل لن يمكن تعديله.",
    confirmText: "ترحيل",
  });
  if (!ok) return;

  try {
    setActionLoadingId(id);
    await postDailyEntry(id);
    await load();
  } catch (err) {
    console.error("خطأ أثناء ترحيل القيد:", err);
  } finally {
    setActionLoadingId(null);
  }
};

const handleReverse = async (id) => {
  const ok = await confirmDialog({
    title: "عكس القيد",
    message: "هل أنت متأكد من عكس هذا القيد؟ سيتم إلغاء أثره المحاسبي بقيد عكسي. لا يمكن التراجع عن هذا الإجراء.",
    confirmText: "عكس القيد",
    variant: "destructive",
  });
  if (!ok) return;

  try {
    setActionLoadingId(id);
    await reverseDailyEntry(id);
    await load();
  } catch (err) {
    console.error("خطأ أثناء عكس القيد:", err);
  } finally {
    setActionLoadingId(null);
  }
};

  const openEdit = (entry) => {
    setEditEntry(entry);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditEntry(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditEntry(null);
  };

  const filtered = entries.filter(e => !filterStatus || e.state === filterStatus);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="w-6 h-6 text-primary" />القيود اليومية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدخال وترحيل القيود المحاسبية</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />قيد جديد
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "مسودة", value: kpis.draft_entries, color: "text-amber-600" },
          { label: "مرحلة", value: kpis.posted_entries, color: "text-green-600" },
          { label: "إجمالي مرحل (د)", value: `${(kpis.total_posted_amount || 0)?.toLocaleString("ar-SA")} ر.س`, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {[["", "الكل"], ["draft", "مسودة"], ["posted", "مرحل"], ["cancelled", "ملغي"]].map(([val, label]) => (
          <button key={val} onClick={() => setFilterStatus(val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filterStatus === val ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["رقم القيد", "التاريخ", "البيان", "إجمالي مدين", "إجمالي دائن", "الحالة", "إجراءات"].map(h => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد قيود</td></tr>
            ) : filtered.map(e => (
              <>
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-primary font-medium">{e.entry_number}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{e.date ? new Date(e.date).toLocaleDateString("ar-SA") : "—"}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{e.description || "—"}</td>
                  <td className="px-4 py-3 text-blue-700 font-semibold">{(e.total_debit || 0)?.toLocaleString("ar-SA")}</td>
                  <td className="px-4 py-3 text-red-600 font-semibold">{(e.total_credit || 0)?.toLocaleString("ar-SA")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATE_COLORS[e.state]}`}>{STATE_LABELS[e.state] || e.state}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {e.state === "draft" && (
                        <button onClick={ev => { ev.stopPropagation(); openEdit(e); }}
                          className="p-1.5 bg-muted text-muted-foreground rounded text-xs hover:bg-muted/70 font-medium" title="تعديل">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(e.procedures || []).includes("post") && (
                        <button onClick={ev => { ev.stopPropagation(); handlePost(e.id); }} disabled={actionLoadingId === e.id}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium disabled:opacity-50">
                          {actionLoadingId === e.id ? "..." : "ترحيل"}
                        </button>
                      )}
                      {(e.procedures || []).includes("reverse") && (
                        <button onClick={ev => { ev.stopPropagation(); handleReverse(e.id); }} disabled={actionLoadingId === e.id}
                          className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium disabled:opacity-50">
                          {actionLoadingId === e.id ? "..." : "عكس"}
                        </button>
                      )}
                    {e.attachment_url && (
  <a
    href={`${api.defaults.baseURL}${e.attachment_url.replace(/^\/api\/v1/, "")}`}
    target="_blank"
    rel="noopener noreferrer"
    onClick={ev => ev.stopPropagation()}
    className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs hover:bg-blue-100 font-medium"
  >
    مرفق
  </a>
)}
                    </div>
                  </td>
                </tr>
                {expanded === e.id && (e.lines || []).length > 0 && (
                  <tr key={`${e.id}-lines`} className="bg-muted/10 border-b border-border">
                    <td colSpan={7} className="px-8 py-3">
                      <table className="w-full text-xs">
                        <thead><tr className="text-muted-foreground">
                          <th className="text-right pb-1">رقم الحساب</th>
                          <th className="text-right pb-1">اسم الحساب</th>
                          <th className="text-right pb-1">البيان</th>
                          <th className="text-right pb-1 text-blue-600">مدين</th>
                          <th className="text-right pb-1 text-red-600">دائن</th>
                        </tr></thead>
                        <tbody>
                          {e.lines.map((l, i) => (
                            <tr key={l.id ?? i} className="border-t border-border/50">
                              <td className="py-1 font-mono text-muted-foreground">{l.account_code}</td>
                              <td className="py-1 font-medium">{l.account_name_ar}</td>
                              <td className="py-1 text-muted-foreground">{l.description}</td>
                              <td className="py-1 text-blue-600 font-semibold">{l.debit > 0 ? l.debit?.toLocaleString("ar-SA") : "—"}</td>
                              <td className="py-1 text-red-600 font-semibold">{l.credit > 0 ? l.credit?.toLocaleString("ar-SA") : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <JournalForm
          accounts={accounts}
          entry={editEntry}
          onSave={() => { closeForm(); load(); }}
          onClose={closeForm}
        />
      )}
    </div>
  );
}