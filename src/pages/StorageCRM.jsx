import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, X, Search, Phone, Eye, User, Edit2 } from "lucide-react";

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

function LeadForm({ lead, onSave, onClose }) {
  const [form, setForm] = useState(lead || { full_name: "", phone: "", email: "", pipeline_stage: "جديد", notes: "", customer_type: "فرد", company_name: "", interested_in: "" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    if (lead?.id) await base44.entities.StorageLead.update(lead.id, form);
    else await base44.entities.StorageLead.create(form);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-bold">{lead ? "تعديل عميل" : "إضافة عميل جديد"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">الاسم الكامل *</label>
              <input value={form.full_name} onChange={e => set("full_name", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">رقم الجوال</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">البريد الإلكتروني</label>
              <input value={form.email} onChange={e => set("email", e.target.value)} type="email" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">نوع العميل</label>
              <select value={form.customer_type} onChange={e => set("customer_type", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                <option>فرد</option><option>شركة</option>
              </select>
            </div>
            {form.customer_type === "شركة" && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">اسم الشركة</label>
                <input value={form.company_name} onChange={e => set("company_name", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
              </div>
            )}
            <div className={form.customer_type === "شركة" ? "col-span-2" : ""}>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">مرحلة Pipeline</label>
              <select value={form.pipeline_stage} onChange={e => set("pipeline_stage", e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary bg-white">
                {PIPELINE_STAGES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">المنتج / الوحدة المهتم بها</label>
              <input value={form.interested_in} onChange={e => set("interested_in", e.target.value)} placeholder="مثال: وحدة مكيفة في الرياض" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-gray-700 block mb-1.5">ملاحظات</label>
              <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-xl hover:bg-gray-50">إلغاء</button>
          <button onClick={save} disabled={saving || !form.full_name} className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? "حفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailModal({ customer, onClose }) {
  const [bookings, setBookings] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("info");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customer.email) { setLoading(false); return; }
    Promise.all([
      base44.entities.StorageBooking.filter({ email: customer.email }),
      base44.entities.StorageContract.filter({ customer_email: customer.email }),
      base44.entities.StorageInvoice.filter({ customer_email: customer.email }),
    ]).then(([b, c, i]) => {
      setBookings(b); setContracts(c); setInvoices(i); setLoading(false);
    });
  }, [customer.email]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{customer.full_name}</h3>
              <p className="text-xs text-gray-400">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="flex border-b">
          {[["info","معلومات"],["bookings","حجوزات"],["contracts","عقود"],["invoices","فواتير"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === id ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-600"}`}>{label}</button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? <p className="text-center text-gray-400 py-8">جاري التحميل...</p> : (
            <>
              {tab === "info" && (
                <div className="space-y-3 text-sm">
                  <Row label="الجوال" value={customer.phone} />
                  <Row label="نوع العميل" value={customer.customer_type} />
                  {customer.company_name && <Row label="الشركة" value={customer.company_name} />}
                  <Row label="مرحلة Pipeline" value={<span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[customer.pipeline_stage]}`}>{customer.pipeline_stage}</span>} />
                  {customer.interested_in && <Row label="مهتم بـ" value={customer.interested_in} />}
                  {customer.notes && <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 font-medium mb-1">ملاحظات</p><p className="text-gray-700">{customer.notes}</p></div>}
                </div>
              )}
              {tab === "bookings" && (
                bookings.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد حجوزات</p> :
                <div className="space-y-2">
                  {bookings.map(b => (
                    <div key={b.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm">
                      <div><p className="font-medium">{b.unit_number} — {b.branch}</p><p className="text-xs text-gray-400">{b.booking_number}</p></div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${b.status === "Confirmed" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === "contracts" && (
                contracts.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد عقود</p> :
                <div className="space-y-2">
                  {contracts.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm">
                      <div><p className="font-medium">وحدة {c.unit_number} — {c.branch}</p><p className="text-xs text-gray-400">من {c.start_date} إلى {c.end_date}</p></div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${c.status === "نشط" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
                    </div>
                  ))}
                </div>
              )}
              {tab === "invoices" && (
                invoices.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد فواتير</p> :
                <div className="space-y-2">
                  {invoices.map(inv => (
                    <div key={inv.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-sm">
                      <div><p className="font-medium">{inv.invoice_number}</p><p className="text-xs text-gray-400">وحدة {inv.unit_number} — {inv.months} شهر</p></div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{inv.total_amount?.toLocaleString("ar-SA")} ر.س</p>
                        <span className={`text-xs ${inv.status === "مدفوعة" ? "text-green-600" : "text-red-500"}`}>{inv.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function StorageCRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [view, setView] = useState("list"); // list | pipeline

  const load = () => base44.entities.StorageLead.list("-created_date").then(d => { setLeads(d); setLoading(false); });
  useEffect(() => { load(); }, []);

  const filtered = leads.filter(l =>
    (!filterStage || l.pipeline_stage === filterStage) &&
    (!search || l.full_name?.includes(search) || l.email?.includes(search) || l.phone?.includes(search))
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />CRM — العملاء المحتملون
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">تتبع العملاء المحتملين في pipeline المبيعات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView(v => v === "list" ? "pipeline" : "list")} className="px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-muted">
            {view === "list" ? "عرض Pipeline" : "عرض القائمة"}
          </button>
          <button onClick={() => setForm({})} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />إضافة عميل
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
        {PIPELINE_STAGES.map(s => (
          <button key={s} onClick={() => setFilterStage(filterStage === s ? "" : s)}
            className={`rounded-xl border p-3 text-center cursor-pointer transition-all ${filterStage === s ? "ring-2 ring-primary" : "hover:shadow-sm"} bg-card`}>
            <p className="text-xl font-bold">{leads.filter(l => l.pipeline_stage === s).length}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${STAGE_COLORS[s]}`}>{s}</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم أو جوال..."
          className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
      </div>

      {view === "pipeline" ? (
        <div className="flex gap-3 overflow-x-auto pb-3">
          {PIPELINE_STAGES.map(stage => {
            const items = filtered.filter(l => l.pipeline_stage === stage);
            return (
              <div key={stage} className="flex-shrink-0 w-52 bg-muted/30 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[stage]}`}>{stage}</span>
                  <span className="text-xs text-muted-foreground font-medium">{items.length}</span>
                </div>
                {items.map(l => (
                  <div key={l.id} onClick={() => setSelected(l)} className="bg-card rounded-xl border border-border p-3 cursor-pointer hover:shadow-sm transition-shadow">
                    <p className="font-semibold text-sm text-foreground">{l.full_name}</p>
                    {l.phone && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{l.phone}</p>}
                    {l.interested_in && <p className="text-xs text-primary mt-1 truncate">{l.interested_in}</p>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["الاسم","الجوال","البريد","النوع","المرحلة","مهتم بـ",""].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا يوجد عملاء</td></tr>
                : filtered.map(l => (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{l.full_name}</p>
                      {l.company_name && <p className="text-xs text-muted-foreground">{l.company_name}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{l.email}</td>
                    <td className="px-4 py-3"><span className="text-xs">{l.customer_type}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[l.pipeline_stage] || "bg-gray-100 text-gray-600"}`}>{l.pipeline_stage}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-24 truncate">{l.interested_in}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setSelected(l)} className="p-1.5 hover:bg-muted rounded"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => setForm(l)} className="p-1.5 hover:bg-muted rounded"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {form !== null && <LeadForm lead={form?.id ? form : null} onSave={() => { setForm(null); load(); }} onClose={() => setForm(null)} />}
      {selected && <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}