// import { useState, useEffect } from "react";
// import {
//   Percent,
//   Plus,
//   X,
//   Save,
//   Trash2,
//   ChevronLeft,
//   Loader2,
//   AlertCircle,
// } from "lucide-react";
// import {
//   getTaxes,
//   getTax,
//   createTax,
//   updateTax,
//   deleteTax,
// } from "@/api/Taxesapi";
// import { getAccounts, formatAccountLabel } from "@/api/accountingApi";
// import { extractApiErrorMessage } from "@/lib/apiErrors";
// import { useConfirm } from "@/components/ui/confirm-dialog";
// import { useToast } from "@/components/ui/use-toast";

// /* ────────────────────────────────────────────────────────────────────────
//    ثوابت وخيارات
//    ──────────────────────────────────────────────────────────────────── */

// const TAX_TYPE_USE = [
//   { value: "sale", label: "مبيعات" },
//   { value: "purchase", label: "مشتريات" },
//   { value: "none", label: "بدون" },
// ];

// const AMOUNT_TYPE = [
//   { value: "percent", label: "نسبة مئوية" },
//   { value: "fixed", label: "مبلغ ثابت" },
//   { value: "division", label: "نسبة من السعر (شامل)" },
//   { value: "group", label: "مجموعة ضرائب" },
// ];

// const TAX_SCOPE = [
//   { value: "", label: "بدون تحديد" },
//   { value: "service", label: "خدمات" },
//   { value: "consu", label: "سلع" },
// ];

// const PRICE_INCLUDE = [
//   { value: "default", label: "افتراضي" },
//   { value: "tax_included", label: "شامل الضريبة" },
//   { value: "tax_excluded", label: "غير شامل الضريبة" },
// ];

// const REPARTITION_TYPES = [
//   { value: "base", label: "الأساس (Base)" },
//   { value: "tax", label: "الضريبة (Tax)" },
// ];

// const TYPE_BADGE = {
//   sale: "bg-blue-50 text-blue-600",
//   purchase: "bg-orange-50 text-orange-600",
//   none: "bg-gray-100 text-gray-600",
// };
// const TYPE_LABEL = Object.fromEntries(TAX_TYPE_USE.map((t) => [t.value, t.label]));

// const EMPTY_LINE = (type = "tax") => ({
//   _key: Date.now() + Math.random(),
//   repartition_type: type,
//   factor_percent: 100,
//   account_id: "",
// });

// const EMPTY_TAX = {
//   name: "",
//   type_tax_use: "sale",
//   amount_type: "percent",
//   amount: 0,
//   active: true,
//   tax_scope: "",
//   invoice_label: "",
//   description: "",
//   analytic: false,
//   invoice_legal_notes: "",
//   price_include_override: "default",
//   include_base_amount: false,
//   is_base_affected: false,
//   invoice_repartition_line_ids: [EMPTY_LINE("base"), EMPTY_LINE("tax")],
//   refund_repartition_line_ids: [EMPTY_LINE("base"), EMPTY_LINE("tax")],
// };

// /**
//  * بناء الـ Payload اللي بيتبعت للباك اند من شكل الفورم المحلي
//  *
//  * ملاحظة مهمة (الإصلاح):
//  * لازم نبعت الـ id بتاع كل سطر توزيع (repartition line) لو كان موجود
//  * (يعني السطر ده أصلاً موجود في قاعدة البيانات وجاي من getTax).
//  * لو ما بعتناش الـ id، الباك اند مش هيعرف يفرّق بين "سطر قديم اتعدل"
//  * و"سطر جديد"، وغالبًا هيحاول يمسح الأسطر القديمة ويعمل غيرها من الصفر،
//  * وده ممكن يفشل (500) لو الأسطر دي مربوطة بقيود محاسبية فعلية.
//  */
// function buildPayload(form) {
//   const mapLines = (lines) =>
//     lines.map((l) => {
//       const line = {
//         repartition_type: l.repartition_type,
//         factor_percent: Number(l.factor_percent) || 0,
//       };

//       // لو السطر ده جاي من الباك اند أصلاً (عنده id رقمي حقيقي) ابعتيه
//       // عشان يبقى update مش delete+create
//       if (l.id) {
//         line.id = l.id;
//       }

//       if (l.repartition_type === "tax" && l.account_id) {
//         line.account_id = Number(l.account_id);
//       }
//       return line;
//     });

//   const payload = {
//     name: form.name.trim(),
//     amount: Number(form.amount) || 0,
//     type_tax_use: form.type_tax_use,
//     amount_type: form.amount_type,
//     description: form.description?.trim() || "",
//     active: !!form.active,
//     tax_scope: form.tax_scope || null,
//     invoice_label: form.invoice_label?.trim() || "",
//     analytic: !!form.analytic,
//     include_base_amount: !!form.include_base_amount,
//     is_base_affected: !!form.is_base_affected,
//     invoice_repartition_line_ids: mapLines(form.invoice_repartition_line_ids),
//     refund_repartition_line_ids: mapLines(form.refund_repartition_line_ids),
//   };

//   // "default" معناها متبعتيش الحقل خالص، مش إنك تبعتي النص الحرفي "default"
//   // (أودو بيرفضها كـ ValidationError لأنها مش من ضمن القيم المسموح بيها فعليًا)
//   if (form.price_include_override && form.price_include_override !== "default") {
//     payload.price_include_override = form.price_include_override;
//   }

//   return payload;
// }

// /* ────────────────────────────────────────────────────────────────────────
//    جدول توزيع الفاتورة / الإشعار الدائن (Repartition Lines)
//    ──────────────────────────────────────────────────────────────────── */

