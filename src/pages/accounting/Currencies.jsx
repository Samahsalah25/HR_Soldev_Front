import { useState, useEffect } from "react";
import {
  Coins,
  Plus,
  X,
  Save,
  Trash2,
  ChevronLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getCurrencies,
  getCurrency,
  createCurrency,
  updateCurrency,
  deleteCurrency,
} from "@/api/Currenciesapi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

/* ────────────────────────────────────────────────────────────────────────
   ثوابت وخيارات
   ──────────────────────────────────────────────────────────────────── */

const POSITION_OPTIONS = [
  { value: "before", label: "قبل المبلغ ($100)" },
  { value: "after", label: "بعد المبلغ (100$)" },
];

// أودو محتاج قيمة واحدة بس من التلاتة دول لكل سطر سعر صرف، والباقي
// بيتحسب أوتوماتيك — فبنخلي المستخدم يختار نوع القيمة اللي هيدخلها.
const RATE_FIELD_OPTIONS = [
  { value: "rate", label: "معامل مقابل العملة الأساسية" },
  { value: "company_rate", label: "السعر المباشر مقابل عملة الشركة" },
  { value: "inverse_company_rate", label: "السعر العكسي مقابل عملة الشركة" },
];

const EMPTY_RATE_LINE = () => ({
  _key: Date.now() + Math.random(),
  name: new Date().toISOString().slice(0, 10),
  rate_field: "rate",
  rate_value: "",
});

const EMPTY_CURRENCY = {
  name: "",
  full_name: "",
  symbol: "",
  position: "before",
  rounding: 0.01,
  active: true,
  currency_unit_label: "",
  currency_subunit_label: "",
};

const deletedRatesKey = "_deleted_rate_ids";

/**
 * بناء الـ Payload اللي بيتبعت للباك اند من شكل الفورم المحلي.
 * زي نفس منطق الأسطر في Taxes.jsx وPaymentterms.jsx: أي سطر سعر صرف
 * جاي أصلاً من الباك اند (عنده id حقيقي) بيتبعت بالـ id بتاعه عشان
 * يبقى update، وأي سطر اتمسح وكان عنده id بيتبعت بصيغة { id, _delete: true }.
 */
function buildPayload(form) {
  // سطر سعر صرف من غير قيمة (المستخدم ما لمسهوش) بيتسيب بره الـ payload
  // بدل ما يتبعت بقيمة 0 — سعر صرف = صفر مش منطقي وبيكسر حساب الباك
  // اند التلقائي للحقلين التانيين (rate/company_rate/inverse_company_rate).
  const rateLines = form.rate_ids
    .filter((l) => l.rate_value !== "" && l.rate_value != null)
    .map((l) => {
      const line = { name: l.name, [l.rate_field]: Number(l.rate_value) };
      if (l.id) line.id = l.id;
      return line;
    });
  const deletedLines = (form[deletedRatesKey] || []).map((id) => ({ id, _delete: true }));

  return {
    name: form.name.trim().toUpperCase(),
    full_name: form.full_name.trim(),
    symbol: form.symbol.trim(),
    position: form.position,
    rounding: Number(form.rounding) || 0.01,
    active: !!form.active,
    currency_unit_label: form.currency_unit_label?.trim() || "",
    currency_subunit_label: form.currency_subunit_label?.trim() || "",
    rate_ids: [...rateLines, ...deletedLines],
  };
}

/* ────────────────────────────────────────────────────────────────────────
   صفحة إنشاء / تعديل عملة — Inline Page (مش Modal)
   ──────────────────────────────────────────────────────────────────── */

