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
  getLeaveTypes,
  getLeaveType,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  getLeaveBalances,
  getLeaveTransactions,
} from "@/api/VacationTypesApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

/* ────────────────────────────────────────────────────────────────────────
   ثوابت وخيارات (نفس الأسماء والقيم اللي الباك اند بيتوقعها بالظبط)
   ──────────────────────────────────────────────────────────────────── */

const REQUEST_UNIT = [
  { value: "day", label: "يوم" },
  { value: "half_day", label: "نصف يوم" },
  { value: "hour", label: "ساعة" },
];

const TIME_TYPE = [
  { value: "leave", label: "أجازة" },
  { value: "other", label: "أخرى" },
];

// مستخدم في: جهة اعتماد الطلب (leave_validation_type) وجهة اعتماد
// طلب التخصيص (allocation_validation_type) — نفس القيم الأربعة
const VALIDATION_TYPE = [
  { value: "no_validation", label: "بدون اعتماد" },
  { value: "hr", label: "بواسطة مسؤول الإجازات" },
  { value: "manager", label: "بواسطة المدير المباشر" },
  { value: "both", label: "اعتماد مزدوج (مدير + مسؤول إجازات)" },
];

const PERIOD_TYPE = [
  { value: "ROLLING_YEAR", label: "سنة متجددة" },
  { value: "CALENDAR_YEAR", label: "سنة ميلادية" },
  { value: "LIFETIME", label: "مدى الحياة" },
  { value: "PER_EVENT", label: "لكل حادثة" },
];

const YES_NO = [
  { value: "yes", label: "نعم" },
  { value: "no", label: "لا" },
];

const STEPS = [
  { key: "basic", label: "المعلومات الأساسية" },
  { key: "balance", label: "إعدادات الرصيد" },
  { key: "display", label: "إعدادات النظام والعرض" },
  { key: "rules", label: "قواعد النظام (الشرائح)" },
];

const EMPTY_RULE = () => ({
  _key: Date.now() + Math.random(),
  tier_order: 1,
  min_service_days: 0,
  max_service_days: 0,
  from_day: 1,
  to_day: 30,
  max_days: 30,
  pay_percentage: 100,
  period_type: "ROLLING_YEAR",
});

const EMPTY_TYPE = {
  name: "",
  time_type: "leave",
  request_unit: "day",
  // ⚠️ في عينات الباك اند اتبعت الحقلين دول بنفس القيمة سوا، فالفورم
  // بيربطهم في تحكم واحد "يتطلب مستند داعم". لو فيه فرق فعلي بينهم
  // افصليهم لاحقًا بحقلين منفصلين.
  support_document: false,
  requires_attachment: false,
  is_accrual_based: false,
  legal_reference: "",
  leave_validation_type: "no_validation",
  requires_allocation: "no",
  allocation_validation_type: "no_validation",
  allows_negative: false,
  overtime_deductible: false,
  include_public_holidays_in_duration: false,
  show_on_dashboard: true,
  timesheet_generate: false,
  employee_requests: "no",
  affects_gosi: false,
  // 🆕 التخصيص التلقائي عند إنشاء الموظف — auto_allocation_days بيظهر
  // ويتبعت بس لو auto_allocate_on_create = true
  auto_allocate_on_create: false,
  auto_allocation_days: 0,
  responsible_ids: [],
  rules: [],
  // قايمة id بتوع القواعد (rules) اللي اتمسحت من الفورم وكانت أصلاً
  // موجودة في الباك اند (عندها id حقيقي)، بتتبعت في الآخر كـ
  // { id, _delete: true } زي ما اتعمل بالظبط مع Payment Terms
  _deleted_rule_ids: [],
};

/**
 * بناء الـ Payload اللي بيتبعت للباك اند من شكل الفورم المحلي
 */