// function RepartitionTable({ title, lines, accounts, onChange, onAdd, onRemove }) {
//   return (
//     <div>
//       <p className="text-xs font-bold text-gray-400 uppercase mb-2">{title}</p>
//       <div className="border border-gray-200 rounded-lg overflow-hidden">
//         <table className="w-full text-xs">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="text-right px-3 py-2 font-medium text-gray-500">%</th>
//               <th className="text-right px-3 py-2 font-medium text-gray-500">النوع</th>
//               <th className="text-right px-3 py-2 font-medium text-gray-500">الحساب</th>
//               <th className="px-2 py-2" />
//             </tr>
//           </thead>
//           <tbody>
//             {lines.map((l, i) => (
//               <tr key={l._key ?? i} className="border-b border-gray-100 last:border-0">
//                 <td className="px-3 py-2">
//                   <input
//                     type="number"
//                     value={l.factor_percent}
//                     onChange={(e) => onChange(i, "factor_percent", e.target.value)}
//                     className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
//                   />
//                 </td>
//                 <td className="px-3 py-2">
//                   <select
//                     value={l.repartition_type}
//                     onChange={(e) => onChange(i, "repartition_type", e.target.value)}
//                     className="px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
//                   >
//                     {REPARTITION_TYPES.map((t) => (
//                       <option key={t.value} value={t.value}>{t.label}</option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="px-3 py-2">
//                   <select
//                     value={l.account_id}
//                     onChange={(e) => onChange(i, "account_id", e.target.value)}
//                     disabled={l.repartition_type === "base"}
//                     className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50 disabled:text-gray-300 min-w-[160px]"
//                   >
//                     <option value="">بدون حساب...</option>
//                     {accounts.map((a) => (
//                       <option key={a.id} value={a.id}>{formatAccountLabel(a)}</option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="px-2 py-2">
//                   <button onClick={() => onRemove(i)} className="p-1 hover:bg-red-50 text-red-400 rounded">
//                     <Trash2 className="w-3.5 h-3.5" />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//         <button onClick={onAdd} className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline px-3 py-2">
//           <Plus className="w-3 h-3" /> إضافة سطر
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ────────────────────────────────────────────────────────────────────────
//    صفحة إنشاء / تعديل ضريبة — Inline Page (مش Modal)
//    ──────────────────────────────────────────────────────────────────── */

// function TaxForm({ tax, accounts, onBack, onSaved }) {
//   const { toast } = useToast();
//   const isEdit = Boolean(tax?.id);

//   const [form, setForm] = useState(() =>
//     isEdit
//       ? {
//           ...EMPTY_TAX,
//           ...tax,
//           tax_scope: tax.tax_scope || "",
//           invoice_label: tax.invoice_label || "",
//           price_include_override: tax.price_include_override || "default",
//           invoice_repartition_line_ids: (tax.invoice_repartition_line_ids?.length
//             ? tax.invoice_repartition_line_ids
//             : EMPTY_TAX.invoice_repartition_line_ids
//           ).map((l) => ({ ...l, _key: l.id ?? Date.now() + Math.random(), account_id: l.account_id || "" })),
//           refund_repartition_line_ids: (tax.refund_repartition_line_ids?.length
//             ? tax.refund_repartition_line_ids
//             : EMPTY_TAX.refund_repartition_line_ids
//           ).map((l) => ({ ...l, _key: l.id ?? Date.now() + Math.random(), account_id: l.account_id || "" })),
//         }
//       : { ...EMPTY_TAX }
//   );
//   const [saving, setSaving] = useState(false);
//   const [error, setError] = useState(null);

//   const tabs = [
//     { id: "definition", label: "التعريف" },
//     { id: "advanced", label: "إعدادات متقدمة" },
//   ];
//   const [tab, setTab] = useState("definition");

//   const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

//   const setLine = (key, idx, field, value) =>
//     setForm((f) => ({ ...f, [key]: f[key].map((l, i) => (i === idx ? { ...l, [field]: value } : l)) }));
//   const addLine = (key) => setForm((f) => ({ ...f, [key]: [...f[key], EMPTY_LINE("tax")] }));
//   const removeLine = (key, idx) =>
//     setForm((f) => (f[key].length > 1 ? { ...f, [key]: f[key].filter((_, i) => i !== idx) } : f));

//   const handleSave = async () => {
//     setError(null);
//     if (!form.name.trim()) return;
//     try {
//       setSaving(true);
//       const payload = buildPayload(form);
//       if (isEdit) {
//         await updateTax(tax.id, payload);
//       } else {
//         await createTax(payload);
//       }
//       onSaved();
//     } catch (err) {
//       console.error("خطأ أثناء حفظ الضريبة:", err);
//       setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ الضريبة"));
//       toast({
//         title: "تعذّر حفظ الضريبة",
//         description: extractApiErrorMessage(err),
//         variant: "destructive",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="w-full bg-white" dir="rtl">
//       {/* Top bar */}
//       <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//         <div className="flex items-center gap-3">
//           <button onClick={onBack} title="إلغاء" className="text-gray-400 hover:text-gray-600">
//             <X className="w-5 h-5" />
//           </button>
//           <button
//             onClick={handleSave}
//             disabled={!form.name.trim() || saving}
//             title="حفظ"
//             className="text-orange-500 hover:text-orange-600 disabled:opacity-40"
//           >
//             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
//           </button>
//         </div>
//         <div className="flex items-center gap-1.5 text-sm text-gray-400">
//           <span className="text-gray-800 font-medium">{isEdit ? tax.name : "جديد"}</span>
//           <span>/</span>
//           <span>الضرائب</span>
//         </div>
//       </div>

//       <div className="p-6 space-y-5">
//         {error && (
//           <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
//             <AlertCircle className="w-4 h-4" />
//             {error}
//           </div>
//         )}

//         {/* اسم الضريبة + النوع والحساب */}
//         <div className="grid grid-cols-2 gap-x-10 gap-y-4">
//           <div>
//             <label className="text-xs text-gray-400 mb-1 block">* اسم الضريبة</label>
//             <input
//               value={form.name}
//               onChange={(e) => set("name", e.target.value)}
//               placeholder="مثال: ضريبة القيمة المضافة 15%"
//               className="w-full text-2xl font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-orange-400 pb-2 bg-transparent placeholder:text-gray-300"
//             />
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium text-gray-700">نوع الضريبة</label>
//             <select
//               value={form.type_tax_use}
//               onChange={(e) => set("type_tax_use", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//             >
//               {TAX_TYPE_USE.map((t) => (
//                 <option key={t.value} value={t.value}>{t.label}</option>
//               ))}
//             </select>
//           </div>

