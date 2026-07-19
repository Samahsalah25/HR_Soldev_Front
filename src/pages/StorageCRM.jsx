import { useState, useEffect, useCallback } from "react";
import { Plus, X, Search, Eye, User, Edit2, Building2, Loader2, Trophy, XCircle, Briefcase } from "lucide-react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
} from "@/api/storageCrmApi";
import {
  getStages,
  getOpportunities,
  createOpportunity,
  updateOpportunity,
  markOpportunityWon,
  getLostReasons,
  markOpportunityLost,
} from "@/api/crmOpportunitiesApi";

const STAGE_COLOR_PALETTE = [
  "bg-gray-100 text-gray-600",
  "bg-blue-100 text-blue-700",
  "bg-yellow-100 text-yellow-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-green-100 text-green-700",
];
const PRIORITY_LABELS = { "0": "عادي", "1": "متوسط", "2": "عالي", "3": "عاجل" };

// ترجمة أسامي المراحل للعرض فقط — القيمة الفعلية المرسلة للسيرفر تفضل stage_id زي ما هو
const STAGE_LABELS_AR = {
  "new": "جديد",
  "qualified": "مؤهل",
  "proposition": "عرض مقدم",
  "won": "تم الإغلاق",
};

function stageLabel(name) {
  if (!name) return name;
  return STAGE_LABELS_AR[name.toLowerCase()] || name;
}

function stageColor(stageId) {
  if (stageId == null) return "bg-gray-100 text-gray-600";
  const idx = Number(stageId) % STAGE_COLOR_PALETTE.length;
  return STAGE_COLOR_PALETTE[idx];
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
    </div>
  );
}