function buildPayload(form) {
  const activeRules = form.rules.map((r) => {
    const rule = {
      tier_order: Number(r.tier_order) || 1,
      min_service_days: Number(r.min_service_days) || 0,
      max_service_days: Number(r.max_service_days) || 0,
      from_day: Number(r.from_day) || 0,
      to_day: Number(r.to_day) || 0,
      max_days: Number(r.max_days) || 0,
      pay_percentage: Number(r.pay_percentage) || 0,
      period_type: r.period_type,
    };
    // لو القاعدة دي جايه أصلاً من الباك اند (عندها id حقيقي) ابعتيه
    // عشان يتعمللها update مش create جديد بنفس البيانات
    if (r.id) rule.id = r.id;
    return rule;
  });

  const deletedRules = (form._deleted_rule_ids || []).map((id) => ({ id, _delete: true }));

  return {
    name: form.name.trim(),
    time_type: form.time_type,
    request_unit: form.request_unit,
    support_document: !!form.support_document,
    requires_attachment: !!form.support_document, // مربوط بنفس التحكم
    is_accrual_based: !!form.is_accrual_based,
    legal_reference: typeof form.legal_reference === "string" ? form.legal_reference.trim() : "",
    leave_validation_type: form.leave_validation_type,
    requires_allocation: form.requires_allocation,
    allocation_validation_type: form.allocation_validation_type,
    allows_negative: !!form.allows_negative,
    overtime_deductible: !!form.overtime_deductible,
    include_public_holidays_in_duration: !!form.include_public_holidays_in_duration,
    show_on_dashboard: !!form.show_on_dashboard,
    timesheet_generate: !!form.timesheet_generate,
    employee_requests: form.employee_requests,
    affects_gosi: !!form.affects_gosi,
    // 🆕 لو الـ checkbox مقفول نبعت 0 عشان الحقل يفضل موجود في الـ payload
    // (الباك اند مستنيه دايمًا)، بس القيمة بتتصفر لو مش مفعّل
    auto_allocate_on_create: !!form.auto_allocate_on_create,
    auto_allocation_days: form.auto_allocate_on_create ? Number(form.auto_allocation_days) || 0 : 0,
    responsible_ids: form.responsible_ids,
    rules: [...activeRules, ...deletedRules],
  };
}

/* ────────────────────────────────────────────────────────────────────────
   صف راديو نعم/لا بسيط — بنفس ستايل الصور
   ──────────────────────────────────────────────────────────────────── */
