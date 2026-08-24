// import { useState, useEffect } from "react";
// import {
//   BookText,
//   Plus,
//   X,
//   Save,
//   Trash2,
//   ChevronLeft,
//   Loader2,
// } from "lucide-react";
// import {
//   getJournals,
//   getJournal,
//   createJournal,
//   updateJournal,
//   deleteJournal,
//   getJournalPaymentMethods,
//   getGeneralPaymentMethods,
//   getAllAccounts,
// } from "../../api/Journalsapi";
// import { usePagination } from "@/lib/usePagination";
// import TablePagination from "@/components/ui/TablePagination";

// /* ────────────────────────────────────────────────────────────────────────
//    Config
//    ──────────────────────────────────────────────────────────────────── */

// // value = القيمة اللي بتتعرض/بتتبعت للفرونت، apiValue = القيمة الحقيقية اللي الـ backend بيفهمها
// const JOURNAL_TYPES = [
//   { value: "sale", apiValue: "sale", label: "مبيعات" },
//   { value: "purchase", apiValue: "purchase", label: "مشتريات" },
//   { value: "cash", apiValue: "cash", label: "نقدية" },
//   { value: "bank", apiValue: "bank", label: "بنك" },
//   { value: "credit_card", apiValue: "credit", label: "بطاقة ائتمان" },
//   { value: "general", apiValue: "general", label: "متنوع" },
// ];
// const TYPE_LABEL = Object.fromEntries(JOURNAL_TYPES.map((t) => [t.value, t.label]));
// const toApiType = (v) => JOURNAL_TYPES.find((t) => t.value === v)?.apiValue || v;
// const fromApiType = (v) => JOURNAL_TYPES.find((t) => t.apiValue === v)?.value || v;

// const TYPE_BADGE = {
//   sale: "bg-blue-50 text-blue-600",
//   purchase: "bg-orange-50 text-orange-600",
//   cash: "bg-green-50 text-green-700",
//   bank: "bg-cyan-50 text-cyan-700",
//   credit_card: "bg-purple-50 text-purple-700",
//   general: "bg-gray-100 text-gray-600",
// };

// const PAYMENT_CAPABLE_TYPES = ["cash", "bank", "credit_card"];

// const REFERENCE_TYPE_OPTIONS = [
//   { value: "invoice", label: "بناءً على الفاتورة" },
//   { value: "partner", label: "بناءً على العميل" },
//   { value: "none", label: "بدون" },
// ];
// const REFERENCE_MODEL_OPTIONS = [
//   { value: "odoo", label: "Odoo" },
//   { value: "euro", label: "Euro" },
// ];

// const EMPTY_JOURNAL = {
//   name: "",
//   type: "sale",
//   short_code: "",
//   active: true,
//   income_account_id: null,   // used when type === sale (default_account_id)
//   expense_account_id: null,  // used when type === purchase (default_account_id)
//   cash_bank_account_id: null,// used when hasPayments (default_account_id)
//   suspense_account_id: null,
//   profit_account_id: null,
//   loss_account_id: null,
//   dedicated_sequence: true,        // refund_sequence / payment_sequence
//   allowed_accounts: [],             // account_control_ids
//   secure_posted_entries: false,     // restrict_mode_hash_table
//   auto_check_on_post: true,         // autocheck_on_post
//   invoice_reference_type: "invoice",
//   invoice_reference_model: "odoo",
//   // كل سطر: { payment_method_id, name, payment_account_id }
//   inbound_payment_lines: [],
//   outbound_payment_lines: [],
// };

// /* ────────────────────────────────────────────────────────────────────────
//    Helpers
//    ──────────────────────────────────────────────────────────────────── */

// function accountLabel(acc) {
//   if (!acc) return "";
//   return `${acc.code} ${acc.name_ar || acc.name}`;
// }

// // من رد الـ API (getJournal) لشكل الفورم المحلي
// function apiJournalToForm(j) {
//   return {
//     ...EMPTY_JOURNAL,
//     id: j.id,
//     name: j.name || "",
//     type: fromApiType(j.type),
//     short_code: j.code || "",
//     active: j.active ?? true,
//     income_account_id: j.type === "sale" ? j.default_account_id || null : null,
//     expense_account_id: j.type === "purchase" ? j.default_account_id || null : null,
//     cash_bank_account_id:
//       ["cash", "bank", "credit"].includes(j.type) ? j.default_account_id || null : null,
//     suspense_account_id: j.suspense_account_id || null,
//     profit_account_id: j.profit_account_id || null,
//     loss_account_id: j.loss_account_id || null,
//     dedicated_sequence: j.refund_sequence ?? j.payment_sequence ?? true,
//     allowed_accounts: j.account_control_ids || [],
//     secure_posted_entries: j.restrict_mode_hash_table || false,
//     auto_check_on_post: j.autocheck_on_post ?? true,
//     invoice_reference_type: j.invoice_reference_type || "invoice",
//     invoice_reference_model: j.invoice_reference_model || "odoo",
//     inbound_payment_lines: (j.inbound_payment_methods || []).map((m) => ({
//       payment_method_id: m.payment_method_id ?? m.id,
//       name: m.name || "",
//       payment_account_id: m.payment_account_id || null,
//     })),
//     outbound_payment_lines: (j.outbound_payment_methods || []).map((m) => ({
//       payment_method_id: m.payment_method_id ?? m.id,
//       name: m.name || "",
//       payment_account_id: m.payment_account_id || null,
//     })),
//   };
// }

// // من الفورم المحلي لشكل الـ payload اللي الـ API محتاجه
// function formToPayload(form) {
//   const isSaleOrPurchase = form.type === "sale" || form.type === "purchase";
//   const hasPayments = PAYMENT_CAPABLE_TYPES.includes(form.type);

//   const default_account_id =
//     form.type === "sale"
//       ? form.income_account_id
//       : form.type === "purchase"
//       ? form.expense_account_id
//       : hasPayments
//       ? form.cash_bank_account_id
//       : null;

//   const payload = {
//     name: form.name,
//     type: toApiType(form.type),
//     code: form.short_code,
//     active: form.active,
//     default_account_id: default_account_id || false,
//     restrict_mode_hash_table: form.secure_posted_entries,
//     autocheck_on_post: form.auto_check_on_post,
//     account_control_ids: [[6, 0, form.allowed_accounts]],
//   };

//   if (isSaleOrPurchase) {
//     payload.refund_sequence = form.dedicated_sequence;
//     payload.invoice_reference_type = form.invoice_reference_type;
//     payload.invoice_reference_model = form.invoice_reference_model;
//   }