//           <div className="space-y-1.5">
//             <label className="text-sm font-medium text-gray-700">طريقة الاحتساب</label>
//             <select
//               value={form.amount_type}
//               onChange={(e) => set("amount_type", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//             >
//               {AMOUNT_TYPE.map((t) => (
//                 <option key={t.value} value={t.value}>{t.label}</option>
//               ))}
//             </select>
//           </div>
//           <div className="space-y-1.5">
//             <label className="text-sm font-medium text-gray-700">نطاق الضريبة</label>
//             <select
//               value={form.tax_scope}
//               onChange={(e) => set("tax_scope", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//             >
//               {TAX_SCOPE.map((t) => (
//                 <option key={t.value} value={t.value}>{t.label}</option>
//               ))}
//             </select>
//           </div>

//           <div className="space-y-1.5">
//             <label className="text-sm font-medium text-gray-700">القيمة</label>
//             <div className="flex items-center gap-2">
//               <input
//                 type="number"
//                 value={form.amount}
//                 onChange={(e) => set("amount", e.target.value)}
//                 className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//               />
//               {form.amount_type === "percent" && <span className="text-sm text-gray-500">%</span>}
//             </div>
//           </div>
//           <div className="flex items-center gap-2 pt-6">
//             <input
//               type="checkbox"
//               checked={form.active}
//               onChange={(e) => set("active", e.target.checked)}
//               className="w-4 h-4 accent-orange-500"
//             />
//             <label className="text-sm font-medium text-gray-700">مفعّلة</label>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="flex gap-1 border-b border-gray-200">
//           {tabs.map((t) => (
//             <button
//               key={t.id}
//               onClick={() => setTab(t.id)}
//               className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
//                 tab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               {t.label}
//             </button>
//           ))}
//         </div>

//         {/* ── التعريف: توزيع الفاتورة والإشعار الدائن ─────────────── */}
//         {tab === "definition" && (
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
//             <RepartitionTable
//               title="توزيع الفاتورة (Invoices)"
//               lines={form.invoice_repartition_line_ids}
//               accounts={accounts}
//               onChange={(idx, field, value) => setLine("invoice_repartition_line_ids", idx, field, value)}
//               onAdd={() => addLine("invoice_repartition_line_ids")}
//               onRemove={(idx) => removeLine("invoice_repartition_line_ids", idx)}
//             />
//             <RepartitionTable
//               title="توزيع إشعار الدائن (Refunds)"
//               lines={form.refund_repartition_line_ids}
//               accounts={accounts}
//               onChange={(idx, field, value) => setLine("refund_repartition_line_ids", idx, field, value)}
//               onAdd={() => addLine("refund_repartition_line_ids")}
//               onRemove={(idx) => removeLine("refund_repartition_line_ids", idx)}
//             />
//           </div>
//         )}

//         {/* ── إعدادات متقدمة ────────────────────────────────────── */}
//         {tab === "advanced" && (
//           <div className="grid grid-cols-2 gap-x-10 gap-y-4 pt-2">
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium text-gray-700">التسمية على الفاتورة</label>
//               <input
//                 value={form.invoice_label}
//                 onChange={(e) => set("invoice_label", e.target.value)}
//                 placeholder="مثال: 15% VAT"
//                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//               />
//             </div>
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium text-gray-700">الشمول في السعر</label>
//               <select
//                 value={form.price_include_override}
//                 onChange={(e) => set("price_include_override", e.target.value)}
//                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//               >
//                 {PRICE_INCLUDE.map((o) => (
//                   <option key={o.value} value={o.value}>{o.label}</option>
//                 ))}
//               </select>
//             </div>

//             <div className="space-y-1.5 col-span-2">
//               <label className="text-sm font-medium text-gray-700">الوصف</label>
//               <textarea
//                 value={form.description}
//                 onChange={(e) => set("description", e.target.value)}
//                 rows={2}
//                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//               />
//             </div>

//             <div className="space-y-3 pt-2">
//               <div className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={form.analytic}
//                   onChange={(e) => set("analytic", e.target.checked)}
//                   className="w-4 h-4 accent-orange-500"
//                 />
//                 <label className="text-sm font-medium text-gray-700">تضمين في التكلفة التحليلية</label>
//               </div>
//               <div className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={form.include_base_amount}
//                   onChange={(e) => set("include_base_amount", e.target.checked)}
//                   className="w-4 h-4 accent-orange-500"
//                 />
//                 <label className="text-sm font-medium text-gray-700">تؤثر على أساس الضرائب اللاحقة</label>
//               </div>
//               <div className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={form.is_base_affected}
//                   onChange={(e) => set("is_base_affected", e.target.checked)}
//                   className="w-4 h-4 accent-orange-500"
//                 />
//                 <label className="text-sm font-medium text-gray-700">أساسها يتأثر بالضرائب السابقة</label>
//               </div>
//             </div>

//             <div className="space-y-1.5">
//               <label className="text-sm font-medium text-gray-700">ملاحظات قانونية</label>
//               <textarea
//                 value={form.invoice_legal_notes}
//                 onChange={(e) => set("invoice_legal_notes", e.target.value)}
//                 rows={2}
//                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//               />
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ────────────────────────────────────────────────────────────────────────
//    الصفحة الرئيسية — Taxes List
//    ──────────────────────────────────────────────────────────────────── */

// export default function Taxes() {
//   const { toast } = useToast();
//   const confirmDialog = useConfirm();

//   const [taxes, setTaxes] = useState([]);
//   const [accounts, setAccounts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [openingId, setOpeningId] = useState(null);
//   const [deletingId, setDeletingId] = useState(null);

//   const [selected, setSelected] = useState(null);
//   const [creating, setCreating] = useState(false);