function YesNoField({ label, value, onChange, disabled = false, hint }) {
  return (
    <div className="max-w-md space-y-1">
      <div className="flex items-center justify-between">
        <label className={`text-sm ${disabled ? "text-gray-300" : "text-gray-700"}`}>{label}</label>
        <div className="flex items-center gap-4">
          {YES_NO.map((o) => (
            <label
              key={o.value}
              className={`flex items-center gap-1.5 text-sm ${disabled ? "text-gray-300 cursor-not-allowed" : "text-gray-600 cursor-pointer"}`}
            >
              <input
                type="radio"
                disabled={disabled}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
                className="w-4 h-4 accent-orange-500 disabled:opacity-40"
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
      {hint && <p className="text-xs text-amber-600">{hint}</p>}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   صفحة إنشاء / تعديل نوع إجازة — Inline Page (مش Modal) بأربع خطوات
   ──────────────────────────────────────────────────────────────────── */

function LeaveTypeForm({ leaveType, onBack, onSaved }) {
  const { toast } = useToast();
  const isEdit = Boolean(leaveType?.id);
  const [step, setStep] = useState("basic");

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          ...EMPTY_TYPE,
          ...leaveType,
          // ⚠️ الباك اند بيرجع legal_reference كـ false (boolean) لو فاضية
          // بدل "" (string)، فبنجبرها تبقى نص دايمًا عشان .trim() ماتكسرش
          legal_reference: leaveType.legal_reference && typeof leaveType.legal_reference === "string" ? leaveType.legal_reference : "",
          responsible_ids: leaveType.responsible_ids || [],
          // 🆕 تأمين القيم الافتراضية لو الباك اند رجّع null بدل false/رقم
          auto_allocate_on_create: !!leaveType.auto_allocate_on_create,
          auto_allocation_days: leaveType.auto_allocation_days ?? 0,
          rules: (leaveType.rules || []).map((r) => ({ ...r, _key: r.id ?? Date.now() + Math.random() })),
          _deleted_rule_ids: [],
        }
      : { ...EMPTY_TYPE, rules: [], _deleted_rule_ids: [] }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setRule = (idx, field, value) =>
    setForm((f) => ({ ...f, rules: f.rules.map((r, i) => (i === idx ? { ...r, [field]: value } : r)) }));

  const addRule = () =>
    setForm((f) => ({
      ...f,
      rules: [...f.rules, { ...EMPTY_RULE(), tier_order: f.rules.length + 1 }],
    }));

  const removeRule = (idx) =>
    setForm((f) => {
      const removed = f.rules[idx];
      const remaining = f.rules.filter((_, i) => i !== idx);
      if (removed.id) {
        return { ...f, rules: remaining, _deleted_rule_ids: [...(f._deleted_rule_ids || []), removed.id] };
      }
      return { ...f, rules: remaining };
    });

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("لازم تدخلي اسم الإجازة");
      setStep("basic");
      return;
    }
    try {
      setSaving(true);
      const payload = buildPayload(form);
      if (isEdit) {
        await updateLeaveType(leaveType.id, payload);
      } else {
        await createLeaveType(payload);
      }
      onSaved();
    } catch (err) {
      console.error("خطأ أثناء حفظ نوع الإجازة:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ نوع الإجازة"));
      toast({
        title: "تعذّر حفظ نوع الإجازة",
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
          <button onClick={onBack} title="إلغاء" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
            <X className="w-4 h-4" /> إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            title="حفظ"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <span className="text-gray-800 font-medium">{isEdit ? leaveType.name : "جديد"}</span>
          <span>/</span>
          <span>الإجازات والتذاكر</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 border-b border-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Steps tabs */}
      <div className="flex items-center gap-6 px-6 border-b border-gray-200 overflow-x-auto">
        {STEPS.map((s) => (
          <button
            key={s.key}
            onClick={() => setStep(s.key)}
            className={`py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              step === s.key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* ── خطوة 1: المعلومات الأساسية ───────────────────────────── */}
        {step === "basic" && (
          <div className="max-w-3xl space-y-6">
            <div className="flex items-center gap-2 text-orange-500 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm flex items-center justify-center">1</span>
              المعلومات الأساسية
            </div>
            <p className="text-xs text-gray-400 -mt-4">معلومات عامة عن نوع الإجازة.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">* اسم الإجازة</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="مثال: إجازة زواج"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">* نوع المدة</label>
                <select
                  value={form.time_type}
                  onChange={(e) => set("time_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  {TIME_TYPE.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">* وحدة الطلب</label>
                <select
                  value={form.request_unit}
                  onChange={(e) => set("request_unit", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  {REQUEST_UNIT.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <YesNoField
              label="يتطلب مستند داعم"
              value={form.support_document ? "yes" : "no"}
              onChange={(v) => set("support_document", v === "yes")}
            />

            <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
              <p className="text-sm font-bold text-gray-700">الاستحقاق</p>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_accrual_based}
                  onChange={(e) => set("is_accrual_based", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
                تعتمد على الاستحقاق؟
              </label>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">* المرجع القانوني</label>
                <input
                  value={form.legal_reference}
                  onChange={(e) => set("legal_reference", e.target.value)}
                  placeholder="مثال: المادة 113"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">* جهة اعتماد الطلب</label>
                <select
                  value={form.leave_validation_type}
                  onChange={(e) => set("leave_validation_type", e.target.value)}
                  className="w-full sm:w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  {VALIDATION_TYPE.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── خطوة 2: إعدادات الرصيد ───────────────────────────── */}
        {step === "balance" && (
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-2 text-orange-500 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm flex items-center justify-center">2</span>
              إعدادات الرصيد
            </div>
            <p className="text-xs text-gray-400 -mt-4">إعدادات تخصيص رصيد الإجازة.</p>

            <YesNoField
              label="تتطلب تخصيص رصيد؟"
              value={form.requires_allocation}
              onChange={(v) => set("requires_allocation", v)}
              disabled={isEdit}
              hint={
                isEdit
                  ? "لا يمكن تغيير هذا الإعداد بعد إنشاء الإجازة، خصوصًا لو اتصرف عليها إجازات فعلاً. لو محتاجة تغيّريه، الأفضل تعملي نوع إجازة جديد."
                  : undefined
              }
            />
            <YesNoField
              label="السماح بالرصيد السالب"
              value={form.allows_negative ? "yes" : "no"}
              onChange={(v) => set("allows_negative", v === "yes")}
            />
            <YesNoField
              label="خصم الساعات الإضافية"
              value={form.overtime_deductible ? "yes" : "no"}
              onChange={(v) => set("overtime_deductible", v === "yes")}
            />
            <YesNoField
              label="احتساب العطلات الرسمية ضمن مدة الإجازة"
              value={form.include_public_holidays_in_duration ? "yes" : "no"}
              onChange={(v) => set("include_public_holidays_in_duration", v === "yes")}
            />

            {/* 🆕 التخصيص التلقائي عند إنشاء الموظف */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50/50">
              <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                التخصيص التلقائي
              </p>

              <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer max-w-md">
                <span className="flex items-center gap-1">
                  تخصيص تلقائي عند إنشاء الموظف
                  <span
                    className="text-blue-400 cursor-help text-xs"
                    title="لو مفعّل، هيتم تخصيص رصيد للموظف تلقائيًا بمجرد إنشائه"
                  >
                    ❓
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.auto_allocate_on_create}
                  onChange={(e) => set("auto_allocate_on_create", e.target.checked)}
                  className="w-4 h-4 accent-orange-500"
                />
              </label>

              {form.auto_allocate_on_create && (
                <div className="max-w-md">
                  <label className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                    عدد أيام التخصيص التلقائي
                    <span
                      className="text-blue-400 cursor-help"
                      title="عدد الأيام اللي هتتخصص تلقائيًا للموظف عند إنشائه"
                    >
                      ❓
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.auto_allocation_days}
                    onChange={(e) => set("auto_allocation_days", e.target.value)}
                    placeholder="5.00"
                    className="w-full sm:w-1/2 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300"
                  />
                </div>
              )}
            </div>

            <div className="max-w-md">
              <label className="text-xs text-gray-400 mb-1 block">* جهة اعتماد طلب التخصيص</label>
              <select
                value={form.allocation_validation_type}
                onChange={(e) => set("allocation_validation_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              >
                {VALIDATION_TYPE.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {form.requires_allocation === "yes" && (
              <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                يجب تخصيص رصيد لهذه الإجازة قبل أن يتمكن الموظفون من طلبها.
              </p>
            )}
          </div>
        )}

        {/* ── خطوة 3: إعدادات النظام والعرض ───────────────────────────── */}
        {step === "display" && (
          <div className="max-w-3xl space-y-5">
            <div className="flex items-center gap-2 text-orange-500 font-bold text-lg">
              <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm flex items-center justify-center">3</span>
              إعدادات النظام والعرض
            </div>
            <p className="text-xs text-gray-400 -mt-4">إعدادات متعلقة بعرض الإجازة في النظام.</p>

            <YesNoField
              label="عرض الإجازة في لوحة التحكم"
              value={form.show_on_dashboard ? "yes" : "no"}
              onChange={(v) => set("show_on_dashboard", v === "yes")}
            />
            <YesNoField
              label="إنشاء سجل ساعات العمل تلقائيًا"
              value={form.timesheet_generate ? "yes" : "no"}
              onChange={(v) => set("timesheet_generate", v === "yes")}
            />
            <YesNoField
              label="يمكن للموظف تقديم الطلب مباشرة"
              value={form.employee_requests}
              onChange={(v) => set("employee_requests", v)}
            />
            <YesNoField
              label="يؤثر على التأمينات الاجتماعية (GOSI)"
              value={form.affects_gosi ? "yes" : "no"}
              onChange={(v) => set("affects_gosi", v === "yes")}
            />

            <div className="max-w-md">
              <label className="text-xs text-gray-400 mb-1 block">المسؤولون عن الاعتماد (أرقام IDs مفصولة بفاصلة)</label>
              <input
                value={form.responsible_ids.join(",")}
                onChange={(e) =>
                  set(
                    "responsible_ids",
                    e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean)
                      .map(Number)
                      .filter((n) => !Number.isNaN(n))
                  )
                }
                placeholder="مثال: 1, 2"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>
        )}

        {/* ── خطوة 4: قواعد النظام (الشرائح) ───────────────────────────── */}
        {step === "rules" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-500 font-bold text-lg">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 text-sm flex items-center justify-center">4</span>
                قواعد النظام (الشرائح)
              </div>
              <button
                onClick={addRule}
                className="flex items-center gap-1 text-xs text-orange-600 font-medium hover:underline"
              >
                <Plus className="w-3 h-3" /> إضافة قاعدة
              </button>
            </div>
            <p className="text-xs text-gray-400">تحديد قواعد الاستحقاق ونسبة الأجر حسب مدة الإجازة.</p>

            <div className="border border-gray-200 rounded-lg overflow-x-auto">
              <table className="w-full text-xs min-w-[720px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-right px-3 py-2 font-medium text-gray-500">#</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">نوع الفترة</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">من اليوم</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">إلى اليوم</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">الحد الأقصى للأيام</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-500">نسبة الأجر</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {form.rules.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-gray-400">لا توجد قواعد بعد</td>
                    </tr>
                  ) : (
                    form.rules.map((r, i) => (
                      <tr key={r._key ?? i} className="border-b border-gray-100 last:border-0 align-top">
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={r.tier_order}
                            onChange={(e) => setRule(i, "tier_order", e.target.value)}
                            className="w-12 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={r.period_type}
                            onChange={(e) => setRule(i, "period_type", e.target.value)}
                            className="px-1.5 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 min-w-[130px]"
                          >
                            {PERIOD_TYPE.map((p) => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={r.from_day}
                            onChange={(e) => setRule(i, "from_day", e.target.value)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={r.to_day}
                            onChange={(e) => setRule(i, "to_day", e.target.value)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={r.max_days}
                            onChange={(e) => setRule(i, "max_days", e.target.value)}
                            className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={r.pay_percentage}
                              onChange={(e) => setRule(i, "pay_percentage", e.target.value)}
                              className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                            />
                            %
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            onClick={() => removeRule(i)}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   تبويب: أنواع الأجازات (List)
   ──────────────────────────────────────────────────────────────────── */

function allocationLabel(value) {
  return VALIDATION_TYPE.find((o) => o.value === value)?.label || "—";
}

function LeaveTypesTab() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [types, setTypes] = useState([]);
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
      setTypes(await getLeaveTypes());
    } catch (err) {
      console.error("خطأ أثناء تحميل أنواع الإجازات:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل أنواع الإجازات"));
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
      setSelected(await getLeaveType(id));
    } catch (err) {
      console.error("خطأ أثناء جلب نوع الإجازة:", err);
      toast({ title: "تعذّر فتح نوع الإجازة", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: "حذف نوع الإجازة",
      message: "متأكد من حذف نوع الإجازة ده؟",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteLeaveType(id);
      toast({ title: "تم حذف نوع الإجازة" });
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف نوع الإجازة:", err);
      toast({ title: "تعذّر حذف نوع الإجازة", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    setSelected(null);
    setCreating(false);
    load();
  };

  if (selected) return <LeaveTypeForm leaveType={selected} onBack={() => setSelected(null)} onSaved={handleSaved} />;
  if (creating) return <LeaveTypeForm leaveType={null} onBack={() => setCreating(false)} onSaved={handleSaved} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          أضافة إجازة جديدة <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل أنواع الإجازات...
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
                {["اسم الأجازة", "اعتماد التخصيص", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {types.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-400">لا توجد أنواع إجازات بعد</td>
                </tr>
              ) : (
                types.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openEdit(t.id)}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-gray-800">{t.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                        {allocationLabel(t.allocation_validation_type)}
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

/* ────────────────────────────────────────────────────────────────────────
   تبويب: أرصدة الإجازات
   ⚠️ الـ API رجع data:[] فاضية، فأسماء الحقول تحت افتراضية — عدّليها
   لما يكون عندك عنصر حقيقي واحد على الأقل من /requests/vacation/balances
   ──────────────────────────────────────────────────────────────────── */

function LeaveBalancesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLeaveBalances();
        setRows(res.data || []);
      } catch (err) {
        console.error("خطأ أثناء تحميل أرصدة الإجازات:", err);
        setError(extractApiErrorMessage(err, "تعذر تحميل أرصدة الإجازات"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل أرصدة الإجازات...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b border-gray-200">
            {["الموظف", "نوع الإجازة", "السنة", "الرصيد الافتتاحي", "الأيام المستحقة", "الأيام المستخدمة", "الرصيد المتبقي"].map((h) => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-10 text-gray-400">لا توجد أرصدة بعد</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id ?? i} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-semibold text-gray-800">{r.employee_name ?? r.employee ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                    {r.leave_type_name ?? r.leave_type ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{r.year ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{r.opening_balance ?? "0.00"}</td>
                <td className="px-4 py-3 text-gray-500">{r.allocated_days ?? r.accrued_days ?? "0.00"}</td>
                <td className="px-4 py-3 text-gray-500">{r.used_days ?? "0.00"}</td>
                <td className="px-4 py-3 font-bold text-gray-800">{r.remaining_balance ?? "0.00"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   تبويب: سجل أجازات الموظفين
   ⚠️ نفس ملاحظة تبويب الأرصدة بخصوص أسماء الحقول
   ──────────────────────────────────────────────────────────────────── */

function LeaveTransactionsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLeaveTransactions();
        setRows(res.data || []);
      } catch (err) {
        console.error("خطأ أثناء تحميل سجل أجازات الموظفين:", err);
        setError(extractApiErrorMessage(err, "تعذر تحميل سجل أجازات الموظفين"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل سجل أجازات الموظفين...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
        <AlertCircle className="w-4 h-4" />
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b border-gray-200">
            {["الموظف", "نوع الإجازة", "نوع المعاملة", "الأيام", "تاريخ الإنشاء", "وقت الإنشاء", "الملاحظات"].map((h) => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-10 text-gray-400">لا توجد معاملات بعد</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={r.id ?? i} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-semibold text-gray-800">{r.employee_name ?? r.employee ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                    {r.leave_type_name ?? r.leave_type ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{r.transaction_type ?? r.type ?? "—"}</td>
                <td className="px-4 py-3 font-bold text-gray-800">{r.days ?? "0.00"}</td>
                <td className="px-4 py-3 text-gray-500">{r.created_date ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{r.created_time ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400">{r.notes ?? "—"}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية — الإجازات والتذاكر
   ──────────────────────────────────────────────────────────────────── */

const TOP_TABS = [
  { key: "types", label: "أنواع الأجازات" },
  { key: "balances", label: "أرصدة الإجازات" },
  { key: "log", label: "سجل أجازات الموظفين" },
];

export default function LeavesSettings() {
  const [tab, setTab] = useState("types");

  return (
    <div className="p-6 space-y-5 w-full bg-white" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          الإجازات والتذاكر
          <CalendarClock className="w-5 h-5 text-gray-400" />
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">وفق المادة 109 من نظام العمل السعودي</p>
      </div>

      <div className="flex items-center gap-6 border-b border-gray-200">
        {TOP_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "types" && <LeaveTypesTab />}
      {tab === "balances" && <LeaveBalancesTab />}
      {tab === "log" && <LeaveTransactionsTab />}
    </div>
  );
}