//   if (hasPayments) {
//     payload.payment_sequence = form.dedicated_sequence;
//     payload.suspense_account_id = form.suspense_account_id || false;

//   payload.inbound_payment_method_line_ids = form.inbound_payment_lines.map((l) => ({
//   payment_method_id: l.payment_method_id,
//   payment_account_id: l.payment_account_id || false,
// }));

// payload.outbound_payment_method_line_ids = form.outbound_payment_lines.map((l) => ({
//   payment_method_id: l.payment_method_id,
//   payment_account_id: l.payment_account_id || false,
// }));
//   }

//   if (form.type === "cash") {
//     payload.profit_account_id = form.profit_account_id || false;
//     payload.loss_account_id = form.loss_account_id || false;
//   }

//   return payload;
// }

// /* ────────────────────────────────────────────────────────────────────────
//    صفحة إنشاء / تعديل دفتر يومية
//    ──────────────────────────────────────────────────────────────────── */

// function JournalForm({ journalId, accounts, onBack, onSaved, onDeleted }) {
//   const isEdit = Boolean(journalId);
//   const [form, setForm] = useState({ ...EMPTY_JOURNAL });
//   const [loading, setLoading] = useState(isEdit);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState(false);
//   const [error, setError] = useState(null);
//   const [paymentMethods, setPaymentMethods] = useState({ inbound: [], outbound: [] });
//   const [tab, setTab] = useState("entries");

//   const hasPayments = PAYMENT_CAPABLE_TYPES.includes(form.type);
//   const isSaleOrPurchase = form.type === "sale" || form.type === "purchase";

//   const outstandingReceiptsAccounts = accounts.filter(
//   (a) => a.account_type === "asset_current"
// );

// const outstandingPaymentsAccounts = accounts.filter(
//   (a) =>
//     a.account_type === "asset_current" ||
//     a.account_type === "liability_current"
// );

//   // جلب بيانات الدفتر عند التعديل
//   useEffect(() => {
//     if (!isEdit) return;
//     let alive = true;
//     setLoading(true);
//     getJournal(journalId)
//       .then((j) => {
//         if (!alive) return;
//         setForm(apiJournalToForm(j));
//       })
//       .catch((e) => alive && setError(e?.message || "تعذر تحميل بيانات الدفتر"))
//       .finally(() => alive && setLoading(false));
//     return () => {
//       alive = false;
//     };
//   }, [isEdit, journalId]);

//   // جلب طرق الدفع المتاحة (اللي ممكن تتضاف):
//   // - دفتر جديد (لسه ماتسجلش) → طرق الدفع العامة /accounting/payment-methods
//   // - دفتر متسجل بالفعل → طرق الدفع الخاصة بيه /journals/:id/payment-methods
//   useEffect(() => {
//     if (!hasPayments) return;
//     let alive = true;
//     const request = isEdit ? getJournalPaymentMethods(journalId) : getGeneralPaymentMethods();
//     request
//       .then((res) => alive && setPaymentMethods(res))
//       .catch(() => alive && setPaymentMethods({ inbound: [], outbound: [] }));
//     return () => {
//       alive = false;
//     };
//   }, [hasPayments, isEdit, journalId]);

//   const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

//   const toggleAllowedAccount = (id) =>
//     setForm((f) => ({
//       ...f,
//       allowed_accounts: f.allowed_accounts.includes(id)
//         ? f.allowed_accounts.filter((a) => a !== id)
//         : [...f.allowed_accounts, id],
//     }));

//   // إضافة/حذف/تعديل سطر طريقة دفع (Incoming أو Outgoing)
//   const addPaymentLine = (linesKey, method) =>
//     setForm((f) => {
//       if (f[linesKey].some((l) => l.payment_method_id === method.id)) return f;
//       return {
//         ...f,
//         [linesKey]: [
//           ...f[linesKey],
//           { payment_method_id: method.id, name: method.name, payment_account_id: null },
//         ],
//       };
//     });

//   const removePaymentLine = (linesKey, idx) =>
//     setForm((f) => ({ ...f, [linesKey]: f[linesKey].filter((_, i) => i !== idx) }));

//   const setPaymentLineAccount = (linesKey, idx, accId) =>
//     setForm((f) => ({
//       ...f,
//       [linesKey]: f[linesKey].map((l, i) => (i === idx ? { ...l, payment_account_id: accId } : l)),
//     }));

//   const tabs = [
//     { id: "entries", label: "بنود الدفتر" },
//     ...(hasPayments ? [{ id: "incoming", label: "الدفعات الواردة" }] : []),
//     ...(hasPayments ? [{ id: "outgoing", label: "الدفعات الصادرة" }] : []),
//     { id: "advanced", label: "إعدادات متقدمة" },
//   ];

