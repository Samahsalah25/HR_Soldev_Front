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

/**
 * بناء الـ Payload اللي بيتبعت للباك اند من شكل الفورم المحلي
 *
 * ملاحظة مهمة (الإصلاح):
 * لازم نبعت الـ id بتاع كل سطر توزيع (repartition line) لو كان موجود
 * (يعني السطر ده أصلاً موجود في قاعدة البيانات وجاي من getTax).
 * لو ما بعتناش الـ id، الباك اند مش هيعرف يفرّق بين "سطر قديم اتعدل"
 * و"سطر جديد"، وغالبًا هيحاول يمسح الأسطر القديمة ويعمل غيرها من الصفر،
 * وده ممكن يفشل (500) لو الأسطر دي مربوطة بقيود محاسبية فعلية.
 */
function buildPayload(form) {
  const mapLines = (lines) =>
    lines.map((l) => {
      const line = {
        repartition_type: l.repartition_type,
        factor_percent: Number(l.factor_percent) || 0,
      };

      // لو السطر ده جاي من الباك اند أصلاً (عنده id رقمي حقيقي) ابعتيه
      // عشان يبقى update مش delete+create
      if (l.id) {
        line.id = l.id;
      }

      if (l.repartition_type === "tax" && l.account_id) {
        line.account_id = Number(l.account_id);
      }
      return line;
    });

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
    invoice_repartition_line_ids: mapLines(form.invoice_repartition_line_ids),
    refund_repartition_line_ids: mapLines(form.refund_repartition_line_ids),
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
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-2">{title}</p>
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
            {lines.map((l, i) => (
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
                    className="px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                  >
                    {REPARTITION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={l.account_id}
                    onChange={(e) => onChange(i, "account_id", e.target.value)}
                    disabled={l.repartition_type === "base"}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:bg-gray-50 disabled:text-gray-300 min-w-[160px]"
                  >
                    <option value="">بدون حساب...</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{formatAccountLabel(a)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => onRemove(i)} className="p-1 hover:bg-red-50 text-red-400 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onAdd} className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline px-3 py-2">
          <Plus className="w-3 h-3" /> إضافة سطر
        </button>
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
          tax_scope: tax.tax_scope || "",
          invoice_label: tax.invoice_label || "",
          price_include_override: tax.price_include_override || "default",
          invoice_repartition_line_ids: (tax.invoice_repartition_line_ids?.length
            ? tax.invoice_repartition_line_ids
            : EMPTY_TAX.invoice_repartition_line_ids
          ).map((l) => ({ ...l, _key: l.id ?? Date.now() + Math.random(), account_id: l.account_id || "" })),
          refund_repartition_line_ids: (tax.refund_repartition_line_ids?.length
            ? tax.refund_repartition_line_ids
            : EMPTY_TAX.refund_repartition_line_ids
          ).map((l) => ({ ...l, _key: l.id ?? Date.now() + Math.random(), account_id: l.account_id || "" })),
        }
      : { ...EMPTY_TAX }
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
  const removeLine = (key, idx) =>
    setForm((f) => (f[key].length > 1 ? { ...f, [key]: f[key].filter((_, i) => i !== idx) } : f));

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) return;
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
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