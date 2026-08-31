import { useState, useEffect } from "react";
import {
  CalendarClock,
  Plus,
  X,
  Save,
  Trash2,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getPaymentTerms,
  getPaymentTerm,
  createPaymentTerm,
  updatePaymentTerm,
  deletePaymentTerm,
} from "@/api/Paymenttermsapi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

/* ────────────────────────────────────────────────────────────────────────
   ثوابت وخيارات
   ──────────────────────────────────────────────────────────────────── */

const DELAY_TYPES = [
  { value: "days_after", label: "يوم بعد تاريخ الفاتورة" },
  { value: "days_after_end_of_month", label: "يوم بعد نهاية الشهر" },
  { value: "days_after_end_of_next_month", label: "يوم بعد نهاية الشهر التالي" },
  { value: "days_end_of_month_on_the", label: "نهاية الشهر في يوم محدد" },
];

const EARLY_DISCOUNT_COMPUTATION = [
  { value: "included", label: "دائمًا (عند الفاتورة)" },
  { value: "excluded", label: "أبدًا" },
  { value: "mixed", label: "عند الدفع المبكر فقط" },
];

const EMPTY_LINE = () => ({
  _key: Date.now() + Math.random(),
  value: "percent",
  value_amount: 100,
  delay_type: "days_after",
  nb_days: 0,
  days_next_month: 10,
});

const EMPTY_TERM = {
  name: "",
  note: "",
  early_discount: false,
  discount_percentage: 2.0,
  discount_days: 10,
  early_pay_discount_computation: "mixed",
  display_on_invoice: true,
  lines: [{ _key: 1, value: "percent", value_amount: 100, delay_type: "days_after", nb_days: 0, days_next_month: 10 }],
  // قايمة id بتوع الأسطر اللي اتمسحت من الفورم وكانت أصلاً موجودة في
  // الباك اند (عندها id حقيقي). بتتبعت في الآخر بصيغة { id, _delete: true }
  // زي ما موضّح في الـ Postman collection.
  _deleted_line_ids: [],
};

/* ────────────────────────────────────────────────────────────────────────
   حساب معاينة الأقساط (Preview) — عرض محلي بس، مش بيتبعت للباك اند
   ──────────────────────────────────────────────────────────────────── */

function computePreview(lines, exampleAmount = 1000) {
  const today = new Date();
  const fmtDate = (d) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  return lines.map((l, i) => {
    const amount =
      l.value === "percent" ? (exampleAmount * (Number(l.value_amount) || 0)) / 100 : Number(l.value_amount) || 0;

    let due = new Date(today);
    if (l.delay_type === "days_after") {
      due.setDate(due.getDate() + (Number(l.nb_days) || 0));
    } else if (l.delay_type === "days_after_end_of_month") {
      due = new Date(due.getFullYear(), due.getMonth() + 1, 0);
      due.setDate(due.getDate() + (Number(l.nb_days) || 0));
    } else if (l.delay_type === "days_after_end_of_next_month") {
      due = new Date(due.getFullYear(), due.getMonth() + 2, 0);
      due.setDate(due.getDate() + (Number(l.nb_days) || 0));
    } else if (l.delay_type === "days_end_of_month_on_the") {
      due = new Date(due.getFullYear(), due.getMonth() + 1, Number(l.days_next_month) || 1);
    }

    return { index: i + 1, amount, date: fmtDate(due) };
  });
}

/**
 * بناء الـ Payload اللي بيتبعت للباك اند من شكل الفورم المحلي
 *
 * ملاحظة مهمة (نفس منطق الإصلاح اللي عملناه في Taxes.jsx):
 * - أي سطر جاي أصلاً من الباك اند (عنده id حقيقي) لازم يتبعت بالـ id
 *   بتاعه عشان الباك اند يعمله update بدل create سطر جديد ليه.
 * - أي سطر كان موجود واتمسح من الفورم، لازم يتبعت بصيغة
 *   { id, _delete: true } (زي ما موضّح في الـ Postman collection)
 *   عشان يتمسح فعليًا من أودو، مش يفضل يتيم هناك.
 * - الأسطر الجديدة اللي المستخدم أضافها وبعدين مسحها (مالهاش id) بتتشال
 *   من غير ما تتبعت خالص، لأنها أصلاً معملهاش create.
 */