//   const load = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const [taxesData, accountsData] = await Promise.all([
//         getTaxes(),
//         getAccounts().catch(() => []),
//       ]);
//       setTaxes(taxesData);
//       setAccounts(accountsData);
//     } catch (err) {
//       console.error("خطأ أثناء تحميل الضرائب:", err);
//       setError(extractApiErrorMessage(err, "تعذر تحميل الضرائب"));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const openEdit = async (id) => {
//     try {
//       setOpeningId(id);
//       const full = await getTax(id);
//       setSelected(full);
//     } catch (err) {
//       console.error("خطأ أثناء جلب الضريبة:", err);
//       toast({
//         title: "تعذّر فتح الضريبة",
//         description: extractApiErrorMessage(err),
//         variant: "destructive",
//       });
//     } finally {
//       setOpeningId(null);
//     }
//   };

//   const handleDelete = async (e, id) => {
//     e.stopPropagation();
//     const ok = await confirmDialog({
//       title: "حذف الضريبة",
//       message: "متأكد من حذف الضريبة دي؟",
//       confirmText: "حذف",
//       variant: "destructive",
//     });
//     if (!ok) return;
//     try {
//       setDeletingId(id);
//       await deleteTax(id);
//       toast({ title: "تم حذف الضريبة" });
//       load();
//     } catch (err) {
//       console.error("خطأ أثناء حذف الضريبة:", err);
//       toast({
//         title: "تعذّر حذف الضريبة",
//         description: extractApiErrorMessage(err),
//         variant: "destructive",
//       });
//     } finally {
//       setDeletingId(null);
//     }
//   };

//   const handleSaved = () => {
//     setSelected(null);
//     setCreating(false);
//     load();
//   };

//   if (selected) {
//     return <TaxForm tax={selected} accounts={accounts} onBack={() => setSelected(null)} onSaved={handleSaved} />;
//   }
//   if (creating) {
//     return <TaxForm tax={null} accounts={accounts} onBack={() => setCreating(false)} onSaved={handleSaved} />;
//   }

//   return (
//     <div className="p-6 space-y-5 w-full bg-white" dir="rtl">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//             الضرائب
//             <Percent className="w-5 h-5 text-gray-400" />
//           </h1>
//           <p className="text-sm text-gray-500 mt-0.5">إدارة ضرائب المبيعات والمشتريات وطريقة احتسابها</p>
//         </div>
//         <button
//           onClick={() => setCreating(true)}
//           className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
//         >
//           ضريبة جديدة <Plus className="w-4 h-4" />
//         </button>
//       </div>

//       {loading && (
//         <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
//           <Loader2 className="w-5 h-5 animate-spin" />
//           جاري تحميل الضرائب...
//         </div>
//       )}

//       {!loading && error && (
//         <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
//           <AlertCircle className="w-4 h-4" />
//           {error}
//           <button onClick={load} className="underline mr-auto">إعادة المحاولة</button>
//         </div>
//       )}