function CurrencyForm({ currency, onBack, onSaved }) {
  const { toast } = useToast();
  const isEdit = Boolean(currency?.id);

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...EMPTY_CURRENCY,
          ...currency,
          full_name: currency.full_name || "",
          symbol: currency.symbol || "",
          currency_unit_label: currency.currency_unit_label || "",
          currency_subunit_label: currency.currency_subunit_label || "",
          rate_ids: (currency.rate_ids?.length
            ? currency.rate_ids
            : []
          ).map((r) => ({
            _key: r.id ?? Date.now() + Math.random(),
            id: r.id,
            name: r.name?.slice(0, 10) || "",
            rate_field: r.company_rate != null ? "company_rate" : r.inverse_company_rate != null ? "inverse_company_rate" : "rate",
            rate_value: r.company_rate ?? r.inverse_company_rate ?? r.rate ?? "",
          })),
          [deletedRatesKey]: [],
        }
      : { ...EMPTY_CURRENCY, rate_ids: [EMPTY_RATE_LINE()], [deletedRatesKey]: [] }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setLine = (idx, field, value) =>
    setForm((f) => ({ ...f, rate_ids: f.rate_ids.map((l, i) => (i === idx ? { ...l, [field]: value } : l)) }));

  const addLine = () => setForm((f) => ({ ...f, rate_ids: [...f.rate_ids, EMPTY_RATE_LINE()] }));

  const removeLine = (idx) =>
    setForm((f) => {
      const removed = f.rate_ids[idx];
      const remaining = f.rate_ids.filter((_, i) => i !== idx);
      if (removed.id) {
        return { ...f, rate_ids: remaining, [deletedRatesKey]: [...(f[deletedRatesKey] || []), removed.id] };
      }
      return { ...f, rate_ids: remaining };
    });

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) return;
    try {
      setSaving(true);
      const payload = buildPayload(form);
      if (isEdit) {
        await updateCurrency(currency.id, payload);
      } else {
        await createCurrency(payload);
      }
      onSaved();
    } catch (err) {
      console.error("خطأ أثناء حفظ العملة:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ العملة"));
      toast({
        title: "تعذّر حفظ العملة",
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
          <span className="text-gray-800 font-medium">{isEdit ? currency.name : "جديد"}</span>
          <span>/</span>
          <span>العملات</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-10 gap-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">* كود العملة (مثال: USD)</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="USD"
              maxLength={3}
              className="w-full text-2xl font-medium border-0 border-b border-gray-200 focus:outline-none focus:border-orange-400 pb-2 bg-transparent placeholder:text-gray-300 uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">الاسم الكامل</label>
            <input
              value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="United States dollar"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">الرمز</label>
            <input
              value={form.symbol}
              onChange={(e) => set("symbol", e.target.value)}
              placeholder="$"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">موضع الرمز</label>
            <select
              value={form.position}
              onChange={(e) => set("position", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            >
              {POSITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">أقرب وحدة تقريب</label>
            <input
              type="number"
              step="0.001"
              value={form.rounding}
              onChange={(e) => set("rounding", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">اسم الوحدة الأساسية</label>
            <input
              value={form.currency_unit_label}
              onChange={(e) => set("currency_unit_label", e.target.value)}
              placeholder="Dollars"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">اسم الوحدة الفرعية</label>
            <input
              value={form.currency_subunit_label}
              onChange={(e) => set("currency_subunit_label", e.target.value)}
              placeholder="Cents"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
            />
          </div>
        </div>

        {/* أسعار الصرف */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">أسعار الصرف</p>
          <p className="text-[11px] text-gray-400 mb-2">
            اختاري نوع القيمة اللي هتدخليها لكل سطر (معامل / سعر مباشر / سعر عكسي)، والباقي هيتحسب أوتوماتيك.
          </p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-3 py-2 font-medium text-gray-500">التاريخ</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">نوع القيمة</th>
                  <th className="text-right px-3 py-2 font-medium text-gray-500">القيمة</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {form.rate_ids.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">لا توجد أسعار صرف مضافة</td>
                  </tr>
                ) : (
                  form.rate_ids.map((l, i) => (
                    <tr key={l._key ?? i} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">
                        <input
                          type="date"
                          value={l.name}
                          onChange={(e) => setLine(i, "name", e.target.value)}
                          className="px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={l.rate_field}
                          onChange={(e) => setLine(i, "rate_field", e.target.value)}
                          className="px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                        >
                          {RATE_FIELD_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={l.rate_value}
                          onChange={(e) => setLine(i, "rate_value", e.target.value)}
                          className="w-28 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeLine(i)} className="p-1 hover:bg-red-50 text-red-400 rounded">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <button onClick={addLine} className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline px-3 py-2">
              <Plus className="w-3 h-3" /> إضافة سعر صرف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية — Currencies List
   ──────────────────────────────────────────────────────────────────── */

export default function Currencies() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [currencies, setCurrencies] = useState([]);
  const [activeOnly, setActiveOnly] = useState(false);
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
      // ⚠️ مهم (مؤكَّد عبر Postman): active=true بيرجع العملات المفعّلة
      // بس. من غير أي query خالص بيرجع كل العملات (مفعّلة ومعطّلة مع بعض).
      const data = await getCurrencies(activeOnly ? { active: true } : {});
      setCurrencies(data);
    } catch (err) {
      console.error("خطأ أثناء تحميل العملات:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل العملات"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  const openEdit = async (id) => {
    try {
      setOpeningId(id);
      const full = await getCurrency(id);
      setSelected(full);
    } catch (err) {
      console.error("خطأ أثناء جلب العملة:", err);
      toast({
        title: "تعذّر فتح العملة",
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
      title: "حذف العملة",
      message: "متأكد من حذف العملة دي؟",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteCurrency(id);
      toast({ title: "تم حذف العملة" });
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف العملة:", err);
      toast({
        title: "تعذّر حذف العملة",
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
    return <CurrencyForm currency={selected} onBack={() => setSelected(null)} onSaved={handleSaved} />;
  }
  if (creating) {
    return <CurrencyForm currency={null} onBack={() => setCreating(false)} onSaved={handleSaved} />;
  }

  return (
    <div className="p-6 space-y-5 w-full bg-white" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            العملات
            <Coins className="w-5 h-5 text-gray-400" />
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">إدارة العملات وأسعار الصرف الخاصة بها</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          عملة جديدة <Plus className="w-4 h-4" />
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-600 w-fit cursor-pointer">
        <input
          type="checkbox"
          checked={activeOnly}
          onChange={(e) => setActiveOnly(e.target.checked)}
          className="w-4 h-4 accent-orange-500"
        />
        إظهار العملات المفعّلة فقط
      </label>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري تحميل العملات...
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
                {["الكود", "الاسم الكامل", "الرمز", "الموضع", "التقريب", "الحالة", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currencies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">لا توجد عملات بعد</td>
                </tr>
              ) : (
                currencies.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => openEdit(c.id)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-500">{c.full_name || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.symbol || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {POSITION_OPTIONS.find((o) => o.value === c.position)?.label || c.position || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.rounding ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.active ? "مفعّلة" : "معطّلة"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => handleDelete(e, c.id)}
                          disabled={deletingId === c.id}
                          className="text-gray-300 hover:text-red-500 p-1"
                          title="حذف"
                        >
                          {deletingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        {openingId === c.id ? (
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
