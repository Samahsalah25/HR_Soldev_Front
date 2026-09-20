import { useState, useEffect } from "react";
import {
  Gauge,
  Plus,
  X,
  Save,
  Trash2,
  ChevronLeft,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Users,
  TrendingUp,
  FlaskConical,
  Layers,
} from "lucide-react";
import {
  getNitaqatStatus,
  simulateNitaqat,
  getNitaqatBands,
  getNitaqatBand,
  createNitaqatBand,
  updateNitaqatBand,
  deleteNitaqatBand,
  getCompanies,
} from "@/api/NitaqatApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

/* ────────────────────────────────────────────────────────────────────────
   ثوابت
   ──────────────────────────────────────────────────────────────────── */

const TOP_TABS = [
  { key: "status", label: "الحالة الحالية", icon: TrendingUp },
  { key: "simulate", label: "المحاكاة", icon: FlaskConical },
  { key: "bands", label: "الشرائح", icon: Layers },
];

// تسميات عربية لأشهر الحقول اللي ممكن ترجع من /simulate — أي حقل تاني
// غير متوقع بيتعرض بمفتاحه الأصلي كـ fallback بدل ما يتجاهل
const KNOWN_FIELD_LABELS = {
  total_employees: "إجمالي الموظفين",
  saudi_points: "نقاط السعودة",
  saudization_rate: "نسبة السعودة",
  saudis_count: "عدد السعوديين",
  expats_count: "عدد غير السعوديين",
};

/* ────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

function formatPercent(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return `${n.toFixed(2)}%`;
}

/* ────────────────────────────────────────────────────────────────────────
   مكوّن مشترك: عرض النطاق الحالي (اسم + لون) + شريط نسبة السعودة
   ──────────────────────────────────────────────────────────────────── */

function BandChip({ band }) {
  if (!band) return <span className="text-gray-400 text-sm">غير محدد</span>;
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-sm font-semibold text-gray-700">
      <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: band.color || "#ccc" }} />
      {band.name}
    </span>
  );
}

function RateBar({ value, band }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: band?.color || "#f97316" }}
      />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   بطاقة نتيجة موحّدة — تُستخدم للحالة الفعلية ولنتيجة المحاكاة معًا
   (دفاعية: بتعرض بس الحقول الموجودة فعليًا في الـ response)
   ──────────────────────────────────────────────────────────────────── */

