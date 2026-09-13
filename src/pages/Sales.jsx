import { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  X,
  Save,
  Trash2,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Ban,
  Clock,
  Lock,
} from "lucide-react";
import {
  getCustomers,
  getSaleProducts,
  getProjects,
  getSales,
  getSale,
  createSale,
  deleteSale,
  confirmSale,
  cancelSale,
  createInvoiceFromSale,
} from "../api/SalesApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

/* ────────────────────────────────────────────────────────────────────────
   ثوابت
   ──────────────────────────────────────────────────────────────────── */

const STATE_META = {
  draft: { label: "عرض سعر (مسودة)", badge: "bg-muted text-muted-foreground", icon: Clock },
  sent: { label: "تم الإرسال للعميل", badge: "bg-blue-100 text-blue-700", icon: Clock },
  sale: { label: "أمر بيع مؤكد", badge: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  done: { label: "مقفل", badge: "bg-emerald-100 text-emerald-700", icon: Lock },
  cancel: { label: "ملغي", badge: "bg-red-100 text-red-600", icon: Ban },
};

function stateMeta(state) {
  return STATE_META[state] || { label: state || "—", badge: "bg-muted text-muted-foreground", icon: Clock };
}

// ⚠️ الباك اند حاليًا مش راجع لينا حقل صريح زي invoice_status يقولنا هل
// اتعملت لطلب البيع فاتورة قبل كده ولا لأ، فبنعتمد على أي حقل محتمل يرجع
// من الباك اند (لو اتضاف لاحقًا) + على حالة العملية اللي حصلت فعلاً في
// الجلسة الحالية (invoiceCreated) عشان الأزرار تتحدث فورًا بعد "إنشاء فاتورة".
function isInvoiced(s) {
  if (!s) return false;
  if (s.invoice_status === "invoiced") return true;
  if (s.invoiced === true) return true;
  if (Array.isArray(s.invoice_ids) && s.invoice_ids.length > 0) return true;
  if (s.state === "done") return true;
  return false;
}

const EMPTY_ANALYTIC = () => ({ _key: Date.now() + Math.random(), project_id: "", percentage: 100 });

const EMPTY_LINE = () => ({
  _key: Date.now() + Math.random(),
  product_id: "",
  product_name: "",
  quantity: 1,
  override_price: false,
  price_unit: 0,
  saved_price_unit: null,
  analytics: [EMPTY_ANALYTIC()],
});

const EMPTY_SALE = {
  partner_id: "",
  client_order_ref: "",
  date_order: "",
  project_id: "",
  lines: [EMPTY_LINE()],
};

/* ────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

function toDateInput(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

/**
 * بناء analytic_distribution النهائي اللي بيتبعت للباك اند.
 * ⚠️ الـ key هنا لازم يكون analytic_account_id بتاع المشروع، مش الـ id بتاعه.
 */
function buildAnalyticDistribution(analytics, projects) {
  const dist = {};
  (analytics || []).forEach((a) => {
    if (!a.project_id) return;
    const project = projects.find((p) => String(p.id) === String(a.project_id));
    if (!project) return;
    const key = String(project.analytic_account_id);
    dist[key] = (dist[key] || 0) + (Number(a.percentage) || 0);
  });
  return dist;
}

function buildPayload(form, projects) {
  const lines = form.lines.map((l) => {
    const line = {
      product_id: Number(l.product_id),
      quantity: Number(l.quantity) || 0,
      analytic_distribution: buildAnalyticDistribution(l.analytics, projects),
    };
    if (l.override_price) line.price_unit = Number(l.price_unit) || 0;
    return line;
  });

  const payload = {
    partner_id: Number(form.partner_id),
    client_order_ref: form.client_order_ref?.trim() || "",
    date_order: form.date_order,
    lines,
  };

  if (form.project_id) payload.project_id = Number(form.project_id);

  return payload;
}

/**
 * سعر ووحدة وإجمالي السطر اللي هيتعرضوا للمستخدم.
 * ترتيب الأولوية:
 * 1) لو "تخصيص السعر يدويًا" مفعّل → السعر اللي المستخدم كاتبه بنفسه.
 * 2) لو السطر محفوظ فعلاً على الباك اند (له saved_price_unit) → نفس السعر
 *    المحفوظ بالظبط (من GET by one)، عشان الأرقام تطابق الحقيقة دايمًا.
 * 3) لو سطر جديد لسه مش متحفوظ → سعر بيع المنتج (list_price) كتقدير مبدئي.
 */
function linePreview(line, products) {
  const product = products.find((p) => String(p.id) === String(line.product_id));
  let unitPrice;
  if (line.override_price) {
    unitPrice = Number(line.price_unit) || 0;
  } else if (line.saved_price_unit !== null && line.saved_price_unit !== undefined) {
    unitPrice = Number(line.saved_price_unit) || 0;
  } else {
    unitPrice = Number(product?.list_price) || 0;
  }
  const amount = unitPrice * (Number(line.quantity) || 0);
  return { product, unitPrice, amount };
}

/* ────────────────────────────────────────────────────────────────────────
   مكوّن: شارة الحالة
   ──────────────────────────────────────────────────────────────────── */

function StateBadge({ state }) {
  const meta = stateMeta(state);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${meta.badge}`}>
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   محرر التوزيع التحليلي لسطر واحد
   ──────────────────────────────────────────────────────────────────── */

function AnalyticDistributionEditor({ analytics, projects, onChange, disabled }) {
  const total = analytics.reduce((s, a) => s + (Number(a.percentage) || 0), 0);

  const setRow = (idx, field, value) =>
    onChange(analytics.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));

  const addRow = () => onChange([...analytics, EMPTY_ANALYTIC()]);

  const removeRow = (idx) => {
    if (analytics.length <= 1) return;
    onChange(analytics.filter((_, i) => i !== idx));
  };

  return (
    <div className="bg-card border border-border rounded-xl p-2.5 space-y-1.5 min-w-[230px] shadow-sm">
      {analytics.map((a, i) => (
        <div key={a._key ?? i} className="flex items-center gap-1">
          <select
            value={a.project_id}
            onChange={(e) => setRow(i, "project_id", e.target.value)}
            disabled={disabled}
            className="flex-1 px-1.5 py-1 text-xs border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            <option value="">اختر مشروع</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={a.percentage}
            onChange={(e) => setRow(i, "percentage", e.target.value)}
            disabled={disabled}
            className="w-14 px-1.5 py-1 text-xs border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <span className="text-xs text-muted-foreground">%</span>
          <button
            onClick={() => removeRow(i)}
            disabled={analytics.length <= 1 || disabled}
            className="p-1 text-red-400 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      {!disabled && (
        <button onClick={addRow} className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
          <Plus className="w-3 h-3" /> إضافة سطر
        </button>
      )}
      {total !== 100 && (
        <p className="text-[11px] text-amber-600 font-medium">الإجمالي {total}% (المفروض 100%)</p>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   صفحة إنشاء / عرض طلب بيع
   ──────────────────────────────────────────────────────────────────── */

function SaleForm({ sale, customers, products, projects, onBack, onSaved }) {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const isEdit = Boolean(sale?.id);

  const [form, setForm] = useState(() =>
    isEdit
      ? {
          partner_id: sale.partner_id ?? "",
          client_order_ref: sale.client_order_ref || "",
          date_order: toDateInput(sale.date_order),
          project_id: sale.project_id || "",
          lines: (sale.lines?.length ? sale.lines : [EMPTY_LINE()]).map((l) => {
            const analytics = Object.entries(l.analytic_distribution || {}).map(([accId, pct]) => {
              const project = projects.find((p) => String(p.analytic_account_id) === String(accId));
              return { _key: Date.now() + Math.random(), project_id: project ? project.id : "", percentage: pct };
            });
            return {
              _key: l.id ?? Date.now() + Math.random(),
              id: l.id,
              product_id: l.product_id ?? "",
              // ⚠️ بنحتفظ باسم المنتج الجاي من الطلب نفسه كـ fallback،
              // عشان لو المنتج ده مش موجود في قايمة المنتجات اللي بتتجاب
              // للدروب داون، الاختيار يفضل ظاهر بدل ما يبان فاضي.
              product_name: l.product_name || "",
              quantity: l.quantity ?? 1,
              override_price: false,
              price_unit: l.price_unit ?? 0,
              // ⚠️ ده السعر الحقيقي المحفوظ فعلاً على الباك اند (من GET by
              // one). المعاينة والإجمالي لازم يعتمدوا عليه هو، مش على سعر
              // المنتج الحالي، عشان الأرقام تفضل مطابقة للمحفوظ فعلاً.
              saved_price_unit: l.price_unit ?? 0,
              analytics: analytics.length ? analytics : [EMPTY_ANALYTIC()],
            };
          }),
        }
      : { ...EMPTY_SALE, lines: [EMPTY_LINE()] }
  );

  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // confirm | cancel | invoice | delete
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(sale);
  const [invoiceCreated, setInvoiceCreated] = useState(() => isInvoiced(sale));

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setLine = (idx, field, value) =>
    setForm((f) => ({ ...f, lines: f.lines.map((l, i) => (i === idx ? { ...l, [field]: value } : l)) }));

  // لما المنتج نفسه يتغيّر، أي سعر محفوظ قديم بيخص المنتج القديم بقى
  // مالوش معنى، فبنمسحه عشان المعاينة تحسب تاني من سعر بيع المنتج الجديد.
  const handleProductChange = (idx, value) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => (i === idx ? { ...l, product_id: value, saved_price_unit: null } : l)),
    }));

  // لما "تخصيص السعر يدويًا" يتفعّل، بنبدأ بنفس القيمة المعروضة حاليًا
  // بدل ما تتصفّر، عشان المستخدم يعدّل منها لا يبدأ من صفر.
  const toggleOverridePrice = (idx, checked) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => {
        if (i !== idx) return l;
        if (checked) {
          const { unitPrice } = linePreview(l, products);
          return { ...l, override_price: true, price_unit: unitPrice };
        }
        return { ...l, override_price: false };
      }),
    }));

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, EMPTY_LINE()] }));

  const removeLine = (idx) =>
    setForm((f) => {
      if (f.lines.length <= 1) return f;
      return { ...f, lines: f.lines.filter((_, i) => i !== idx) };
    });

  // خيارات الدروب داون لكل سطر: القايمة العامة + خيار احتياطي بالاسم
  // الحقيقي لو المنتج مش موجود في القايمة العامة
  const optionsForLine = (line) => {
    const found = products.some((p) => String(p.id) === String(line.product_id));
    if (found || !line.product_id) return products;
    return [...products, { id: line.product_id, name: line.product_name || `منتج #${line.product_id}` }];
  };

  const totalPreview = form.lines.reduce((sum, l) => sum + linePreview(l, products).amount, 0);

  const currentState = current?.state || "draft";
  const isCancelled = currentState === "cancel";
  const isConfirmed = currentState === "sale" || currentState === "done";
  const invoiced = invoiceCreated || isInvoiced(current);

  // ⚠️ مفيش endpoint تعديل لطلب بيع محفوظ، فأي طلب اتفتح من القايمة
  // (isEdit) بيتعرض للقراءة بس، والتعديل الوحيد المسموح بيه هو وأنت
  // بتنشئي طلب جديد لسه مامتحفظش.
  const readOnly = isEdit;

  const handleSave = async () => {
    setError(null);
    if (!form.partner_id) {
      setError("لازم تختاري العميل");
      return;
    }
    if (form.lines.some((l) => !l.product_id)) {
      setError("كل سطر لازم يكون فيه منتج مختار");
      return;
    }
    try {
      setSaving(true);
      const payload = buildPayload(form, projects);
      const saved = await createSale(payload);
      toast({ title: "تم إنشاء طلب البيع بنجاح" });
      onSaved(saved);
    } catch (err) {
      console.error("خطأ أثناء حفظ طلب البيع:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ طلب البيع"));
      toast({ title: "تعذّر حفظ طلب البيع", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const refreshCurrent = async () => {
    if (!current?.id) return;
    try {
      setCurrent(await getSale(current.id));
    } catch (err) {
      console.error("تعذّر تحديث بيانات الطلب:", err);
    }
  };

  const handleConfirm = async () => {
    if (!current?.id) return;
    try {
      setActionLoading("confirm");
      await confirmSale(current.id);
      toast({ title: "تم تأكيد طلب البيع" });
      await refreshCurrent();
    } catch (err) {
      console.error("خطأ أثناء تأكيد طلب البيع:", err);
      toast({ title: "تعذّر تأكيد الطلب", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!current?.id) return;
    const ok = await confirmDialog({
      title: "إلغاء طلب البيع",
      message: "متأكدة من إلغاء طلب البيع ده بالكامل؟",
      confirmText: "إلغاء الطلب",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setActionLoading("cancel");
      await cancelSale(current.id);
      toast({ title: "تم إلغاء طلب البيع" });
      await refreshCurrent();
    } catch (err) {
      console.error("خطأ أثناء إلغاء طلب البيع:", err);
      toast({ title: "تعذّر إلغاء الطلب", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateInvoice = async () => {
    if (!current?.id) return;
    try {
      setActionLoading("invoice");
      await createInvoiceFromSale(current.id);
      // بمجرد نجاح الإنشاء، نقفل الأزرار على الفاتورة فورًا (حتى لو الباك
      // اند لسه مارجعش حقل صريح يقول كده).
      setInvoiceCreated(true);
      toast({ title: "تم إنشاء فاتورة العميل" });
      await refreshCurrent();
    } catch (err) {
      console.error("خطأ أثناء إنشاء الفاتورة:", err);
      toast({ title: "تعذّر إنشاء الفاتورة", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteInForm = async () => {
    if (!current?.id) return;
    const ok = await confirmDialog({
      title: "حذف طلب البيع",
      message: "متأكدة من حذف طلب البيع ده نهائيًا؟",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setActionLoading("delete");
      await deleteSale(current.id);
      toast({ title: "تم حذف طلب البيع" });
      onSaved();
    } catch (err) {
      console.error("خطأ أثناء حذف طلب البيع:", err);
      toast({ title: "تعذّر حذف طلب البيع", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full bg-background min-h-full" dir="rtl">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-card border-b border-border shadow-sm flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onBack}
            title="رجوع"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" /> رجوع
          </button>

          {!isEdit && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ
            </button>
          )}

          {isEdit && !isConfirmed && !isCancelled && (
            <button
              onClick={handleConfirm}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
            >
              {actionLoading === "confirm" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} تأكيد الطلب
            </button>
          )}

          {isEdit && isConfirmed && !invoiced && (
            <button
              onClick={handleCreateInvoice}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm disabled:opacity-40 transition-colors"
            >
              {actionLoading === "invoice" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} إنشاء فاتورة
            </button>
          )}

          {/* الإلغاء متاح لحد ما يتعمل فاتورة أو يتلغي بالفعل */}
          {isEdit && !isCancelled && !invoiced && (
            <button
              onClick={handleCancel}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
            >
              {actionLoading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} إلغاء الطلب
            </button>
          )}

          {/* الحذف متاح فقط بعد ما الطلب يتلغي أو تتعمله فاتورة، زي المشتريات بالظبط */}
          {isEdit && (invoiced || isCancelled) && (
            <button
              onClick={handleDeleteInForm}
              disabled={actionLoading !== null}
              className="flex items-center gap-1.5 px-4 py-2 border border-border text-muted-foreground hover:bg-muted hover:text-red-600 rounded-xl text-sm font-semibold disabled:opacity-40 transition-colors"
            >
              {actionLoading === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} حذف
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <StateBadge state={currentState} />
          <span className="text-sm text-foreground font-bold">{isEdit ? current?.name : "طلب جديد"}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2.5 border-b border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* بيانات الهيدر */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">* العميل</label>
              <select
                value={form.partner_id}
                onChange={(e) => set("partner_id", e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60 transition-colors"
              >
                <option value="">اختر العميل</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">مرجع طلب العميل</label>
              <input
                value={form.client_order_ref}
                onChange={(e) => set("client_order_ref", e.target.value)}
                disabled={readOnly}
                placeholder="مثال: PO-9921"
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">تاريخ الطلب</label>
              <input
                type="date"
                value={form.date_order}
                onChange={(e) => set("date_order", e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المشروع (اختياري)</label>
              <select
                value={form.project_id}
                onChange={(e) => set("project_id", e.target.value)}
                disabled={readOnly}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60 transition-colors"
              >
                <option value="">بدون مشروع</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* سطور المنتجات */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-foreground">المنتجات</p>
          </div>

          <div className="border border-border rounded-xl overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">المنتج</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">التوزيع التحليلي</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">الكمية</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">الوحدة</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">سعر الوحدة</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">الإجمالي</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {form.lines.map((l, i) => {
                  const { product, unitPrice, amount } = linePreview(l, products);
                  return (
                    <tr key={l._key ?? i} className="border-b border-border/60 last:border-0 align-top hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-3 min-w-[170px]">
                        <select
                          value={l.product_id}
                          onChange={(e) => handleProductChange(i, e.target.value)}
                          disabled={readOnly}
                          className="w-full px-2 py-2 border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60"
                        >
                          <option value="">اختر منتج</option>
                          {optionsForLine(l).map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        <AnalyticDistributionEditor
                          analytics={l.analytics}
                          projects={projects}
                          onChange={(v) => setLine(i, "analytics", v)}
                          disabled={readOnly}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <input
                          type="number"
                          value={l.quantity}
                          onChange={(e) => setLine(i, "quantity", e.target.value)}
                          disabled={readOnly}
                          className="w-16 px-2 py-2 border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60"
                        />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{product?.uom_name || "—"}</td>
                      <td className="px-3 py-3">
                        <div className="space-y-1.5">
                          <input
                            type="number"
                            value={l.override_price ? l.price_unit : unitPrice}
                            disabled={!l.override_price || readOnly}
                            onChange={(e) => setLine(i, "price_unit", e.target.value)}
                            className="w-20 px-2 py-2 border border-border rounded-lg bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60 disabled:text-muted-foreground"
                          />
                          {!readOnly && (
                            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={l.override_price}
                                onChange={(e) => toggleOverridePrice(i, e.target.checked)}
                                className="w-3 h-3 accent-primary"
                              />
                              تخصيص السعر يدويًا
                            </label>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 font-bold text-foreground whitespace-nowrap">{amount.toFixed(2)}</td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => removeLine(i)}
                          disabled={form.lines.length <= 1 || readOnly}
                          className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg disabled:opacity-30 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!readOnly && (
              <button onClick={addLine} className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline px-4 py-3">
                <Plus className="w-3.5 h-3.5" /> إضافة سطر
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            * السطور المحفوظة فعليًا بتعرض نفس السعر والإجمالي المسجّل على الباك اند بالظبط. السطور الجديدة اللي لسه متحفظتش بيتعرض لها بس سعر بيع تقديري من بيانات المنتج، وده بيتثبّت فعليًا بعد الحفظ.
          </p>
        </div>

        {/* الإجمالي */}
        <div className="max-w-sm mr-auto bg-card border border-border rounded-2xl shadow-sm p-5 space-y-2 text-sm">
          {isEdit && current ? (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الإجمالي قبل الضريبة</span>
                <span className="font-semibold text-foreground">{Number(current.amount_untaxed).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الضريبة</span>
                <span className="font-semibold text-foreground">{Number(current.amount_tax).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2.5">
                <span className="text-foreground font-bold">الإجمالي</span>
                <span className="font-extrabold text-primary text-base">{Number(current.amount_total).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الإجمالي (تقريبي)</span>
              <span className="font-semibold text-foreground">{totalPreview.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية — المبيعات
   ──────────────────────────────────────────────────────────────────── */

export default function Sales() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [projects, setProjects] = useState([]);

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
      const [salesRes, customersRes, productsRes, projectsRes] = await Promise.all([
        getSales(),
        getCustomers(),
        getSaleProducts(),
        getProjects(),
      ]);
      setSales(salesRes.data || []);
      setCustomers(customersRes || []);
      setProducts(productsRes || []);
      setProjects(projectsRes || []);
    } catch (err) {
      console.error("خطأ أثناء تحميل بيانات المبيعات:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل بيانات المبيعات"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openView = async (id) => {
    try {
      setOpeningId(id);
      setSelected(await getSale(id));
    } catch (err) {
      console.error("خطأ أثناء جلب طلب البيع:", err);
      toast({ title: "تعذّر فتح طلب البيع", description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setOpeningId(null);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await confirmDialog({
      title: "حذف طلب البيع",
      message: "متأكدة من حذف طلب البيع ده؟",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      setDeletingId(id);
      await deleteSale(id);
      toast({ title: "تم حذف طلب البيع" });
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف طلب البيع:", err);
      toast({ title: "تعذّر حذف طلب البيع", description: extractApiErrorMessage(err), variant: "destructive" });
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
    return (
      <SaleForm
        sale={selected}
        customers={customers}
        products={products}
        projects={projects}
        onBack={() => setSelected(null)}
        onSaved={handleSaved}
      />
    );
  }
  if (creating) {
    return (
      <SaleForm
        sale={null}
        customers={customers}
        products={products}
        projects={projects}
        onBack={() => setCreating(false)}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div className="p-6 space-y-6 w-full bg-background min-h-full" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            المبيعات
            <ShoppingBag className="w-5 h-5 text-muted-foreground" />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">عروض الأسعار وأوامر البيع</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          طلب بيع جديد <Plus className="w-4 h-4" />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل المبيعات...
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
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["المرجع", "العميل", "الحالة", "الإجمالي", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">لا توجد طلبات بيع بعد</td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => openView(s.id)}
                    className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5 font-semibold text-foreground">{s.name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{s.partner_id}</td>
                    <td className="px-4 py-3.5"><StateBadge state={s.state} /></td>
                    <td className="px-4 py-3.5 text-foreground font-bold">{Number(s.amount_total).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-left">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={(e) => handleDelete(e, s.id)}
                          disabled={deletingId === s.id}
                          className="text-muted-foreground/50 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="حذف"
                        >
                          {deletingId === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                        {openingId === s.id ? (
                          <Loader2 className="w-4 h-4 text-muted-foreground/50 animate-spin" />
                        ) : (
                          <ChevronLeft className="w-4 h-4 text-muted-foreground/50" />
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