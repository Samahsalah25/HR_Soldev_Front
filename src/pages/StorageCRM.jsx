import { useState, useEffect, useCallback } from "react";
import { Plus, X, Search, Phone, Mail, Eye, User, Edit2, Building2, Loader2 } from "lucide-react";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
} from "@/api/storageCrmApi";

const PIPELINE_STAGES = ["جديد", "تواصل أولي", "في المفاوضة", "عرض مقدم", "محتمل إغلاق", "تم الإغلاق", "خسارة"];
const STAGE_COLORS = {
  "جديد": "bg-gray-100 text-gray-600",
  "تواصل أولي": "bg-blue-100 text-blue-700",
  "في المفاوضة": "bg-yellow-100 text-yellow-700",
  "عرض مقدم": "bg-purple-100 text-purple-700",
  "محتمل إغلاق": "bg-orange-100 text-orange-700",
  "تم الإغلاق": "bg-green-100 text-green-700",
  "خسارة": "bg-red-100 text-red-600",
};

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
    pipeline_stage: "جديد", interested_in: "",
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

            {/* Pipeline — local only */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">مرحلة Pipeline</label>
              <select value={form.pipeline_stage || "جديد"} onChange={e => set("pipeline_stage", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <Field label="الوحدة المهتم بها"
              value={form.interested_in} onChange={v => set("interested_in", v)}
              placeholder="وحدة مكيفة في الرياض" />

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

// ─── CustomerDetailModal ──────────────────────────────────────────────────────
function CustomerDetailModal({ customer, onClose }) {
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

          {/* Pipeline */}
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Pipeline</p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[customer.pipeline_stage || "جديد"] || "bg-gray-100 text-gray-600"}`}>
              {customer.pipeline_stage || "جديد"}
            </span>
            {customer.interested_in && (
              <p className="text-xs text-primary mt-2">مهتم بـ: {customer.interested_in}</p>
            )}
          </div>

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
  const [filterStage, setFilterStage] = useState("");
  const [view, setView] = useState("list");
  const [error, setError] = useState("");

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

  useEffect(() => { load(); }, [load]);

  // فلتر pipeline_stage يتم client-side
  const filtered = leads.filter(l =>
    !filterStage || (l.pipeline_stage || "جديد") === filterStage
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />CRM — العملاء
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة قاعدة عملاء التخزين</p>
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
          <button onClick={() => setForm({})}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />إضافة عميل
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

      {/* Pipeline Stage Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {PIPELINE_STAGES.map(s => (
          <button key={s} onClick={() => setFilterStage(filterStage === s ? "" : s)}
            className={`rounded-xl border p-3 text-center cursor-pointer transition-all bg-card
              ${filterStage === s ? "ring-2 ring-primary" : "hover:shadow-sm"}`}>
            <p className="text-xl font-bold">{leads.filter(l => (l.pipeline_stage || "جديد") === s).length}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STAGE_COLORS[s]}`}>{s}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو البريد أو الجوال..."
          className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
      </div>

      {/* Pipeline View */}
      {view === "pipeline" ? (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {PIPELINE_STAGES.map(stage => {
            const items = filtered.filter(l => (l.pipeline_stage || "جديد") === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-52 bg-muted/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage]}`}>{stage}</span>
                  <span className="text-xs text-muted-foreground font-medium">{items.length}</span>
                </div>
                {items.map(l => (
                  <div key={l.id} onClick={() => setSelected(l)}
                    className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:shadow-sm transition-shadow">
                    <p className="font-semibold text-sm text-foreground">{l.name || l.full_name}</p>
                    {l.mobile && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Phone className="w-3 h-3" />{l.mobile}
                      </p>
                    )}
                    {l.email && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />{l.email}
                      </p>
                    )}
                    {l.interested_in && (
                      <p className="text-xs text-primary mt-1 truncate">{l.interested_in}</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الاسم", "النوع", "الجوال", "البريد", "المسمى / ضريبي", "المرحلة", ""].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />جاري التحميل...
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا يوجد عملاء</td></tr>
              ) : filtered.map(l => (
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                      ${STAGE_COLORS[l.pipeline_stage || "جديد"] || "bg-gray-100 text-gray-600"}`}>
                      {l.pipeline_stage || "جديد"}
                    </span>
                  </td>
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
        <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