function NitaqatResultCard({ result, title }) {
  if (!result) return null;

  const knownKeys = ["success", "total_employees", "saudi_points", "saudization_rate", "current_band", "warning"];
  const extraEntries = Object.entries(result).filter(
    ([k, v]) => !knownKeys.includes(k) && typeof v !== "object"
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
      {title && <p className="text-sm font-bold text-gray-700">{title}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {"total_employees" in result && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">إجمالي الموظفين</p>
              <p className="text-lg font-bold text-gray-800">{result.total_employees}</p>
            </div>
          </div>
        )}
        {"saudi_points" in result && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <Gauge className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">نقاط السعودة</p>
              <p className="text-lg font-bold text-gray-800">{result.saudi_points}</p>
            </div>
          </div>
        )}
        {"current_band" in result && (
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col justify-center gap-1.5">
            <p className="text-xs text-gray-400">النطاق الحالي</p>
            <BandChip band={result.current_band} />
          </div>
        )}
      </div>

      {"saudization_rate" in result && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">نسبة السعودة</span>
            <span className="font-bold text-gray-800">{formatPercent(result.saudization_rate)}</span>
          </div>
          <RateBar value={result.saudization_rate} band={result.current_band} />
          {result.current_band && (
            <p className="text-[11px] text-gray-400">
              نطاق "{result.current_band.name}": من {result.current_band.min_percentage}% إلى {result.current_band.max_percentage}%
            </p>
          )}
        </div>
      )}

      {result.warning && (
        <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 px-4 py-3 rounded-xl">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {result.warning}
        </div>
      )}

      {/* أي حقول تانية غير متوقعة راجعة من الباك اند بتتعرض هنا بدل ما تتجاهل */}
      {extraEntries.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          {extraEntries.map(([k, v]) => (
            <div key={k} className="text-sm">
              <p className="text-xs text-gray-400">{KNOWN_FIELD_LABELS[k] || k}</p>
              <p className="font-semibold text-gray-700">{String(v)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   تبويب: الحالة الحالية
   ──────────────────────────────────────────────────────────────────── */

function NitaqatStatusTab() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStatus(await getNitaqatStatus());
    } catch (err) {
      console.error("خطأ أثناء تحميل حالة نطاقات:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل حالة نطاقات"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل الحالة...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
        <AlertCircle className="w-4 h-4" />
        {error}
        <button onClick={load} className="underline mr-auto">إعادة المحاولة</button>
      </div>
    );
  }

  return <NitaqatResultCard result={status} />;
}

/* ────────────────────────────────────────────────────────────────────────
   تبويب: المحاكاة
   ──────────────────────────────────────────────────────────────────── */

const EMPTY_SIM_FORM = { saudis_to_hire: 0, saudis_to_fire: 0, expats_to_hire: 0, expats_to_fire: 0 };

function NitaqatSimulateTab() {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_SIM_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    try {
      setLoading(true);
      const payload = {
        saudis_to_hire: Number(form.saudis_to_hire) || 0,
        saudis_to_fire: Number(form.saudis_to_fire) || 0,
        expats_to_hire: Number(form.expats_to_hire) || 0,
        expats_to_fire: Number(form.expats_to_fire) || 0,
      };
      const res = await simulateNitaqat(payload);
      if (!res || typeof res !== "object") {
        setError("الباك اند رجّع استجابة غير متوقعة");
        return;
      }
      setResult(res);
    } catch (err) {
      console.error("خطأ أثناء تشغيل المحاكاة:", err);
      setError(extractApiErrorMessage(err, "تعذر تشغيل المحاكاة"));
      toast({ title: "تعذّر تشغيل المحاكاة", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <p className="text-sm font-bold text-gray-700 mb-4">محاكاة تغييرات على القوى العاملة</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">سعوديين هيتم تعيينهم</label>
            <input
              type="number"
              min={0}
              value={form.saudis_to_hire}
              onChange={(e) => set("saudis_to_hire", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">سعوديين هيتم إنهاء خدمتهم</label>
            <input
              type="number"
              min={0}
              value={form.saudis_to_fire}
              onChange={(e) => set("saudis_to_fire", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">غير سعوديين هيتم تعيينهم</label>
            <input
              type="number"
              min={0}
              value={form.expats_to_hire}
              onChange={(e) => set("expats_to_hire", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">غير سعوديين هيتم إنهاء خدمتهم</label>
            <input
              type="number"
              min={0}
              value={form.expats_to_fire}
              onChange={(e) => set("expats_to_fire", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-5 flex items-center gap-1.5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />} تشغيل المحاكاة
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {result && <NitaqatResultCard result={result} title="نتيجة المحاكاة" />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   فورم إنشاء / تعديل شريحة (Band) — بنفس منطق الـ 3 حالات:
   سطر موجود يتعدل / سطر موجود يتمسح (_delete:true) / سطر جديد من غير id
   ──────────────────────────────────────────────────────────────────── */

const EMPTY_LINE = () => ({
  _key: Date.now() + Math.random(),
  name: "",
  color: "#f97316",
  min_percentage: 0,
  max_percentage: 0,
});

const EMPTY_BAND = {
  name: "",
  is_global: false,
  company_ids: [],
  lines: [EMPTY_LINE()],
  _deleted_line_ids: [],
};

function buildBandPayload(form) {
  const activeLines = form.lines.map((l) => {
    const line = {
      name: l.name,
      color: l.color,
      min_percentage: Number(l.min_percentage) || 0,
      max_percentage: Number(l.max_percentage) || 0,
    };
    // سطر موجود أصلاً في الباك اند → لازم نبعت id بتاعه عشان يتعمله update
    if (l.id) line.id = l.id;
    return line;
  });

  // سطور كانت موجودة واتمسحت من الفورم → تتبعت { id, _delete: true }
  const deletedLines = (form._deleted_line_ids || []).map((id) => ({ id, _delete: true }));

  return {
    name: form.name.trim(),
    is_global: !!form.is_global,
    company_ids: form.is_global ? [] : form.company_ids.map(Number),
    lines: [...activeLines, ...deletedLines],
  };
}

function NitaqatBandForm({ band, companies, onBack, onSaved }) {
  const { toast } = useToast();
  const isEdit = Boolean(band?.id);

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          name: band.name || "",
          is_global: !!band.is_global,
          company_ids: (band.company_ids || []).map(String),
          lines: (band.lines?.length ? band.lines : [EMPTY_LINE()]).map((l) => ({
            _key: l.id ?? Date.now() + Math.random(),
            id: l.id,
            name: l.name || "",
            color: l.color || "#f97316",
            min_percentage: l.min_percentage ?? 0,
            max_percentage: l.max_percentage ?? 0,
          })),
          _deleted_line_ids: [],
        }
      : { ...EMPTY_BAND, lines: [EMPTY_LINE()], _deleted_line_ids: [] }
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setLine = (idx, field, value) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)) }));

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, EMPTY_LINE()] }));

  const removeLine = (idx) =>
    setForm((f) => {
      if (f.lines.length <= 1) return f;
      const removed = f.lines[idx];
      const remaining = f.lines.filter((_, i) => i !== idx);
      if (removed.id) {
        return { ...f, lines: remaining, _deleted_line_ids: [...(f._deleted_line_ids || []), removed.id] };
      }
      return { ...f, lines: remaining };
    });

  const toggleCompany = (id) =>
    setForm((f) => {
      const idStr = String(id);
      const exists = f.company_ids.includes(idStr);
      return { ...f, company_ids: exists ? f.company_ids.filter((c) => c !== idStr) : [...f.company_ids, idStr] };
    });

  const handleSave = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError("لازم تدخلي اسم الشريحة");
      return;
    }
    if (!form.is_global && form.company_ids.length === 0) {
      setError("لازم تختاري شركة واحدة على الأقل، أو تفعّلي (سياسة عالمية)");
      return;
    }
    try {
      setSaving(true);
      const payload = buildBandPayload(form);
      const saved = isEdit ? await updateNitaqatBand(band.id, payload) : await createNitaqatBand(payload);
      toast({ title: "تم حفظ الشريحة بنجاح" });
      onSaved(saved);
    } catch (err) {
      console.error("خطأ أثناء حفظ الشريحة:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ الشريحة"));
      toast({ title: "تعذّر حفظ الشريحة", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-gray-50 min-h-full" dir="rtl">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" /> رجوع
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ
          </button>
        </div>
        <span className="text-sm text-gray-800 font-bold">{isEdit ? band.name : "شريحة جديدة"}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 border-b border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="max-w-xl">
            <label className="text-xs font-semibold text-gray-400 mb-1.5 block">* اسم الشريحة</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="مثال: سياسة نطاقات 2026"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_global}
              onChange={(e) => set("is_global", e.target.checked)}
              className="w-4 h-4 accent-orange-500"
            />
            سياسة عالمية (لكل الشركات)
          </label>

          {!form.is_global && (
            <div>
              <label className="text-xs font-semibold text-gray-400 mb-1.5 block">الشركات المشمولة</label>
              {companies.length === 0 ? (
                <p className="text-xs text-gray-400">لا توجد شركات متاحة</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {companies.map((c) => {
                    const checked = form.company_ids.includes(String(c.id));
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                          checked ? "bg-orange-50 border-orange-300 text-orange-700" : "bg-white border-gray-200 text-gray-600"
                        }`}
                      >
                        <input type="checkbox" checked={checked} onChange={() => toggleCompany(c.id)} className="w-3.5 h-3.5 accent-orange-500" />
                        {c.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-700">النطاقات اللونية (Color Bands)</p>
            <button onClick={addLine} className="flex items-center gap-1 text-xs text-orange-600 font-semibold hover:underline">
              <Plus className="w-3.5 h-3.5" /> إضافة نطاق
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-x-auto">
            <table className="w-full text-xs min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-500">اسم اللون</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-500">اللون</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-500">أقل نسبة سعودة</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-gray-500">أعلى نسبة سعودة</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {form.lines.map((l, i) => (
                  <tr key={l._key ?? i} className="border-b border-gray-100 last:border-0">
                    <td className="px-3 py-2.5">
                      <input
                        value={l.name}
                        onChange={(e) => setLine(i, "name", e.target.value)}
                        placeholder="مثال: النطاق الأصفر"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white min-w-[160px]"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="color"
                        value={l.color}
                        onChange={(e) => setLine(i, "color", e.target.value)}
                        className="w-10 h-8 border border-gray-200 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={l.min_percentage}
                        onChange={(e) => setLine(i, "min_percentage", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        step="0.01"
                        value={l.max_percentage}
                        onChange={(e) => setLine(i, "max_percentage", e.target.value)}
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white"
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => removeLine(i)}
                        disabled={form.lines.length <= 1}
                        className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   تبويب: الشرائح (List)
   ──────────────────────────────────────────────────────────────────── */

function NitaqatBandsTab() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [bands, setBands] = useState([]);
  const [companies, setCompanies] = useState([]);
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
      const [bandsRes, companiesRes] = await Promise.all([getNitaqatBands(), getCompanies()]);
      setBands(bandsRes.data || []);
      setCompanies(companiesRes || []);
    } catch (err) {
      console.error("خطأ أثناء تحميل شرائح نطاقات:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل شرائح نطاقات"));
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
      setSelected(await getNitaqatBand(id));
    } catch (err) {
      console.error("خطأ أثناء جلب الشريحة:", err);
      toast({ title: "تعذّر فتح الشريحة", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: "حذف الشريحة",
      message: "متأكدة من حذف الشريحة دي؟",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteNitaqatBand(id);
      toast({ title: "تم حذف الشريحة" });
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف الشريحة:", err);
      toast({ title: "تعذّر حذف الشريحة", description: extractApiErrorMessage(err), variant: "destructive" });
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
    return <NitaqatBandForm band={selected} companies={companies} onBack={() => setSelected(null)} onSaved={handleSaved} />;
  }
  if (creating) {
    return <NitaqatBandForm band={null} companies={companies} onBack={() => setCreating(false)} onSaved={handleSaved} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          شريحة جديدة <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل الشرائح...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={load} className="underline mr-auto">إعادة المحاولة</button>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60">
                {["اسم الشريحة", "عدد النطاقات", "النطاق", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3.5 text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bands.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-gray-400">لا توجد شرائح بعد</td>
                </tr>
              ) : (
                bands.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => openEdit(b.id)}
                    className="border-b border-gray-100 last:border-0 hover:bg-orange-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-semibold text-gray-800">{b.name}</td>
                    <td className="px-4 py-3.5 text-gray-500">{b.lines?.length ?? 0}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(b.lines || []).slice(0, 4).map((l) => (
                          <span key={l.id} className="w-3.5 h-3.5 rounded-full border border-black/10" style={{ backgroundColor: l.color }} title={l.name} />
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => handleDelete(e, b.id)}
                          disabled={deletingId === b.id}
                          className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="حذف"
                        >
                          {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        {openingId === b.id ? (
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
   الصفحة الرئيسية — نطاقات (Nitaqat)
   ──────────────────────────────────────────────────────────────────── */

export default function NitaqatPage() {
  const [tab, setTab] = useState("status");

  return (
    <div className="p-6 space-y-5 w-full bg-gray-50 min-h-full" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          نطاقات (Nitaqat)
          <Gauge className="w-5 h-5 text-gray-400" />
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">متابعة نسبة السعودة، محاكاة القرارات، وإدارة شرائح النطاقات</p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-200 flex-wrap">
        {TOP_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "status" && <NitaqatStatusTab />}
      {tab === "simulate" && <NitaqatSimulateTab />}
      {tab === "bands" && <NitaqatBandsTab />}
    </div>
  );
}