//   const handleSave = async () => {
//     setSaving(true);
//     setError(null);
//     try {
//       const payload = formToPayload(form);
//       if (isEdit) {
//         await updateJournal(journalId, payload);
//       } else {
//         await createJournal(payload);
//       }
//       onSaved();
//     } catch (e) {
//       setError(e?.response?.data?.message || e?.message || "تعذر حفظ الدفتر");
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleDelete = async () => {
//     if (!window.confirm("متأكد إنك عايز تحذف دفتر اليومية ده؟")) return;
//     setDeleting(true);
//     setError(null);
//     try {
//       await deleteJournal(journalId);
//       onDeleted();
//     } catch (e) {
//       setError(e?.response?.data?.message || e?.message || "تعذر حذف الدفتر");
//       setDeleting(false);
//     }
//   };

//   const accountSelect = (label, field, filterFn) => (
//     <div className="space-y-1.5 col-span-2 sm:col-span-1">
//       <label className="text-sm font-medium text-gray-700">{label}</label>
//       <select
//         value={form[field] ?? ""}
//         onChange={(e) => set(field, e.target.value ? Number(e.target.value) : null)}
//         className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//       >
//         <option value="">اختر الحساب...</option>
//         {accounts.filter(filterFn).map((a) => (
//           <option key={a.id} value={a.id}>
//             {accountLabel(a)}
//           </option>
//         ))}
//       </select>
//     </div>
//   );

//   // جدول طرق الدفع لتاب معيّن (Incoming أو Outgoing)
//   const renderPaymentMethodsTable = (tabId) => {
//     const linesKey = tabId === "incoming" ? "inbound_payment_lines" : "outbound_payment_lines";
//     const availableKey = tabId === "incoming" ? "inbound" : "outbound";
//     const available = paymentMethods[availableKey] || [];
//    const lines = form[linesKey];

// const notAdded = available.filter(
//   (m) => !lines.some((l) => l.payment_method_id === m.id)
// );

// const outstandingAccounts =
//   tabId === "incoming"
//     ? outstandingReceiptsAccounts
//     : outstandingPaymentsAccounts;
//     return (
//       <div className="border border-gray-200 rounded-lg overflow-hidden">
//         <table className="w-full text-xs">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200">
//               <th className="text-right px-3 py-2 font-medium text-gray-500">طريقة الدفع</th>
//               <th className="text-right px-3 py-2 font-medium text-gray-500">
//                 {tabId === "incoming" ? "حساب الإيصالات المعلقة" : "حساب الدفعات المعلقة"}
//               </th>
//               <th className="px-2 py-2" />
//             </tr>
//           </thead>
//           <tbody>
//             {lines.length === 0 ? (
//               <tr>
//                 <td colSpan={3} className="text-center py-4 text-gray-400">
//                   لا توجد طرق دفع مضافة
//                 </td>
//               </tr>
//             ) : (
//               lines.map((l, i) => (
//                 <tr key={l.payment_method_id} className="border-b border-gray-100 last:border-0">
//                   <td className="px-3 py-2 text-gray-700">{l.name}</td>
//                   <td className="px-3 py-2">
//                     <select
//                       value={l.payment_account_id ?? ""}
//                       onChange={(e) =>
//                         setPaymentLineAccount(linesKey, i, e.target.value ? Number(e.target.value) : null)
//                       }
//                       className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
//                     >
//                       <option value="">اختر الحساب...</option>
//                       {outstandingAccounts.map((a) => (
//                         <option key={a.id} value={a.id}>
//                           {accountLabel(a)}
//                         </option>
//                       ))}
//                     </select>
//                   </td>
//                   <td className="px-2 py-2">
//                     <button
//                       onClick={() => removePaymentLine(linesKey, i)}
//                       className="p-1 hover:bg-red-50 text-red-400 rounded"
//                     >
//                       <Trash2 className="w-3.5 h-3.5" />
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//         {notAdded.length > 0 && (
//           <div className="px-3 py-2 border-t border-gray-100">
//             <select
//               value=""
//               onChange={(e) => {
//                 const m = available.find((x) => x.id === Number(e.target.value));
//                 if (m) addPaymentLine(linesKey, m);
//               }}
//               className="text-xs text-orange-600 font-medium border-0 bg-transparent focus:outline-none cursor-pointer"
//             >
//               <option value="">+ إضافة طريقة دفع...</option>
//               {notAdded.map((m) => (
//                 <option key={m.id} value={m.id}>
//                   {m.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//         )}
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="w-full bg-white flex items-center justify-center py-24" dir="rtl">
//         <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="w-full bg-white" dir="rtl">
//       <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
//         <div className="flex items-center gap-3">
//           <button onClick={onBack} title="إلغاء" className="text-gray-400 hover:text-gray-600">
//             <X className="w-5 h-5" />
//           </button>
//           <button
//             onClick={handleSave}
//             disabled={!form.name || !form.type || saving}
//             title="حفظ"
//             className="text-orange-500 hover:text-orange-600 disabled:opacity-40"
//           >
//             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
//           </button>
//           {isEdit && (
//             <button
//               onClick={handleDelete}
//               disabled={deleting}
//               title="حذف"
//               className="text-red-400 hover:text-red-600 disabled:opacity-40"
//             >
//               {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
//             </button>
//           )}
//         </div>
//         <div className="flex items-center gap-1.5 text-sm text-gray-400">
//           <span className="text-gray-800 font-medium">{isEdit ? form.name : "جديد"}</span>
//           <span>/</span>
//           <span>دفاتر اليومية</span>
//         </div>
//       </div>

//       {error && (
//         <div className="mx-6 mt-4 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
//           {error}
//         </div>
//       )}

//       <div className="p-6 space-y-5">
//         <div className="flex items-start justify-between gap-6 flex-wrap">
//           <div className="flex-1 min-w-[280px]">
//             <label className="text-xs text-gray-400 mb-1 block">* اسم الدفتر</label>
//             <input
//               value={form.name}
//               onChange={(e) => set("name", e.target.value)}
//               placeholder="مثال: فواتير العملاء"
//               className="w-full text-2xl font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-orange-400 pb-2 bg-transparent placeholder:text-gray-300"
//             />
//           </div>
//           <div className="min-w-[220px]">
//             <label className="text-xs text-gray-400 mb-1 block">النوع</label>
//             <select
//               value={form.type}
//               onChange={(e) => {
//                 set("type", e.target.value);
//                 setTab("entries");
//               }}
//               disabled={isEdit}
//               className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 disabled:bg-gray-50 disabled:text-gray-400"
//             >
//               {JOURNAL_TYPES.map((t) => (
//                 <option key={t.value} value={t.value}>
//                   {t.label}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="flex gap-1 border-b border-gray-200">
//           {tabs.map((t) => (
//             <button
//               key={t.id}
//               onClick={() => setTab(t.id)}
//               className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
//                 tab === t.id
//                   ? "border-orange-500 text-orange-600"
//                   : "border-transparent text-gray-500 hover:text-gray-700"
//               }`}
//             >
//               {t.label}
//             </button>
//           ))}
//         </div>

//         {/* ── بنود الدفتر ───────────────────────────────────────── */}
//         {tab === "entries" && (
//           <div className="grid grid-cols-2 gap-x-10 gap-y-5 pt-2">
//             {form.type === "sale" &&
//               accountSelect("حساب الإيراد الافتراضي", "income_account_id", (a) => a.account_type === "income")}

//             {form.type === "purchase" &&
//               accountSelect("حساب المصروف الافتراضي", "expense_account_id", (a) => a.account_type === "expense")}

//             {hasPayments && (
//               <>
//                 {accountSelect(
//                   form.type === "cash" ? "حساب الصندوق" : form.type === "bank" ? "الحساب البنكي" : "حساب الدفتر",
//                   "cash_bank_account_id",
//                   (a) => a.account_type === "asset_cash"
//                 )}
//                 {accountSelect(
//                   "الحساب المعلق (Suspense)",
//                   "suspense_account_id",
//                   (a) => a.account_type === "asset_current"
//                 )}
//                 {form.type === "cash" && (
//                   <>
//                     {accountSelect(
//                       "حساب الأرباح",
//                       "profit_account_id",
//                       (a) => a.account_type === "income" || a.account_type === "income_other"
//                     )}
//                     {accountSelect("حساب الخسائر", "loss_account_id", (a) => a.account_type === "expense")}
//                   </>
//                 )}
//               </>
//             )}

//             <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
//               <input
//                 type="checkbox"
//                 checked={form.dedicated_sequence}
//                 onChange={(e) => set("dedicated_sequence", e.target.checked)}
//                 className="w-4 h-4 accent-orange-500"
//               />
//               <label className="text-sm font-medium text-gray-700">
//                 {isSaleOrPurchase ? "ترقيم مستقل لإشعارات الدائن" : "ترقيم مستقل للدفعات"}
//               </label>
//             </div>

//             <div className="space-y-1.5 col-span-2 sm:col-span-1">
//               <label className="text-sm font-medium text-gray-700">الكود المختصر</label>
//               <input
//                 value={form.short_code}
//                 onChange={(e) => set("short_code", e.target.value.slice(0, 5))}
//                 placeholder="e.g. INV"
//                 dir="ltr"
//                 maxLength={5}
//                 className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//               />
//             </div>
//           </div>
//         )}

//         {/* ── الدفعات الواردة / الصادرة ─────────────────────────── */}
//         {tab === "incoming" && hasPayments && <div className="pt-2">{renderPaymentMethodsTable("incoming")}</div>}
//         {tab === "outgoing" && hasPayments && <div className="pt-2">{renderPaymentMethodsTable("outgoing")}</div>}

//         {/* ── إعدادات متقدمة ────────────────────────────────────── */}
//         {tab === "advanced" && (
//           <div className="grid grid-cols-2 gap-x-10 gap-y-5 pt-2">
//             <div className="space-y-3 col-span-2 sm:col-span-1">
//               <p className="text-xs font-bold text-gray-400 uppercase">التحكم في الوصول</p>
//               <p className="text-xs text-gray-400">اتركه فارغًا لعدم وجود تحكم</p>
//               <div className="space-y-1.5">
//                 <label className="text-sm font-medium text-gray-700">الحسابات المسموح بها</label>
//                 <div className="flex flex-wrap gap-1.5">
//                   {accounts.map((a) => (
//                     <button
//                       key={a.id}
//                       onClick={() => toggleAllowedAccount(a.id)}
//                       className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
//                         form.allowed_accounts.includes(a.id)
//                           ? "bg-orange-500 text-white border-orange-500"
//                           : "border-gray-200 text-gray-500 hover:bg-gray-50"
//                       }`}
//                     >
//                       {accountLabel(a)}
//                     </button>
//                   ))}
//                 </div>
//               </div>
//               {isSaleOrPurchase && (
//                 <div className="flex items-center gap-2">
//                   <input
//                     type="checkbox"
//                     checked={form.secure_posted_entries}
//                     onChange={(e) => set("secure_posted_entries", e.target.checked)}
//                     className="w-4 h-4 accent-orange-500"
//                   />
//                   <label className="text-sm font-medium text-gray-700">تأمين القيود المرحلة بـ Hash</label>
//                 </div>
//               )}
//               <div className="flex items-center gap-2">
//                 <input
//                   type="checkbox"
//                   checked={form.auto_check_on_post}
//                   onChange={(e) => set("auto_check_on_post", e.target.checked)}
//                   className="w-4 h-4 accent-orange-500"
//                 />
//                 <label className="text-sm font-medium text-gray-700">فحص تلقائي عند الترحيل</label>
//               </div>
//             </div>

//             {isSaleOrPurchase && (
//               <div className="space-y-3 col-span-2 sm:col-span-1">
//                 <p className="text-xs font-bold text-gray-400 uppercase">التواصل بخصوص الدفع</p>
//                 <div className="space-y-1.5">
//                   <label className="text-sm font-medium text-gray-700">نوع التواصل</label>
//                   <select
//                     value={form.invoice_reference_type}
//                     onChange={(e) => set("invoice_reference_type", e.target.value)}
//                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//                   >
//                     {REFERENCE_TYPE_OPTIONS.map((o) => (
//                       <option key={o.value} value={o.value}>{o.label}</option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="space-y-1.5">
//                   <label className="text-sm font-medium text-gray-700">معيار التواصل</label>
//                   <select
//                     value={form.invoice_reference_model}
//                     onChange={(e) => set("invoice_reference_model", e.target.value)}
//                     className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
//                   >
//                     {REFERENCE_MODEL_OPTIONS.map((o) => (
//                       <option key={o.value} value={o.value}>{o.label}</option>
//                     ))}
//                   </select>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// /* ────────────────────────────────────────────────────────────────────────
//    الصفحة الرئيسية — Journals List
//    ──────────────────────────────────────────────────────────────────── */

// export default function Journals() {
//   const [journals, setJournals] = useState([]);
//   const [accounts, setAccounts] = useState([]);
//   const [listLoading, setListLoading] = useState(true);
//   const [listError, setListError] = useState(null);
//   const [selectedId, setSelectedId] = useState(null);
//   const [creating, setCreating] = useState(false);

//   const loadJournals = () => {
//     setListLoading(true);
//     setListError(null);
//     return getJournals()
//       .then((data) => setJournals(data))
//       .catch((e) => setListError(e?.message || "تعذر تحميل دفاتر اليومية"))
//       .finally(() => setListLoading(false));
//   };

//   useEffect(() => {
//     loadJournals();
//     getAllAccounts().then(setAccounts).catch(() => setAccounts([]));
//   }, []);

//   const handleClosed = () => {
//     setSelectedId(null);
//     setCreating(false);
//     loadJournals();
//   };

//   const journalsPagination = usePagination(journals, 20);

//   if (selectedId) {
//     return (
//       <JournalForm
//         journalId={selectedId}
//         accounts={accounts}
//         onBack={() => setSelectedId(null)}
//         onSaved={handleClosed}
//         onDeleted={handleClosed}
//       />
//     );
//   }
//   if (creating) {
//     return (
//       <JournalForm
//         journalId={null}
//         accounts={accounts}
//         onBack={() => setCreating(false)}
//         onSaved={handleClosed}
//         onDeleted={handleClosed}
//       />
//     );
//   }

//   return (
//     <div className="p-6 space-y-5 w-full bg-white" dir="rtl">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
//             دفاتر اليومية
//             <BookText className="w-5 h-5 text-gray-400" />
//           </h1>
//           <p className="text-sm text-gray-500 mt-0.5">
//             إدارة دفاتر اليومية المحاسبية وربطها بالحسابات
//           </p>
//         </div>
//         <button
//           onClick={() => setCreating(true)}
//           className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
//         >
//           دفتر يومية جديد <Plus className="w-4 h-4" />
//         </button>
//       </div>

//       {listError && (
//         <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
//           {listError}
//         </div>
//       )}

//       <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="border-b border-gray-200">
//               {["اسم الدفتر", "النوع", "الكود المختصر", "الحساب الافتراضي", ""].map((h) => (
//                 <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
//                   {h}
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {listLoading ? (
//               <tr>
//                 <td colSpan={5} className="text-center py-10 text-gray-400">
//                   <Loader2 className="w-5 h-5 animate-spin mx-auto" />
//                 </td>
//               </tr>
//             ) : journals.length === 0 ? (
//               <tr>
//                 <td colSpan={5} className="text-center py-10 text-gray-400">
//                   لا توجد دفاتر يومية بعد
//                 </td>
//               </tr>
//             ) : (
//               journalsPagination.pageItems.map((j) => {
//                 const type = fromApiType(j.type);
//                 return (
//                   <tr
//                     key={j.id}
//                     onClick={() => setSelectedId(j.id)}
//                     className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
//                   >
//                     <td className="px-4 py-3 font-semibold text-gray-800">{j.name}</td>
//                     <td className="px-4 py-3">
//                       <span className={`px-3 py-1 rounded-full text-xs font-medium ${TYPE_BADGE[type] || "bg-gray-100 text-gray-600"}`}>
//                         {TYPE_LABEL[type] || j.type}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 font-medium text-orange-600">{j.code || "—"}</td>
//                     <td className="px-4 py-3 text-gray-600">{j.default_account_name || "—"}</td>
//                     <td className="px-4 py-3 text-left">
//                       <ChevronLeft className="w-4 h-4 text-gray-300" />
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//         <TablePagination
//           page={journalsPagination.page}
//           totalPages={journalsPagination.totalPages}
//           totalItems={journalsPagination.totalItems}
//           pageSize={journalsPagination.pageSize}
//           onPageChange={journalsPagination.setPage}
//         />
//       </div>
//     </div>
//   );
// }
import { useState, useEffect } from "react";
import {
  BookText,
  Plus,
  X,
  Save,
  Trash2,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import {
  getJournals,
  getJournal,
  createJournal,
  updateJournal,
  deleteJournal,
  getJournalPaymentMethods,
  getGeneralPaymentMethods,
  getAllAccounts,
} from "../../api/Journalsapi";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

/* ────────────────────────────────────────────────────────────────────────
   Config
   ──────────────────────────────────────────────────────────────────── */

// value = القيمة اللي بتتعرض/بتتبعت للفرونت، apiValue = القيمة الحقيقية اللي الـ backend بيفهمها
const JOURNAL_TYPES = [
  { value: "sale", apiValue: "sale", label: "مبيعات" },
  { value: "purchase", apiValue: "purchase", label: "مشتريات" },
  { value: "cash", apiValue: "cash", label: "نقدية" },
  { value: "bank", apiValue: "bank", label: "بنك" },
  { value: "credit_card", apiValue: "credit", label: "بطاقة ائتمان" },
  { value: "general", apiValue: "general", label: "متنوع" },
];
const TYPE_LABEL = Object.fromEntries(JOURNAL_TYPES.map((t) => [t.value, t.label]));
const toApiType = (v) => JOURNAL_TYPES.find((t) => t.value === v)?.apiValue || v;
const fromApiType = (v) => JOURNAL_TYPES.find((t) => t.apiValue === v)?.value || v;

const TYPE_BADGE = {
  sale: "bg-blue-50 text-blue-600",
  purchase: "bg-orange-50 text-orange-600",
  cash: "bg-green-50 text-green-700",
  bank: "bg-cyan-50 text-cyan-700",
  credit_card: "bg-purple-50 text-purple-700",
  general: "bg-gray-100 text-gray-600",
};

const PAYMENT_CAPABLE_TYPES = ["cash", "bank", "credit_card"];
// الأنواع اللي فيها "مصدر كشف الحساب" (bank_statement_source): البنك وبطاقة الائتمان فقط
const STATEMENT_SOURCE_TYPES = ["bank", "credit_card"];

const REFERENCE_TYPE_OPTIONS = [
  { value: "invoice", label: "بناءً على الفاتورة" },
  { value: "partner", label: "بناءً على العميل" },
  { value: "none", label: "بدون" },
];
const REFERENCE_MODEL_OPTIONS = [
  { value: "odoo", label: "Odoo" },
  { value: "euro", label: "Euro" },
];

// خيارات مصدر كشف الحساب البنكي (bank_statement_source) - مطابقة لخيارات Odoo القياسية
const BANK_STATEMENT_SOURCE_OPTIONS = [
  { value: "undefined", label: "بدون مزامنة" },
  { value: "file_import", label: "استيراد ملف (CAMT, CODA, CSV, OFX, QIF)" },
  { value: "online_sync", label: "مزامنة بنكية آلية" },
];

const EMPTY_JOURNAL = {
  name: "",
  type: "sale",
  short_code: "",
  active: true,
  income_account_id: null,   // used when type === sale (default_account_id)
  expense_account_id: null,  // used when type === purchase (default_account_id)
  cash_bank_account_id: null,// used when hasPayments (default_account_id)
  general_account_id: null,  // used when type === general (default_account_id)
  suspense_account_id: null,
  profit_account_id: null,
  loss_account_id: null,
 refund_sequence: true,
payment_sequence: true,       // refund_sequence / payment_sequence
  allowed_accounts: [],             // account_control_ids
  secure_posted_entries: false,     // restrict_mode_hash_table
  auto_check_on_post: true,         // autocheck_on_post
  invoice_reference_type: "invoice",
  invoice_reference_model: "odoo",
  // كل سطر: { payment_method_id, name, payment_account_id }
  inbound_payment_lines: [],
  outbound_payment_lines: [],
  // Bank / Credit Card فقط
  bank_statement_source: "undefined",
  // Bank فقط - لا يوجد له endpoint في الـ backend حتى الآن، جاهز للربط لاحقًا
  bank_account_id: "",
};

/* ────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

function accountLabel(acc) {
  if (!acc) return "";
  return `${acc.code} ${acc.name_ar || acc.name}`;
}

// من رد الـ API (getJournal) لشكل الفورم المحلي
function apiJournalToForm(j) {
  return {
    ...EMPTY_JOURNAL,
    id: j.id,
    name: j.name || "",
    type: fromApiType(j.type),
    short_code: j.code || "",
    active: j.active ?? true,
    income_account_id: j.type === "sale" ? j.default_account_id || null : null,
    expense_account_id: j.type === "purchase" ? j.default_account_id || null : null,
    cash_bank_account_id:
      ["cash", "bank", "credit"].includes(j.type) ? j.default_account_id || null : null,
    general_account_id: j.type === "general" ? j.default_account_id || null : null,
    suspense_account_id: j.suspense_account_id || null,
    profit_account_id: j.profit_account_id || null,
    loss_account_id: j.loss_account_id || null,
refund_sequence: j.refund_sequence ?? true,
payment_sequence: j.payment_sequence ?? true,
    allowed_accounts: j.account_control_ids || [],
    secure_posted_entries: j.restrict_mode_hash_table || false,
    auto_check_on_post: j.autocheck_on_post ?? true,
    invoice_reference_type: j.invoice_reference_type || "invoice",
    invoice_reference_model: j.invoice_reference_model || "odoo",
    inbound_payment_lines: (j.inbound_payment_methods || []).map((m) => ({
      payment_method_id: m.payment_method_id ?? m.id,
      name: m.name || "",
      payment_account_id: m.payment_account_id || null,
    })),
    outbound_payment_lines: (j.outbound_payment_methods || []).map((m) => ({
      payment_method_id: m.payment_method_id ?? m.id,
      name: m.name || "",
      payment_account_id: m.payment_account_id || null,
    })),
    // يتم تحميلها من رد الـ API لو موجودة، وإلا تاخد القيمة الافتراضية
    bank_statement_source: j.bank_statement_source || "undefined",
    bank_account_id: j.bank_account_id || "",
  };
}

// من الفورم المحلي لشكل الـ payload اللي الـ API محتاجه
function formToPayload(form) {
  const isSaleOrPurchase = form.type === "sale" || form.type === "purchase";
  const hasPayments = PAYMENT_CAPABLE_TYPES.includes(form.type);

  const default_account_id =
    form.type === "sale"
      ? form.income_account_id
      : form.type === "purchase"
      ? form.expense_account_id
      : form.type === "general"
      ? form.general_account_id
      : hasPayments
      ? form.cash_bank_account_id
      : null;

  const payload = {
    name: form.name,
    type: toApiType(form.type),
    code: form.short_code,
    active: form.active,
    default_account_id: default_account_id || false,
    restrict_mode_hash_table: form.secure_posted_entries,
    autocheck_on_post: form.auto_check_on_post,
    account_control_ids: [[6, 0, form.allowed_accounts]],
  };
if (isSaleOrPurchase) {
  payload.refund_sequence = form.refund_sequence;
}

  if (form.type === "sale") {
    payload.invoice_reference_type = form.invoice_reference_type;
    payload.invoice_reference_model = form.invoice_reference_model;
  }

  if (hasPayments) {
    payload.payment_sequence = form.payment_sequence;
    payload.suspense_account_id = form.suspense_account_id || false;

    payload.inbound_payment_method_line_ids = form.inbound_payment_lines.map((l) => ({
      payment_method_id: l.payment_method_id,
      payment_account_id: l.payment_account_id || false,
    }));

    payload.outbound_payment_method_line_ids = form.outbound_payment_lines.map((l) => ({
      payment_method_id: l.payment_method_id,
      payment_account_id: l.payment_account_id || false,
    }));
  }

 if (form.type === "cash" || form.type === "bank") {
  payload.profit_account_id = form.profit_account_id || false;
  payload.loss_account_id = form.loss_account_id || false;
}

  // Bank و Credit Card: مصدر كشف الحساب البنكي
  if (STATEMENT_SOURCE_TYPES.includes(form.type)) {
    payload.bank_statement_source = form.bank_statement_source || false;
  }

  // Bank فقط: رقم الحساب البنكي - لا يوجد endpoint خاص به في الـ backend بعد،
  // بيتبعت جاهز ضمن نفس الـ payload عشان يبقى سهل الربط لاحقًا بدون كسر الـ API الحالي
  if (form.type === "bank") {
    payload.bank_account_id = form.bank_account_id || false;
  }

  return payload;
}

/* ────────────────────────────────────────────────────────────────────────
   صفحة إنشاء / تعديل دفتر يومية
   ──────────────────────────────────────────────────────────────────── */

function JournalForm({ journalId, accounts, onBack, onSaved, onDeleted }) {
  const isEdit = Boolean(journalId);
  const [form, setForm] = useState({ ...EMPTY_JOURNAL });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState({ inbound: [], outbound: [] });
  const [tab, setTab] = useState("entries");

  const hasPayments = PAYMENT_CAPABLE_TYPES.includes(form.type);
  const isSaleOrPurchase = form.type === "sale" || form.type === "purchase";
  const isSale = form.type === "sale";
  const isBank = form.type === "bank";
  const isCreditCard = form.type === "credit_card";
  const isGeneral = form.type === "general";
  const hasStatementSource = STATEMENT_SOURCE_TYPES.includes(form.type);

  const outstandingReceiptsAccounts = accounts.filter(
  (a) => a.account_type === "asset_current"
);

const outstandingPaymentsAccounts = accounts.filter(
  (a) =>
    a.account_type === "asset_current" ||
    a.account_type === "liability_current"
);

  // جلب بيانات الدفتر عند التعديل
  useEffect(() => {
    if (!isEdit) return;
    let alive = true;
    setLoading(true);
    getJournal(journalId)
      .then((j) => {
        if (!alive) return;
        setForm(apiJournalToForm(j));
      })
      .catch((e) => alive && setError(e?.message || "تعذر تحميل بيانات الدفتر"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isEdit, journalId]);

  // جلب طرق الدفع المتاحة (اللي ممكن تتضاف):
  // - دفتر جديد (لسه ماتسجلش) → طرق الدفع العامة /accounting/payment-methods
  // - دفتر متسجل بالفعل → طرق الدفع الخاصة بيه /journals/:id/payment-methods
  useEffect(() => {
    if (!hasPayments) return;
    let alive = true;
    const request = isEdit ? getJournalPaymentMethods(journalId) : getGeneralPaymentMethods();
    request
      .then((res) => alive && setPaymentMethods(res))
      .catch(() => alive && setPaymentMethods({ inbound: [], outbound: [] }));
    return () => {
      alive = false;
    };
  }, [hasPayments, isEdit, journalId]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleAllowedAccount = (id) =>
    setForm((f) => ({
      ...f,
      allowed_accounts: f.allowed_accounts.includes(id)
        ? f.allowed_accounts.filter((a) => a !== id)
        : [...f.allowed_accounts, id],
    }));

  // إضافة/حذف/تعديل سطر طريقة دفع (Incoming أو Outgoing)
  const addPaymentLine = (linesKey, method) =>
    setForm((f) => {
      if (f[linesKey].some((l) => l.payment_method_id === method.id)) return f;
      return {
        ...f,
        [linesKey]: [
          ...f[linesKey],
          { payment_method_id: method.id, name: method.name, payment_account_id: null },
        ],
      };
    });

  const removePaymentLine = (linesKey, idx) =>
    setForm((f) => ({ ...f, [linesKey]: f[linesKey].filter((_, i) => i !== idx) }));

  const setPaymentLineAccount = (linesKey, idx, accId) =>
    setForm((f) => ({
      ...f,
      [linesKey]: f[linesKey].map((l, i) => (i === idx ? { ...l, payment_account_id: accId } : l)),
    }));

  const tabs = [
    { id: "entries", label: "بنود الدفتر" },
    ...(hasPayments ? [{ id: "incoming", label: "الدفعات الواردة" }] : []),
    ...(hasPayments ? [{ id: "outgoing", label: "الدفعات الصادرة" }] : []),
    { id: "advanced", label: "إعدادات متقدمة" },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = formToPayload(form);
      if (isEdit) {
        await updateJournal(journalId, payload);
      } else {
        await createJournal(payload);
      }
      onSaved();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "تعذر حفظ الدفتر");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("متأكد إنك عايز تحذف دفتر اليومية ده؟")) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteJournal(journalId);
      onDeleted();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "تعذر حذف الدفتر");
      setDeleting(false);
    }
  };

  const accountSelect = (label, field, filterFn) => (
    <div className="space-y-1.5 col-span-2 sm:col-span-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={form[field] ?? ""}
        onChange={(e) => set(field, e.target.value ? Number(e.target.value) : null)}
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
      >
        <option value="">اختر الحساب...</option>
        {accounts.filter(filterFn).map((a) => (
          <option key={a.id} value={a.id}>
            {accountLabel(a)}
          </option>
        ))}
      </select>
    </div>
  );

  // جدول طرق الدفع لتاب معيّن (Incoming أو Outgoing)
  const renderPaymentMethodsTable = (tabId) => {
    const linesKey = tabId === "incoming" ? "inbound_payment_lines" : "outbound_payment_lines";
    const availableKey = tabId === "incoming" ? "inbound" : "outbound";
    const available = paymentMethods[availableKey] || [];
   const lines = form[linesKey];

const notAdded = available.filter(
  (m) => !lines.some((l) => l.payment_method_id === m.id)
);

const outstandingAccounts =
  tabId === "incoming"
    ? outstandingReceiptsAccounts
    : outstandingPaymentsAccounts;
    return (
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-right px-3 py-2 font-medium text-gray-500">طريقة الدفع</th>
              <th className="text-right px-3 py-2 font-medium text-gray-500">
                {tabId === "incoming" ? "حساب الإيصالات المعلقة" : "حساب الدفعات المعلقة"}
              </th>
              <th className="px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-400">
                  لا توجد طرق دفع مضافة
                </td>
              </tr>
            ) : (
              lines.map((l, i) => (
                <tr key={l.payment_method_id} className="border-b border-gray-100 last:border-0">
                  <td className="px-3 py-2 text-gray-700">{l.name}</td>
                  <td className="px-3 py-2">
                    <select
                      value={l.payment_account_id ?? ""}
                      onChange={(e) =>
                        setPaymentLineAccount(linesKey, i, e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                    >
                      <option value="">اختر الحساب...</option>
                      {outstandingAccounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {accountLabel(a)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => removePaymentLine(linesKey, i)}
                      className="p-1 hover:bg-red-50 text-red-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {notAdded.length > 0 && (
          <div className="px-3 py-2 border-t border-gray-100">
            <select
              value=""
              onChange={(e) => {
                const m = available.find((x) => x.id === Number(e.target.value));
                if (m) addPaymentLine(linesKey, m);
              }}
              className="text-xs text-orange-600 font-medium border-0 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="">+ إضافة طريقة دفع...</option>
              {notAdded.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full bg-white flex items-center justify-center py-24" dir="rtl">
        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="w-full bg-white" dir="rtl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button onClick={onBack} title="إلغاء" className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.type || saving}
            title="حفظ"
            className="text-orange-500 hover:text-orange-600 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          </button>
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="حذف"
              className="text-red-400 hover:text-red-600 disabled:opacity-40"
            >
              {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <span className="text-gray-800 font-medium">{isEdit ? form.name : "جديد"}</span>
          <span>/</span>
          <span>دفاتر اليومية</span>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
          {error}
        </div>
      )}

      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-[280px]">
            <label className="text-xs text-gray-400 mb-1 block">* اسم الدفتر</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="مثال: فواتير العملاء"
              className="w-full text-2xl font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-orange-400 pb-2 bg-transparent placeholder:text-gray-300"
            />
          </div>
          <div className="min-w-[220px]">
            <label className="text-xs text-gray-400 mb-1 block">النوع</label>
            <select
              value={form.type}
              onChange={(e) => {
                set("type", e.target.value);
                setTab("entries");
              }}
              disabled={isEdit}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 disabled:bg-gray-50 disabled:text-gray-400"
            >
              {JOURNAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-1 border-b border-gray-200">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── بنود الدفتر ───────────────────────────────────────── */}
        {tab === "entries" && (
          <div className="grid grid-cols-2 gap-x-10 gap-y-5 pt-2">
            {form.type === "sale" &&
              accountSelect("حساب الإيراد الافتراضي", "income_account_id", (a) => a.account_type === "income")}

            {form.type === "purchase" &&
              accountSelect("حساب المصروف الافتراضي", "expense_account_id", (a) => a.account_type === "expense")}

            {isGeneral &&
              accountSelect("الحساب الافتراضي للدفتر", "general_account_id", () => true)}

            {hasPayments && (
              <>
                {accountSelect(
                  form.type === "cash" ? "حساب الصندوق" : form.type === "bank" ? "الحساب البنكي" : "حساب الدفتر",
                  "cash_bank_account_id",
                  (a) => a.account_type === "asset_cash"
                )}
                {accountSelect(
                  "الحساب المعلق (Suspense)",
                  "suspense_account_id",
                  (a) => a.account_type === "asset_current"
                )}

                {hasStatementSource && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-sm font-medium text-gray-700">مصدر كشف الحساب البنكي</label>
                    <select
                      value={form.bank_statement_source}
                      onChange={(e) => set("bank_statement_source", e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                    >
                      {BANK_STATEMENT_SOURCE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {isBank && (
                  <div className="space-y-1.5 col-span-2 sm:col-span-1">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5 flex-wrap">
                      رقم الحساب البنكي
                      <span className="text-[10px] font-normal text-gray-400">
                        (حقل مؤقت — بانتظار ربطه بالـ backend)
                      </span>
                    </label>
                    <input
                      value={form.bank_account_id}
                      onChange={(e) => set("bank_account_id", e.target.value)}
                      placeholder="مثال: EG00 0000 0000 0000 0000 0000"
                      dir="ltr"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                    />
                  </div>
                )}

              {(form.type === "cash" || form.type === "bank") && (
  <>
    {accountSelect(
      "حساب الأرباح",
      "profit_account_id",
      (a) => a.account_type === "income" || a.account_type === "income_other"
    )}

    {accountSelect(
      "حساب الخسائر",
      "loss_account_id",
      (a) => a.account_type === "expense"
    )}
  </>
)}
              </>
            )}

            {(isSaleOrPurchase || hasPayments) && (
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <input 
  type="checkbox" 
  checked={form.payment_sequence} 
  onChange={(e) => set("payment_sequence", e.target.checked)} 
  className="w-4 h-4 accent-orange-500" 
/>
                <label className="text-sm font-medium text-gray-700">
                  {isSaleOrPurchase ? "ترقيم مستقل لإشعارات الدائن" : "ترقيم مستقل للدفعات"}
                </label>
              </div>
            )}

            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-sm font-medium text-gray-700">الكود المختصر</label>
              <input
                value={form.short_code}
                onChange={(e) => set("short_code", e.target.value.slice(0, 5))}
                placeholder="e.g. INV"
                dir="ltr"
                maxLength={5}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              />
            </div>
          </div>
        )}

        {/* ── الدفعات الواردة / الصادرة ─────────────────────────── */}
        {tab === "incoming" && hasPayments && <div className="pt-2">{renderPaymentMethodsTable("incoming")}</div>}
        {tab === "outgoing" && hasPayments && <div className="pt-2">{renderPaymentMethodsTable("outgoing")}</div>}

        {/* ── إعدادات متقدمة ────────────────────────────────────── */}
        {tab === "advanced" && (
          <div className="grid grid-cols-2 gap-x-10 gap-y-5 pt-2">
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <p className="text-xs font-bold text-gray-400 uppercase">التحكم في الوصول</p>
              <p className="text-xs text-gray-400">اتركه فارغًا لعدم وجود تحكم</p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">الحسابات المسموح بها</label>
                <div className="flex flex-wrap gap-1.5">
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => toggleAllowedAccount(a.id)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                        form.allowed_accounts.includes(a.id)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {accountLabel(a)}
                    </button>
                  ))}
                </div>
              </div>
              {(isSaleOrPurchase || isGeneral) && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.secure_posted_entries}
                    onChange={(e) => set("secure_posted_entries", e.target.checked)}
                    className="w-4 h-4 accent-orange-500"
                  />
                  <label className="text-sm font-medium text-gray-700">تأمين القيود المرحلة بـ Hash</label>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.auto_check_on_post}
                  onChange={(e) => set("auto_check_on_post", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                <label className="text-sm font-medium text-gray-700">فحص تلقائي عند الترحيل</label>
              </div>
            </div>

            {isSale && (
              <div className="space-y-3 col-span-2 sm:col-span-1">
                <p className="text-xs font-bold text-gray-400 uppercase">التواصل بخصوص الدفع</p>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">نوع التواصل</label>
                  <select
                    value={form.invoice_reference_type}
                    onChange={(e) => set("invoice_reference_type", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                  >
                    {REFERENCE_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">معيار التواصل</label>
                  <select
                    value={form.invoice_reference_model}
                    onChange={(e) => set("invoice_reference_model", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                  >
                    {REFERENCE_MODEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية — Journals List
   ──────────────────────────────────────────────────────────────────── */

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [creating, setCreating] = useState(false);

  const loadJournals = () => {
    setListLoading(true);
    setListError(null);
    return getJournals()
      .then((data) => setJournals(data))
      .catch((e) => setListError(e?.message || "تعذر تحميل دفاتر اليومية"))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    loadJournals();
    getAllAccounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  const handleClosed = () => {
    setSelectedId(null);
    setCreating(false);
    loadJournals();
  };

  const journalsPagination = usePagination(journals, 20);

  if (selectedId) {
    return (
      <JournalForm
        journalId={selectedId}
        accounts={accounts}
        onBack={() => setSelectedId(null)}
        onSaved={handleClosed}
        onDeleted={handleClosed}
      />
    );
  }
  if (creating) {
    return (
      <JournalForm
        journalId={null}
        accounts={accounts}
        onBack={() => setCreating(false)}
        onSaved={handleClosed}
        onDeleted={handleClosed}
      />
    );
  }

  return (
    <div className="p-6 space-y-5 w-full bg-white" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            دفاتر اليومية
            <BookText className="w-5 h-5 text-gray-400" />
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            إدارة دفاتر اليومية المحاسبية وربطها بالحسابات
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          دفتر يومية جديد <Plus className="w-4 h-4" />
        </button>
      </div>

      {listError && (
        <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
          {listError}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {["اسم الدفتر", "النوع", "الكود المختصر", "الحساب الافتراضي", ""].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                </td>
              </tr>
            ) : journals.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  لا توجد دفاتر يومية بعد
                </td>
              </tr>
            ) : (
              journalsPagination.pageItems.map((j) => {
                const type = fromApiType(j.type);
                return (
                  <tr
                    key={j.id}
                    onClick={() => setSelectedId(j.id)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{j.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${TYPE_BADGE[type] || "bg-gray-100 text-gray-600"}`}>
                        {TYPE_LABEL[type] || j.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-orange-600">{j.code || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{j.default_account_name || "—"}</td>
                    <td className="px-4 py-3 text-left">
                      <ChevronLeft className="w-4 h-4 text-gray-300" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <TablePagination
          page={journalsPagination.page}
          totalPages={journalsPagination.totalPages}
          totalItems={journalsPagination.totalItems}
          pageSize={journalsPagination.pageSize}
          onPageChange={journalsPagination.setPage}
        />
      </div>
    </div>
  );
}