function buildPayload(form) {
  const activeLines = form.lines.map((l) => {
    const line = {
      value: l.value,
      value_amount: Number(l.value_amount) || 0,
      delay_type: l.delay_type,
    };

    // لو السطر ده جاي من الباك اند أصلاً (عنده id رقمي حقيقي) ابعتيه
    // عشان يبقى update مش create سطر جديد بنفس البيانات
    if (l.id) {
      line.id = l.id;
    }

    if (l.delay_type === "days_end_of_month_on_the") {
      line.days_next_month = Number(l.days_next_month) || 1;
    } else {
      line.nb_days = Number(l.nb_days) || 0;
    }
    return line;
  });

  // الأسطر اللي اتمسحت من الفورم وكانت أصلاً موجودة (ليها id حقيقي)
  const deletedLines = (form._deleted_line_ids || []).map((id) => ({ id, _delete: true }));

  const payload = {
    name: form.name.trim(),
    note: form.note?.trim() || "",
    lines: [...activeLines, ...deletedLines],
    early_discount: !!form.early_discount,
    display_on_invoice: !!form.display_on_invoice,
  };

  if (form.early_discount) {
    payload.discount_percentage = Number(form.discount_percentage) || 0;
    payload.discount_days = Number(form.discount_days) || 0;
    payload.early_pay_discount_computation = form.early_pay_discount_computation;
  }

  return payload;
}

/* ────────────────────────────────────────────────────────────────────────
   صفحة إنشاء / تعديل شرط دفع — Inline Page (مش Modal)
   ──────────────────────────────────────────────────────────────────── */