//       {!loading && !error && (
//         <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//           <table className="w-full text-sm">
//             <thead>
//               <tr className="border-b border-gray-200">
//                 {["اسم الضريبة", "الوصف", "النوع", "النطاق", "التسمية على الفاتورة", "الحالة", ""].map((h) => (
//                   <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {taxes.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="text-center py-10 text-gray-400">لا توجد ضرائب بعد</td>
//                 </tr>
//               ) : (
//                 taxes.map((t) => (
//                   <tr
//                     key={t.id}
//                     onClick={() => openEdit(t.id)}
//                     className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
//                   >
//                     <td className="px-4 py-3 font-semibold text-gray-800">{t.name}</td>
//                     <td className="px-4 py-3 text-gray-500">{t.description || "—"}</td>
//                     <td className="px-4 py-3">
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${TYPE_BADGE[t.type_tax_use] || "bg-gray-100 text-gray-600"}`}>
//                         {TYPE_LABEL[t.type_tax_use] || t.type_tax_use}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-gray-500">{t.tax_scope || "—"}</td>
//                     <td className="px-4 py-3 text-gray-500">{t.invoice_label || "—"}</td>
//                     <td className="px-4 py-3">
//                       <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
//                         {t.active ? "مفعّلة" : "معطّلة"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-left">
//                       <div className="flex items-center justify-end gap-3">
//                         <button
//                           onClick={(e) => handleDelete(e, t.id)}
//                           disabled={deletingId === t.id}
//                           className="text-gray-300 hover:text-red-500 p-1"
//                           title="حذف"
//                         >
//                           {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
//                         </button>
//                         {openingId === t.id ? (
//                           <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
//                         ) : (
//                           <ChevronLeft className="w-4 h-4 text-gray-300" />
//                         )}
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import {
  Percent,
  Plus,
  X,
  Save,
  Trash2,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getTaxes,
  getTax,
  createTax,
  updateTax,
  deleteTax,
} from "@/api/Taxesapi";
import { getAccounts, formatAccountLabel } from "@/api/accountingApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

/* ────────────────────────────────────────────────────────────────────────
   ثوابت وخيارات
   ──────────────────────────────────────────────────────────────────── */

const TAX_TYPE_USE = [
  { value: "sale", label: "مبيعات" },
  { value: "purchase", label: "مشتريات" },
  { value: "none", label: "بدون" },
];

const AMOUNT_TYPE = [
  { value: "percent", label: "نسبة مئوية" },
  { value: "fixed", label: "مبلغ ثابت" },
  { value: "division", label: "نسبة من السعر (شامل)" },
  { value: "group", label: "مجموعة ضرائب" },
];

const TAX_SCOPE = [
  { value: "", label: "بدون تحديد" },
  { value: "service", label: "خدمات" },
  { value: "consu", label: "سلع" },
];

const PRICE_INCLUDE = [
  { value: "default", label: "افتراضي" },
  { value: "tax_included", label: "شامل الضريبة" },
  { value: "tax_excluded", label: "غير شامل الضريبة" },
];

const REPARTITION_TYPES = [
  { value: "base", label: "الأساس (Base)" },
  { value: "tax", label: "الضريبة (Tax)" },
];

const TYPE_BADGE = {
  sale: "bg-blue-50 text-blue-600",
  purchase: "bg-orange-50 text-orange-600",
  none: "bg-gray-100 text-gray-600",
};
const TYPE_LABEL = Object.fromEntries(TAX_TYPE_USE.map((t) => [t.value, t.label]));

const EMPTY_LINE = (type = "tax") => ({
  _key: Date.now() + Math.random(),
  repartition_type: type,
  factor_percent: 100,
  account_id: "",
});

const EMPTY_TAX = {
  name: "",
  type_tax_use: "sale",
  amount_type: "percent",
  amount: 0,
  active: true,
  tax_scope: "",
  invoice_label: "",
  description: "",
  analytic: false,
  invoice_legal_notes: "",
  price_include_override: "default",
  include_base_amount: false,
  is_base_affected: false,
  invoice_repartition_line_ids: [EMPTY_LINE("base"), EMPTY_LINE("tax")],
  refund_repartition_line_ids: [EMPTY_LINE("base"), EMPTY_LINE("tax")],
};

// مفاتيح الأسطر اللي ممكن يتحذفوا منها (invoice / refund)
const LINE_KEYS = ["invoice_repartition_line_ids", "refund_repartition_line_ids"];
const deletedKey = (key) => `_deleted_${key}`;

const LINE_LABELS = {
  invoice_repartition_line_ids: "توزيع الفاتورة",
  refund_repartition_line_ids: "توزيع إشعار الدائن",
};

/**
 * أودو بيشترط إن كل من توزيع الفاتورة وتوزيع إشعار الدائن يحتوي على
 * سطر واحد بالظبط نوعه "base" (مش أكتر ولا أقل)، وممكن يكون فيه أي
 * عدد من أسطر "tax". لو الشرط ده اتخالف بيرجع الخطأ:
 * "Invoice and credit note distribution should each contain exactly
 * one line for..." لازم نتأكد من الشرط ده في الفرونت قبل ما نبعت
 * للباك اند عشان نوقف المستخدم برسالة واضحة بدل ما ياخد error عام.
 *
 * ملحوظة مهمة (إصلاح شرط الأربعة - تساوي عدد الأسطر):
 * الـ payload النهائي اللي بيتبعت للباك اند (buildPayload) بيحتوي على
 * الأسطر النشطة + الأسطر المحذوفة (بصيغة { id, _delete: true }) في
 * نفس الـ array الواحد. يعني لو المستخدم مسح سطر قديم (عنده id حقيقي)
 * من جدول الفاتورة بس، من غير ما يمسح حاجة من جدول إشعار الدائن،
 * فالـ payload الخام هيبقى فيه عدد عناصر مختلف بين الاتنين حتى لو
 * عدد الأسطر "النشطة" في الفورم متساوي. لازم الـ validation هنا
 * يتحقق من نفس العدد اللي هيتبعت فعليًا (نشط + محذوف)، مش بس عدد
 * الأسطر النشطة في الفورم، وإلا هيعدي محليًا ويترفض من السيرفر.
 */
function validateRepartitionLines(form) {
  for (const key of LINE_KEYS) {
    const label = LINE_LABELS[key];
    const lines = form[key];

    // شرط ١: سطر "base" واحد بالظبط
    const baseCount = lines.filter((l) => l.repartition_type === "base").length;
    if (baseCount !== 1) {
      return baseCount === 0
        ? `${label}: لازم يكون فيه سطر واحد نوعه "الأساس (Base)"، مفيش أي سطر بالنوع ده حاليًا.`
        : `${label}: لازم يكون فيه سطر واحد بس نوعه "الأساس (Base)"، حاليًا فيه ${baseCount} أسطر بنفس النوع. غيّري نوع الزيادة منهم إلى "الضريبة (Tax)".`;
    }

    // شرط ٢: على الأقل سطر "tax" واحد
    const taxLines = lines.filter((l) => l.repartition_type === "tax");
    if (taxLines.length === 0) {
      return `${label}: لازم يكون فيه سطر واحد على الأقل نوعه "الضريبة (Tax)".`;
    }

    // شرط ٣: مجموع نسب أسطر "tax" لازم يساوي 100 بالظبط
    const taxSum = taxLines.reduce((sum, l) => sum + (Number(l.factor_percent) || 0), 0);
    if (Math.abs(taxSum - 100) > 0.001) {
      return `${label}: مجموع نسب أسطر "الضريبة (Tax)" لازم يساوي 100%، حاليًا المجموع = ${taxSum}%.`;
    }
  }

  // شرط ٤: عدد أسطر توزيع الفاتورة لازم يساوي عدد أسطر توزيع إشعار الدائن
  // (أودو بيرفض لو الهيكل مش متماثل بين الاتنين).
  //
  // *** الإصلاح ***: بنحسب "العدد الخام" اللي هيتبعت فعليًا في الـ payload
  // (عدد الأسطر النشطة + عدد الأسطر المحذوفة لنفس الجدول)، مش بس عدد
  // الأسطر النشطة الظاهرة في الفورم. ده لأن buildPayload بيحط أسطر
  // الـ delete جوه نفس الـ array، فلو جدول اتمسح منه سطر قديم والتاني لأ،
  // هيبقى فيه فرق في العدد الخام حتى لو العدد النشط متساوي في الشكل.
  const invoiceRawCount =
    form.invoice_repartition_line_ids.length +
    (form[deletedKey("invoice_repartition_line_ids")]?.length || 0);
  const refundRawCount =
    form.refund_repartition_line_ids.length +
    (form[deletedKey("refund_repartition_line_ids")]?.length || 0);

  if (invoiceRawCount !== refundRawCount) {
    return `عدد أسطر "توزيع الفاتورة" اللي هيتبعت فعليًا (${invoiceRawCount}) لازم يساوي عدد أسطر "توزيع إشعار الدائن" (${refundRawCount})، مع الأخذ في الاعتبار الأسطر المحذوفة. جربي تضيفي/تمسحي سطر عشان العددين يتساووا (لو مسحتي سطر قديم من جدول واحد بس، لازم تمسحي سطر قديم مماثل من الجدول التاني، أو تضيفي سطر جديد في الجدول التاني عشان الهيكل يفضل متماثل).`;
  }

  return null;
}

/**
 * بناء الـ Payload اللي بيتبعت للباك اند من شكل الفورم المحلي
 *
 * ملاحظة مهمة (الإصلاح 1 - Update بدل Delete+Create):
 * لازم نبعت الـ id بتاع كل سطر توزيع (repartition line) لو كان موجود
 * (يعني السطر ده أصلاً موجود في قاعدة البيانات وجاي من getTax).
 * لو ما بعتناش الـ id، الباك اند مش هيعرف يفرّق بين "سطر قديم اتعدل"
 * و"سطر جديد".
 *
 * ملاحظة مهمة (الإصلاح 2 - حذف الأسطر):
 * لو المستخدم مسح سطر كان أصلاً جاي من الباك اند (عنده id حقيقي)،
 * مينفعش نكتفي بشيله من الـ state المحلي وبس، لازم نبعته في الـ
 * payload بصيغة { id, _delete: true } عشان يتمسح فعلاً من أودو.
 * الأسطر الجديدة اللي المستخدم أضافها وبعدين مسحها (مالهاش id) بتتشال
 * من غير ما تتبعت خالص، لأنها أصلاً معملهاش create.
 *
 * تنبيه: نفس الأسطر دي هي سبب مشكلة "عدد الأسطر" (شرط 4) اللي بيرفضها
 * السيرفر — راجعي validateRepartitionLines فوق وتأكدي من الـ payload
 * الفعلي في Network tab لو حصلت المشكلة تاني.
 */
function buildPayload(form) {
  const mapLines = (key) => {
    const lines = form[key].map((l) => {
      const line = {
        repartition_type: l.repartition_type,
        factor_percent: Number(l.factor_percent) || 0,
      };

      // لو السطر ده جاي من الباك اند أصلاً (عنده id رقمي حقيقي) ابعتيه
      // عشان يبقى update مش delete+create
      if (l.id) {
        line.id = l.id;
      }

      if (l.account_id) {
        line.account_id = Number(l.account_id);
      }
      return line;
    });

    // الأسطر اللي اتمسحت وكانت أصلاً موجودة في الباك اند (ليها id حقيقي)
    const deletedIds = form[deletedKey(key)] || [];
    const deletedLines = deletedIds.map((id) => ({ id, _delete: true }));

    return [...lines, ...deletedLines];
  };

  const payload = {
    name: form.name.trim(),
    amount: Number(form.amount) || 0,
    type_tax_use: form.type_tax_use,
    amount_type: form.amount_type,
    description: form.description?.trim() || "",
    active: !!form.active,
    tax_scope: form.tax_scope || null,
    invoice_label: form.invoice_label?.trim() || "",
    analytic: !!form.analytic,
    include_base_amount: !!form.include_base_amount,
    is_base_affected: !!form.is_base_affected,
    invoice_repartition_line_ids: mapLines("invoice_repartition_line_ids"),
    refund_repartition_line_ids: mapLines("refund_repartition_line_ids"),
  };

  // "default" معناها متبعتيش الحقل خالص، مش إنك تبعتي النص الحرفي "default"
  // (أودو بيرفضها كـ ValidationError لأنها مش من ضمن القيم المسموح بيها فعليًا)
  if (form.price_include_override && form.price_include_override !== "default") {
    payload.price_include_override = form.price_include_override;
  }

  return payload;
}

/* ────────────────────────────────────────────────────────────────────────
   جدول توزيع الفاتورة / الإشعار الدائن (Repartition Lines)
   ──────────────────────────────────────────────────────────────────── */

function RepartitionTable({ title, lines, accounts, onChange, onAdd, onRemove }) {
  // فين سطر الـ "base" الوحيد الموجود حاليًا (لو موجود). أي سطر تاني
  // غير ده، هيتشال من قايمة اختياراته خيار "base" خالص عشان يستحيل
  // يبقى فيه أكتر من سطر base واحد في نفس الجدول (شرط أودو).
  const baseIndex = lines.findIndex((l) => l.repartition_type === "base");

  // مجموع نسب أسطر "tax" فقط (مش base) — أودو بيشترط يساوي 100 بالظبط
  const taxLinesCount = lines.filter((l) => l.repartition_type === "tax").length;
  const taxSum = lines
    .filter((l) => l.repartition_type === "tax")
    .reduce((sum, l) => sum + (Number(l.factor_percent) || 0), 0);
  const taxSumOk = Math.abs(taxSum - 100) < 0.001;

  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{title}</p>
      {/* رسالة توضيحية للمستخدم: ليه بعض الأسطر مش هتقدر تختارلها "الأساس" */}
      <p className="text-[11px] text-gray-400 mb-2">
        لازم يكون فيه سطر واحد بس نوعه "الأساس (Base)"، وسطر واحد على الأقل نوعه "الضريبة (Tax)"، ومجموع نسب أسطر "الضريبة" يساوي 100%.
      </p>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-right px-3 py-2 font-medium text-gray-500">%</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">النوع</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">الحساب</th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const canBeBase = l.repartition_type === "base" || baseIndex === -1;
              const typeOptions = canBeBase
                ? REPARTITION_TYPES
                : REPARTITION_TYPES.filter((t) => t.value !== "base");
              return (
                <tr key={l._key ?? i} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      value={l.factor_percent}
                      onChange={(e) => onChange(i, "factor_percent", e.target.value)}
                      className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={l.repartition_type}
                      onChange={(e) => onChange(i, "repartition_type", e.target.value)}
                      title={
                        !canBeBase
                          ? 'في سطر "الأساس" تاني في نفس الجدول، مينفعش يبقى فيه اتنين'
                          : undefined
                      }
                      className="px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                    >
                      {typeOptions.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {/*
                      الإصلاح 3: شيلنا disabled={repartition_type === "base"}.
                      زي ما ظاهر في رد الباك اند، سطر من نوع "base" ممكن يكون
                      ليه account_id فعلي (مثال: id:2 في invoice_repartition_line_ids
                      عنده account_id=22 مع إنه base). فلو سيبنا الـ select
                      disabled، اسم الحساب المختار هيفضل مخفي/رمادي حتى لو
                      موجود فعلاً في البيانات. دلوقتي الـ select شغال لكل
                      الأسطر وبيعرض اسم الحساب المختار طبيعي.
                    */}
                    <select
                      value={l.account_id}
                      onChange={(e) => onChange(i, "account_id", e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 min-w-[160px]"
                    >
                      <option value="">بدون حساب...</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>{formatAccountLabel(a)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    {/*
                      الإصلاح 5: منع مسح آخر سطر "tax" في الجدول، عشان
                      شرط أودو "لازم يكون فيه سطر tax واحد على الأقل"
                      يفضل متحقق دايمًا من غير ما نستنى رسالة خطأ بعد الحفظ.
                    */}
                    <button
                      onClick={() => onRemove(i)}
                      disabled={lines.length <= 1 || (l.repartition_type === "tax" && taxLinesCount <= 1)}
                      title={
                        l.repartition_type === "tax" && taxLinesCount <= 1
                          ? 'لازم يفضل سطر "الضريبة" واحد على الأقل'
                          : undefined
                      }
                      className="p-1 hover:bg-red-50 text-red-400 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
          <button onClick={onAdd} className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline">
            <Plus className="w-3 h-3" /> إضافة سطر
          </button>
          <span className={`text-[11px] font-medium ${taxSumOk ? "text-green-600" : "text-red-500"}`}>
            مجموع نسب الضريبة: {taxSum}% {taxSumOk ? "✓" : "(لازم يساوي 100%)"}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   صفحة إنشاء / تعديل ضريبة — Inline Page (مش Modal)
   ──────────────────────────────────────────────────────────────────── */

function TaxForm({ tax, accounts, onBack, onSaved }) {
  const { toast } = useToast();
  const isEdit = Boolean(tax?.id);

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...EMPTY_TAX,
          ...tax,
          // الباك اند بيرجع false بدل null/"" لحقول زي tax_scope,
          // price_include_override, invoice_legal_notes... لازم نطبّعها
          // عشان مكوّنات الفورم متبقاش controlled بقيمة false (بيعمل
          // warning في React ومينفعش يتعرض في input/textarea).
          tax_scope: tax.tax_scope || "",
          invoice_label: tax.invoice_label || "",
          description: tax.description || "",
          invoice_legal_notes: tax.invoice_legal_notes || "",
          price_include_override: tax.price_include_override || "default",
          invoice_repartition_line_ids: (tax.invoice_repartition_line_ids?.length
            ? tax.invoice_repartition_line_ids
            : EMPTY_TAX.invoice_repartition_line_ids
          ).map((l) => ({ ...l, _key: l.id ?? Date.now() + Math.random(), account_id: l.account_id || "" })),
          refund_repartition_line_ids: (tax.refund_repartition_line_ids?.length
            ? tax.refund_repartition_line_ids
            : EMPTY_TAX.refund_repartition_line_ids
          ).map((l) => ({ ...l, _key: l.id ?? Date.now() + Math.random(), account_id: l.account_id || "" })),
          // قوايم الأسطر اللي هتتحذف عند الحفظ (تتبنى وقت الحذف من الفورم)
          [deletedKey("invoice_repartition_line_ids")]: [],
          [deletedKey("refund_repartition_line_ids")]: [],
        }
      : {
          ...EMPTY_TAX,
          [deletedKey("invoice_repartition_line_ids")]: [],
          [deletedKey("refund_repartition_line_ids")]: [],
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const tabs = [
    { id: "definition", label: "التعريف" },
    { id: "advanced", label: "إعدادات متقدمة" },
  ];
  const [tab, setTab] = useState("definition");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setLine = (key, idx, field, value) =>
    setForm((f) => ({ ...f, [key]: f[key].map((l, i) => (i === idx ? { ...l, [field]: value } : l)) }));

  const addLine = (key) => setForm((f) => ({ ...f, [key]: [...f[key], EMPTY_LINE("tax")] }));

  // الإصلاح 2: لو السطر اللي بيتمسح عنده id حقيقي (جاي من الباك اند)،
  // بنسجله في قايمة الحذف بدل ما يختفي بس من غير ما يتبعت للباك اند.
  const removeLine = (key, idx) =>
    setForm((f) => {
      if (f[key].length <= 1) return f;
      const removed = f[key][idx];
      const remaining = f[key].filter((_, i) => i !== idx);
      if (removed.id) {
        return {
          ...f,
          [key]: remaining,
          [deletedKey(key)]: [...(f[deletedKey(key)] || []), removed.id],
        };
      }
      return { ...f, [key]: remaining };
    });

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) return;

    // الإصلاح 4: التأكد إن كل جدول فيه سطر "base" واحد بالظبط، وإن
    // العدد "الخام" (نشط + محذوف) متساوي بين الفاتورة وإشعار الدائن،
    // قبل ما نبعت أي حاجة للباك اند. ده بيمنع خطأ
    // "Invoice and credit note distribution should have the same
    // number of lines" اللي كان بيحصل حتى لو العدد النشط في الفورم
    // شكله متساوي (لأن الأسطر المحذوفة كانت بتتحسب بشكل مختلف بين
    // الجدولين وقت بناء الـ payload).
    const validationError = validateRepartitionLines(form);
    if (validationError) {
      setError(validationError);
      setTab("definition");
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload(form);
      if (isEdit) {
        await updateTax(tax.id, payload);
      } else {
        await createTax(payload);
      }
      onSaved();
    } catch (err) {
      console.error("خطأ أثناء حفظ الضريبة:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ الضريبة"));
      toast({
        title: "تعذّر حفظ الضريبة",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} title="إلغاء" className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            title="حفظ"
            className="text-orange-500 hover:text-orange-600 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <span className="text-gray-800 font-medium">{isEdit ? tax.name : "جديد"}</span>
          <span>/</span>
          <span>الضرائب</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* اسم الضريبة + النوع والحساب */}
        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">* اسم الضريبة</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="مثال: ضريبة القيمة المضافة 15%"
              className="w-full text-2xl font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-orange-400 pb-2 bg-transparent placeholder:text-gray-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">نوع الضريبة</label>
            <select
              value={form.type_tax_use}
              onChange={(e) => set("type_tax_use", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              {TAX_TYPE_USE.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">طريقة الاحتساب</label>
            <select
              value={form.amount_type}
              onChange={(e) => set("amount_type", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              {AMOUNT_TYPE.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">نطاق الضريبة</label>
            <select
              value={form.tax_scope}
              onChange={(e) => set("tax_scope", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              {TAX_SCOPE.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">القيمة</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className="w-32 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
              {form.amount_type === "percent" && <span className="text-sm text-gray-500">%</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            <label className="text-sm font-medium text-gray-700">مفعّلة</label>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── التعريف: توزيع الفاتورة والإشعار الدائن ─────────────── */}
        {tab === "definition" && (
          <div className="pt-2 space-y-2">
            {(() => {
              // نفس منطق الإصلاح 4: البانر التحذيري في أعلى الجدولين
              // لازم يعتمد على العدد "الخام" (نشط + محذوف) مش بس عدد
              // الأسطر النشطة في الفورم، عشان يعكس فعليًا اللي هيتبعت
              // للباك اند وقت الحفظ.
              const invoiceRawCount =
                form.invoice_repartition_line_ids.length +
                (form[deletedKey("invoice_repartition_line_ids")]?.length || 0);
              const refundRawCount =
                form.refund_repartition_line_ids.length +
                (form[deletedKey("refund_repartition_line_ids")]?.length || 0);
              if (invoiceRawCount === refundRawCount) return null;
              return (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  عدد أسطر توزيع الفاتورة اللي هيتبعت فعليًا ({invoiceRawCount}) مش مساوي عدد أسطر توزيع إشعار الدائن ({refundRawCount})، مع الأخذ في الاعتبار الأسطر المحذوفة. لازم يتساووا قبل الحفظ.
                </div>
              );
            })()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RepartitionTable
                title="توزيع الفاتورة (Invoices)"
                lines={form.invoice_repartition_line_ids}
                accounts={accounts}
                onChange={(idx, field, value) => setLine("invoice_repartition_line_ids", idx, field, value)}
                onAdd={() => addLine("invoice_repartition_line_ids")}
                onRemove={(idx) => removeLine("invoice_repartition_line_ids", idx)}
              />
              <RepartitionTable
                title="توزيع إشعار الدائن (Refunds)"
                lines={form.refund_repartition_line_ids}
                accounts={accounts}
                onChange={(idx, field, value) => setLine("refund_repartition_line_ids", idx, field, value)}
                onAdd={() => addLine("refund_repartition_line_ids")}
                onRemove={(idx) => removeLine("refund_repartition_line_ids", idx)}
              />
            </div>
          </div>
        )}

        {/* ── إعدادات متقدمة ────────────────────────────────────── */}
        {tab === "advanced" && (
          <div className="grid grid-cols-2 gap-x-10 gap-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">التسمية على الفاتورة</label>
              <input
                value={form.invoice_label}
                onChange={(e) => set("invoice_label", e.target.value)}
                placeholder="مثال: 15% VAT"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">الشمول في السعر</label>
              <select
                value={form.price_include_override}
                onChange={(e) => set("price_include_override", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              >
                {PRICE_INCLUDE.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-medium text-gray-700">الوصف</label>
              <textarea
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.analytic}
                  onChange={(e) => set("analytic", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <label className="text-sm font-medium text-gray-700">تضمين في التكلفة التحليلية</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.include_base_amount}
                  onChange={(e) => set("include_base_amount", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <label className="text-sm font-medium text-gray-700">تؤثر على أساس الضرائب اللاحقة</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.is_base_affected}
                  onChange={(e) => set("is_base_affected", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <label className="text-sm font-medium text-gray-700">أساسها يتأثر بالضرائب السابقة</label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">ملاحظات قانونية</label>
              <textarea
                value={form.invoice_legal_notes}
                onChange={(e) => set("invoice_legal_notes", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية — Taxes List
   ──────────────────────────────────────────────────────────────────── */

export default function Taxes() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [taxes, setTaxes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [taxesData, accountsData] = await Promise.all([
        getTaxes(),
        getAccounts().catch(() => []),
      ]);
      setTaxes(taxesData);
      setAccounts(accountsData);
    } catch (err) {
      console.error("خطأ أثناء تحميل الضرائب:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل الضرائب"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = async (id) => {
    try {
      setOpeningId(id);
      const full = await getTax(id);
      setSelected(full);
    } catch (err) {
      console.error("خطأ أثناء جلب الضريبة:", err);
      toast({
        title: "تعذّر فتح الضريبة",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: "حذف الضريبة",
      message: "متأكد من حذف الضريبة دي؟",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteTax(id);
      toast({ title: "تم حذف الضريبة" });
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف الضريبة:", err);
      toast({
        title: "تعذّر حذف الضريبة",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setSelected(null);
    setCreating(false);
    load();
  };

  if (selected) {
    return <TaxForm tax={selected} accounts={accounts} onBack={() => setSelected(null)} onSaved={handleSaved} />;
  }
  if (creating) {
    return <TaxForm tax={null} accounts={accounts} onBack={() => setCreating(false)} onSaved={handleSaved} />;
  }

  return (
    <div className="p-6 space-y-5 w-full bg-white" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            الضرائب
            <Percent className="w-5 h-5 text-gray-400" />
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">إدارة ضرائب المبيعات والمشتريات وطريقة احتسابها</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          ضريبة جديدة <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري تحميل الضرائب...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={load} className="underline mr-auto">إعادة المحاولة</button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["اسم الضريبة", "الوصف", "النوع", "النطاق", "التسمية على الفاتورة", "الحالة", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taxes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">لا توجد ضرائب بعد</td>
                </tr>
              ) : (
                taxes.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openEdit(t.id)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{t.name}</td>
                    <td className="px-4 py-3 text-gray-500">{t.description || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${TYPE_BADGE[t.type_tax_use] || "bg-gray-100 text-gray-600"}`}>
                        {TYPE_LABEL[t.type_tax_use] || t.type_tax_use}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.tax_scope || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{t.invoice_label || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${t.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {t.active ? "مفعّلة" : "معطّلة"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => handleDelete(e, t.id)}
                          disabled={deletingId === t.id}
                          className="text-gray-300 hover:text-red-500 p-1"
                          title="حذف"
                        >
                          {deletingId === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        {openingId === t.id ? (
                          <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
                        ) : (
                          <ChevronLeft className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}