// ─── CustomerForm ─────────────────────────────────────────────────────────────
function CustomerForm({ customer, onSave, onClose }) {
  const blank = {
    name: "", company_type: "person",
    email: "", phone: "", mobile: "",
    website: "", street: "", street2: "",
    city: "", zip: "", vat: "",
    job_title: "", comment: "",
    active: true,
  };

  const [form, setForm] = useState(() => {
    if (!customer) return blank;
    return {
      ...blank,
      ...customer,
      name: customer.name || customer.full_name || "",
      company_type: customer.is_company ? "company" : (customer.company_type || "person"),
      mobile: customer.mobile || "",
      phone: customer.phone || "",
      job_title: customer.job_title || customer.function || "",
      comment: customer.comment || customer.notes || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isCompany = form.company_type === "company";

  const handleSave = async () => {
    if (!form.name) { setError("الاسم مطلوب"); return; }
    setSaving(true); setError("");
    try {
      if (customer?.id) await updateCustomer(customer.id, form);
      else await createCustomer(form);
      onSave();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold">{customer ? "تعديل عميل" : "إضافة عميل جديد"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* company_type: person | company */}
          <div className="flex gap-2">
            {[["person", "👤 فرد"], ["company", "🏢 شركة"]].map(([val, label]) => (
              <button key={val} type="button" onClick={() => set("company_type", val)}
                className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all
                  ${form.company_type === val
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* name */}
          <Field label={isCompany ? "اسم الشركة *" : "الاسم الكامل *"}
            value={form.name} onChange={v => set("name", v)} />

          {/* تواصل */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="الجوال (mobile)" value={form.mobile} onChange={v => set("mobile", v)} />
            <Field label="الهاتف (phone)" value={form.phone} onChange={v => set("phone", v)} />
            <div className="col-span-2">
              <Field label="البريد الإلكتروني" type="email" value={form.email} onChange={v => set("email", v)} />
            </div>
            {isCompany && (
              <div className="col-span-2">
                <Field label="الموقع الإلكتروني (website)"
                  value={form.website} onChange={v => set("website", v)} placeholder="https://example.com" />
              </div>
            )}
          </div>

          {/* عنوان */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Field label="العنوان (street)" value={form.street} onChange={v => set("street", v)} />
            </div>
            <div className="col-span-2">
              <Field label="العنوان 2 (street2)" value={form.street2} onChange={v => set("street2", v)} />
            </div>
            <Field label="المدينة (city)" value={form.city} onChange={v => set("city", v)} />
            <Field label="الرمز البريدي (zip)" value={form.zip} onChange={v => set("zip", v)} />
          </div>

          {/* حقول إضافية */}
          <div className="grid grid-cols-2 gap-3">
            {isCompany ? (
              <div className="col-span-2">
                <Field label="الرقم الضريبي (vat)" value={form.vat} onChange={v => set("vat", v)} />
              </div>
            ) : (
              <div className="col-span-2">
                <Field label="المسمى الوظيفي (function)"
                  value={form.job_title} onChange={v => set("job_title", v)}
                  placeholder="Software Engineer" />
              </div>
            )}

            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">ملاحظات (comment)</label>
              <textarea value={form.comment} onChange={e => set("comment", e.target.value)} rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />حفظ...</> : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OpportunityForm ──────────────────────────────────────────────────────────
function OpportunityForm({ opportunity, customers, stages, defaultPartnerId, onSave, onClose }) {
  const blank = {
    name: "", partner_id: defaultPartnerId || "", stage_id: "",
    expected_revenue: "", probability: "", priority: "1",
    date_deadline: "", email_from: "", phone: "", description: "",
  };

  const [form, setForm] = useState(() => {
    if (!opportunity) return blank;
    return {
      ...blank,
      ...opportunity,
      partner_id: opportunity.partner_id ?? "",
      stage_id: opportunity.stage_id ?? "",
      expected_revenue: opportunity.expected_revenue ?? "",
      probability: opportunity.probability ?? "",
      priority: String(opportunity.priority ?? "1"),
      date_deadline: opportunity.date_deadline || "",
      email_from: opportunity.email_from || "",
      description: opportunity.description || "",
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name) { setError("اسم الفرصة مطلوب"); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        name: form.name,
        description: form.description || "",
      };
      if (form.partner_id) payload.partner_id = Number(form.partner_id);
      if (form.stage_id) payload.stage_id = Number(form.stage_id);
      if (form.expected_revenue !== "") payload.expected_revenue = Number(form.expected_revenue);
      if (form.probability !== "") payload.probability = Number(form.probability);
      if (form.priority) payload.priority = form.priority;
      if (form.date_deadline) payload.date_deadline = form.date_deadline;
      if (form.email_from) payload.email_from = form.email_from;
      if (form.phone) payload.phone = form.phone;

      if (opportunity?.id) await updateOpportunity(opportunity.id, payload);
      else await createOpportunity(payload);
      onSave();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "حدث خطأ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold">{opportunity ? "تعديل فرصة" : "إضافة فرصة جديدة"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Field label="اسم الفرصة *" value={form.name} onChange={v => set("name", v)} />

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">العميل</label>
            <select value={form.partner_id} onChange={e => set("partner_id", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
              <option value="">— بدون عميل —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name || c.full_name}</option>
              ))}
            </select>
          </div>

          {stages.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">المرحلة</label>
              <select value={form.stage_id} onChange={e => set("stage_id", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                <option value="">— افتراضي —</option>
                {stages.map(s => (
                  <option key={s.id} value={s.id}>{stageLabel(s.name)}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="القيمة المتوقعة (expected_revenue)" type="number"
              value={form.expected_revenue} onChange={v => set("expected_revenue", v)} />
            <Field label="نسبة النجاح % (probability)" type="number"
              value={form.probability} onChange={v => set("probability", v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">الأولوية</label>
              <select value={form.priority} onChange={e => set("priority", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                {Object.entries(PRIORITY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <Field label="تاريخ الإغلاق المتوقع" type="date"
              value={form.date_deadline} onChange={v => set("date_deadline", v)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="بريد التواصل (email_from)" type="email"
              value={form.email_from} onChange={v => set("email_from", v)} />
            <Field label="الهاتف" value={form.phone} onChange={v => set("phone", v)} />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">تفاصيل الفرصة</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />حفظ...</> : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LostReasonModal (أرشفة الفرصة كخسارة) ────────────────────────────────────
function LostReasonModal({ lostReasons, onConfirm, onClose }) {
  const [reasonId, setReasonId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!reasonId) { setError("اختر سبب الخسارة"); return; }
    setSaving(true); setError("");
    try {
      await onConfirm({ lost_reason_id: Number(reasonId), lost_feedback: feedback });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "حدث خطأ");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold">أرشفة الفرصة (خسارة)</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">سبب الخسارة *</label>
            <select value={reasonId} onChange={e => setReasonId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
              <option value="">— اختر —</option>
              {lostReasons.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">ملاحظات إضافية</label>
            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button>
          <button onClick={handleConfirm} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />جاري...</> : "تأكيد الخسارة والأرشفة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CustomerDetailModal ──────────────────────────────────────────────────────
function CustomerDetailModal({ customer, opportunities, onAddOpportunity, onClose }) {
  const related = opportunities.filter(o => String(o.partner_id) === String(customer.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              {customer.is_company
                ? <Building2 className="w-5 h-5 text-white" />
                : <User className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{customer.name || customer.full_name}</h3>
              <p className="text-xs text-gray-400">{customer.customer_type}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
          {/* بيانات التواصل */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">بيانات التواصل</p>
            {customer.mobile && <InfoRow label="الجوال" value={customer.mobile} />}
            {customer.phone && <InfoRow label="الهاتف" value={customer.phone} />}
            {customer.email && <InfoRow label="البريد" value={customer.email} />}
            {customer.website && <InfoRow label="الموقع" value={customer.website} />}
            {customer.job_title && <InfoRow label="المسمى" value={customer.job_title} />}
            {customer.vat && <InfoRow label={customer.is_company ? "ضريبي" : "هوية"} value={customer.vat} />}
          </div>

          {/* العنوان */}
          {(customer.city || customer.street) && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">العنوان</p>
              {customer.street && <InfoRow label="الشارع" value={customer.street} />}
              {customer.street2 && <InfoRow label="" value={customer.street2} />}
              {customer.city && <InfoRow label="المدينة" value={`${customer.city}${customer.zip ? " - " + customer.zip : ""}`} />}
              {customer.country_name && <InfoRow label="الدولة" value={customer.country_name} />}
            </div>
          )}

          {/* ملاحظات */}
          {(customer.comment || customer.notes) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">ملاحظات</p>
              <p className="text-gray-700 text-sm leading-relaxed">{customer.comment || customer.notes}</p>
            </div>
          )}

          {/* جهات الاتصال الفرعية */}
          {customer.contacts?.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">جهات الاتصال ({customer.contacts.length})</p>
              <div className="space-y-2">
                {customer.contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium">{c.name}</span>
                    {c.email && <span className="text-gray-400">{c.email}</span>}
                    {c.mobile && <span className="text-gray-400">{c.mobile}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* الفرص المرتبطة */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-gray-400 uppercase">الفرص ({related.length})</p>
              <button onClick={onAddOpportunity}
                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                <Plus className="w-3.5 h-3.5" />إضافة فرصة
              </button>
            </div>
            {related.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد فرص لهذا العميل</p>
            ) : (
              <div className="space-y-2">
                {related.map(o => (
                  <div key={o.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{o.name}</p>
                      {o.expected_revenue != null && (
                        <p className="text-[11px] text-muted-foreground">{Number(o.expected_revenue).toLocaleString("ar-SA")} ر.س</p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${stageColor(o.stage_id)}`}>
                      {stageLabel(o.stage_name)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
      {label && <span className="text-gray-500 text-xs min-w-16">{label}</span>}
      <span className="font-medium text-gray-800 text-xs text-left">{value}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StorageCRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");   // "" | "person" | "company"
  const [view, setView] = useState("list");
  const [error, setError] = useState("");

  const [opportunities, setOpportunities] = useState([]);
  const [oppLoading, setOppLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [oppForm, setOppForm] = useState(null);           // null=closed, {}=create, {..}=edit
  const [oppDefaultPartnerId, setOppDefaultPartnerId] = useState(null);
  const [lostReasons, setLostReasons] = useState([]);
  const [lostFor, setLostFor] = useState(null);            // فرصة في انتظار اختيار سبب الخسارة

  // GET /customers
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = { limit: 100 };
      if (filterType) params.company_type = filterType;
      if (search) params.search = search;
      setLeads(await getCustomers(params));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "فشل تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [filterType, search]);

  // GET /crm/opportunities
  const loadOpportunities = useCallback(async () => {
    setOppLoading(true);
    try {
      setOpportunities(await getOpportunities({ limit: 200 }));
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "فشل تحميل الفرص");
    } finally {
      setOppLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadOpportunities(); }, [loadOpportunities]);
  useEffect(() => { getLostReasons().then(setLostReasons).catch(() => {}); }, []);
  useEffect(() => {
    getStages().then(list => {
      setStages([...list].sort((a, b) => (a.sequence ?? a.id) - (b.sequence ?? b.id)));
    }).catch(() => {});
  }, []);

  const handleMarkWon = async (opp) => {
    try {
      await markOpportunityWon(opp.id);
      loadOpportunities();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "فشل تسجيل الفرصة كمكسوبة");
    }
  };

  const handleLostConfirm = async ({ lost_reason_id, lost_feedback }) => {
    await markOpportunityLost(lostFor.id, { lost_reason_id, lost_feedback });
    setLostFor(null);
    loadOpportunities();
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />CRM — العملاء
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة قاعدة عملاء التخزين والفرص</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* فلتر النوع: person | company */}
          <div className="flex gap-1">
            {[["", "الكل"], ["person", "أفراد"], ["company", "شركات"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilterType(val)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors
                  ${filterType === val ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={() => setView(v => v === "list" ? "pipeline" : "list")}
            className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            {view === "list" ? "عرض Pipeline" : "عرض القائمة"}
          </button>
          <button onClick={() => { setOppDefaultPartnerId(null); setOppForm({}); }}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5">
            <Briefcase className="w-4 h-4" />إضافة فرصة
          </button>
          <button onClick={() => setForm({})}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />إضافة عميل
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      {/* Pipeline Stage Stats — عدادات فقط، مش فلتر (كل الفرص دايمًا ظاهرة في الكانبان تحت) */}
      {stages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {stages.map(s => (
            <div key={s.id} className="rounded-xl border p-3 text-center bg-card">
              <p className="text-xl font-bold">{opportunities.filter(o => o.stage_id === s.id).length}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${stageColor(s.id)}`}>{stageLabel(s.name)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد أو الجوال..."
          className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
      </div>

      {/* Pipeline View — الفرص (Opportunities) الحقيقية */}
      {view === "pipeline" ? (
        oppLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />جاري تحميل الفرص...
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">لا توجد فرص بعد — ابدأ بإضافة فرصة</div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-3">
            {stages.map(stage => {
              const items = opportunities.filter(o => o.stage_id === stage.id);
              return (
                <div key={stage.id} className="flex-shrink-0 w-64 bg-muted/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor(stage.id)}`}>{stageLabel(stage.name)}</span>
                    <span className="text-xs text-muted-foreground font-medium">{items.length}</span>
                  </div>
                  {items.map(o => (
                    <div key={o.id}
                      className="bg-card rounded-xl border border-border p-3 space-y-2 hover:shadow-sm transition-shadow">
                      <div onClick={() => { setOppDefaultPartnerId(null); setOppForm(o); }} className="cursor-pointer">
                        <p className="font-semibold text-sm text-foreground">{o.name}</p>
                        {o.partner_name && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <User className="w-3 h-3" />{o.partner_name}
                          </p>
                        )}
                        {o.expected_revenue != null && (
                          <p className="text-xs text-primary mt-1">{Number(o.expected_revenue).toLocaleString("ar-SA")} ر.س</p>
                        )}
                      </div>
                      {!stage.is_won && (
                        <div className="flex gap-1 pt-1 border-t border-gray-100">
                          <button onClick={() => handleMarkWon(o)}
                            className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1 rounded-lg text-green-700 bg-green-50 hover:bg-green-100">
                            <Trophy className="w-3 h-3" />فوز
                          </button>
                          <button onClick={() => setLostFor(o)}
                            className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1 rounded-lg text-red-700 bg-red-50 hover:bg-red-100">
                            <XCircle className="w-3 h-3" />خسارة
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* List View — عملاء */
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الاسم", "النوع", "الجوال", "البريد", "المسمى / ضريبي", ""].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...
                  </div>
                </td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">لا يوجد عملاء</td></tr>
              ) : leads.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                        ${l.is_company ? "bg-blue-100" : "bg-primary/10"}`}>
                        {l.is_company
                          ? <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          : <User className="w-3.5 h-3.5 text-primary" />}
                      </div>
                      <span className="font-medium text-foreground">{l.name || l.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${l.is_company ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                      {l.customer_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{l.mobile || l.phone || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{l.email || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.job_title || l.vat || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setSelected(l)} className="p-1.5 hover:bg-muted rounded">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => setForm(l)} className="p-1.5 hover:bg-muted rounded">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form !== null && (
        <CustomerForm
          customer={form?.id ? form : null}
          onSave={() => { setForm(null); load(); }}
          onClose={() => setForm(null)}
        />
      )}
      {selected && (
        <CustomerDetailModal
          customer={selected}
          opportunities={opportunities}
          onAddOpportunity={() => { setOppDefaultPartnerId(selected.id); setOppForm({}); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}
      {oppForm !== null && (
        <OpportunityForm
          opportunity={oppForm?.id ? oppForm : null}
          customers={leads}
          stages={stages}
          defaultPartnerId={oppDefaultPartnerId}
          onSave={() => { setOppForm(null); loadOpportunities(); }}
          onClose={() => setOppForm(null)}
        />
      )}
      {lostFor && (
        <LostReasonModal
          lostReasons={lostReasons}
          onConfirm={handleLostConfirm}
          onClose={() => setLostFor(null)}
        />
      )}
    </div>
  );
}