function PaymentTermForm({ term, onBack, onSaved }) {
  const { toast } = useToast();
  const isEdit = Boolean(term?.id);

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...EMPTY_TERM,
          ...term,
          lines: (term.lines?.length ? term.lines : EMPTY_TERM.lines).map((l) => ({
            _key: l.id ?? Date.now() + Math.random(),
            // *** الإصلاح الأهم ***: لازم نحافظ على الـ id هنا كحقل فعلي
            // في السطر، مش بس نستخدمه كـ _key للـ React. من غيرها،
            // buildPayload مستحيل يبعت id لأي سطر حتى لو كان جاي أصلاً
            // من الباك اند، وأودو هيعامل كل الأسطر كأنها جديدة.
            id: l.id,
            value: l.value || "percent",
            value_amount: l.value_amount ?? 0,
            delay_type: l.delay_type || "days_after",
            nb_days: l.nb_days ?? 0,
            days_next_month: l.days_next_month ?? 10,
          })),
          _deleted_line_ids: [],
        }
      : { ...EMPTY_TERM, lines: EMPTY_TERM.lines.map((l) => ({ ...l })), _deleted_line_ids: [] }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setLine = (idx, field, value) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)) }));

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, EMPTY_LINE()] }));

  // *** الإصلاح ***: لو السطر اللي بيتمسح عنده id حقيقي (جاي من الباك
  // اند)، بنسجله في _deleted_line_ids عشان يتبعت لاحقًا كـ
  // { id, _delete: true } في buildPayload، بدل ما يختفي بس من الـ state
  // المحلي ويفضل موجود في أودو من غير علم حد.
  const removeLine = (idx) =>
    setForm((f) => {
      if (f.lines.length <= 1) return f;
      const removed = f.lines[idx];
      const remaining = f.lines.filter((_, i) => i !== idx);
      if (removed.id) {
        return {
          ...f,
          lines: remaining,
          _deleted_line_ids: [...(f._deleted_line_ids || []), removed.id],
        };
      }
      return { ...f, lines: remaining };
    });

  const totalPercent = form.lines
    .filter((l) => l.value === "percent")
    .reduce((s, l) => s + (Number(l.value_amount) || 0), 0);

  // خصم الدفع المبكر في أودو مسموح بيه بس لو الشرط عنده سطر واحد بنسبة 100%
  const allowsEarlyDiscount =
    form.lines.length === 1 && form.lines[0].value === "percent" && Number(form.lines[0].value_amount) === 100;

  useEffect(() => {
    if (form.early_discount && !allowsEarlyDiscount) {
      set("early_discount", false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.lines]);

  const preview = computePreview(form.lines, 1000);
  const discountedAmount = form.early_discount
    ? 1000 * (1 - (Number(form.discount_percentage) || 0) / 100)
    : null;

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) return;

    // تحقق بسيط قبل الحفظ: مجموع نسب الأسطر من نوع "percent" لازم
    // يساوي 100% بالظبط (نفس المنطق اللي أودو بيفرضه على شروط الدفع).
    const percentSum = form.lines
      .filter((l) => l.value === "percent")
      .reduce((s, l) => s + (Number(l.value_amount) || 0), 0);
    if (form.lines.some((l) => l.value === "percent") && Math.abs(percentSum - 100) > 0.001) {
      setError(`إجمالي نسب بنود الاستحقاق لازم يساوي 100%، حاليًا المجموع = ${percentSum}%.`);
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload(form);
      if (isEdit) {
        await updatePaymentTerm(term.id, payload);
      } else {
        await createPaymentTerm(payload);
      }
      onSaved();
    } catch (err) {
      console.error("خطأ أثناء حفظ شرط الدفع:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ شرط الدفع"));
      toast({
        title: "تعذّر حفظ شرط الدفع",
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
          <span className="text-gray-800 font-medium">{isEdit ? term.name : "جديد"}</span>
          <span>/</span>
          <span>شروط الدفع</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* اسم الشرط */}
        <div className="max-w-xl">
          <label className="text-xs text-gray-400 mb-1 block">* اسم شرط الدفع</label>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="مثال: 30 يوم"
            className="w-full text-2xl font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-orange-400 pb-2 bg-transparent placeholder:text-gray-300"
          />
        </div>

        {/* الخصم المبكر */}
        <div className="flex items-center gap-3 pt-1 flex-wrap">
          <input
            type="checkbox"
            checked={form.early_discount}
            disabled={!allowsEarlyDiscount}
            onChange={(e) => set("early_discount", e.target.checked)}
            className="w-4 h-4 accent-orange-500 disabled:opacity-40"
          />
          <label className={`text-sm font-medium ${allowsEarlyDiscount ? "text-gray-700" : "text-gray-400"}`}>
            خصم الدفع المبكر
          </label>
          {!allowsEarlyDiscount && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              متاح بس لو الشرط عنده سطر استحقاق واحد بنسبة 100%
            </span>
          )}

          {form.early_discount && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="number"
                value={form.discount_percentage}
                onChange={(e) => set("discount_percentage", e.target.value)}
                className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
              />
              <span>% لو دُفع خلال</span>
              <input
                type="number"
                value={form.discount_days}
                onChange={(e) => set("discount_days", e.target.value)}
                className="w-16 px-2 py-1 border border-gray-200 rounded text-sm"
              />
              <span>يوم</span>
            </div>
          )}
        </div>

        {form.early_discount && (
          <div className="grid grid-cols-2 gap-6 max-w-xl">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">احتساب الخصم المبكر</label>
              <select
                value={form.early_pay_discount_computation}
                onChange={(e) => set("early_pay_discount_computation", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
              >
                {EARLY_DISCOUNT_COMPUTATION.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={form.display_on_invoice}
                onChange={(e) => set("display_on_invoice", e.target.checked)}
                className="w-4 h-4 accent-orange-500"
              />
              <label className="text-sm font-medium text-gray-700">إظهار الخصم في الفاتورة</label>
            </div>
          </div>
        )}

        {/* بنود الاستحقاق + المعاينة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3">
          {/* Due Terms */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase">بنود الاستحقاق</p>
              {totalPercent !== 100 && form.lines.some((l) => l.value === "percent") && (
                <span className="text-xs text-red-500">إجمالي النسب {totalPercent}% (المفروض 100%)</span>
              )}
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-right px-3 py-2 font-medium text-gray-500">القيمة</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">التوقيت</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((l, i) => (
                    <tr key={l._key ?? i} className="border-b border-gray-100 last:border-0 align-top">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={l.value_amount}
                            onChange={(e) => setLine(i, "value_amount", e.target.value)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                          <select
                            value={l.value}
                            onChange={(e) => setLine(i, "value", e.target.value)}
                            className="px-1.5 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          >
                            <option value="percent">%</option>
                            <option value="fixed">مبلغ ثابت</option>
                          </select>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {l.delay_type !== "days_end_of_month_on_the" && (
                            <input
                              type="number"
                              value={l.nb_days}
                              onChange={(e) => setLine(i, "nb_days", e.target.value)}
                              className="w-14 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                          )}
                          <select
                            value={l.delay_type}
                            onChange={(e) => setLine(i, "delay_type", e.target.value)}
                            className="px-1.5 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 min-w-[140px]"
                          >
                            {DELAY_TYPES.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                          {l.delay_type === "days_end_of_month_on_the" && (
                            <input
                              type="number"
                              value={l.days_next_month}
                              onChange={(e) => setLine(i, "days_next_month", e.target.value)}
                              title="اليوم من الشهر"
                              className="w-14 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2">
                        <button
                          onClick={() => removeLine(i)}
                          disabled={form.lines.length <= 1}
                          className="p-1 hover:bg-red-50 text-red-400 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={addLine} className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline px-3 py-2">
                <Plus className="w-3 h-3" /> إضافة سطر
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">معاينة</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2 text-sm">
              <p className="text-gray-500 text-xs">مثال على مبلغ 1,000.00 ر.س</p>
              {form.early_discount && (
                <p className="text-green-700 text-xs">
                  خصم دفع مبكر: {discountedAmount?.toFixed(2)} ر.س لو دُفع قبل {form.discount_days} يوم
                </p>
              )}
              <div className="divide-y divide-gray-200">
                {preview.map((p) => (
                  <div key={p.index} className="flex justify-between py-1.5">
                    <span className="text-gray-600">القسط رقم {p.index}</span>
                    <span className="font-medium text-gray-800">
                      {p.amount.toFixed(2)} ر.س — {p.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* الملاحظة */}
        <div className="max-w-xl">
          <label className="text-sm font-medium text-gray-700 mb-1 block">ملاحظة توضيحية (تظهر في الفاتورة)</label>
          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            rows={2}
            placeholder="مثال: يُستحق الدفع بعد 30 يوم من تاريخ الفاتورة"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
          />
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية — Payment Terms List
   ──────────────────────────────────────────────────────────────────── */

export default function PaymentTerms() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [terms, setTerms] = useState([]);
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
      const data = await getPaymentTerms();
      setTerms(data);
    } catch (err) {
      console.error("خطأ أثناء تحميل شروط الدفع:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل شروط الدفع"));
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
      const full = await getPaymentTerm(id);
      setSelected(full);
    } catch (err) {
      console.error("خطأ أثناء جلب شرط الدفع:", err);
      toast({
        title: "تعذّر فتح شرط الدفع",
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
      title: "حذف شرط الدفع",
      message: "متأكد من حذف شرط الدفع ده؟",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setDeletingId(id);
      await deletePaymentTerm(id);
      toast({ title: "تم حذف شرط الدفع" });
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف شرط الدفع:", err);
      toast({
        title: "تعذّر حذف شرط الدفع",
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
    return <PaymentTermForm term={selected} onBack={() => setSelected(null)} onSaved={handleSaved} />;
  }
  if (creating) {
    return <PaymentTermForm term={null} onBack={() => setCreating(false)} onSaved={handleSaved} />;
  }

  return (
    <div className="p-6 space-y-5 w-full bg-white" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            شروط الدفع
            <CalendarClock className="w-5 h-5 text-gray-400" />
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">إدارة شروط ومواعيد استحقاق الدفع للفواتير</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          شرط دفع جديد <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري تحميل شروط الدفع...
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
                {["اسم الشرط", "الملاحظة", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {terms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-400">لا توجد شروط دفع بعد</td>
                </tr>
              ) : (
                terms.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openEdit(t.id)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{t.name}</td>
                    <td className="px-4 py-3 text-gray-500">{t.note || "—"}</td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => handleDelete(e, t.id)}
                          disabled={deletingId === t.id}
                          className="text-gray-300 hover:text-red-500 p-1"
                          title="حذف"
                        >
                          {deletingId === t.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
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