import { useState, useEffect, useRef } from "react";
import { Plus, X, Save, Search, Edit2, Warehouse, Download, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STATUS_COLORS = {
  "متاحة": "bg-green-100 text-green-700",
  "محجوزة": "bg-amber-100 text-amber-700",
  "مؤجرة": "bg-blue-100 text-blue-700",
  "خارج الخدمة": "bg-red-100 text-red-600",
};

function UnitForm({ unit, onSave, onClose }) {
  const blank = { unit_number: "", unit_name: "", branch: "", unit_type: "غير مكيف", area_sqm: 0, length_m: 0, width_m: 0, height_m: 0, monthly_price: 0, status: "متاحة", description: "", has_security: false, has_cameras: false, easy_access: false, floor: "", image_url: "" };
  const [form, setForm] = useState(unit || blank);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleImage = async (file) => {
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set("image_url", file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    if (unit?.id) await base44.entities.StorageUnit.update(unit.id, form);
    else await base44.entities.StorageUnit.create(form);
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2"><Warehouse className="w-5 h-5 text-primary" />{unit ? "تعديل وحدة" : "إضافة وحدة جديدة"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم الوحدة *" value={form.unit_number} onChange={v => set("unit_number", v)} />
            <Field label="اسم الوحدة" value={form.unit_name} onChange={v => set("unit_name", v)} />
            <Field label="الفرع / الموقع *" value={form.branch} onChange={v => set("branch", v)} />
            <Field label="الطابق" value={form.floor} onChange={v => set("floor", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الوحدة</label>
              <select value={form.unit_type} onChange={e => set("unit_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background">
                <option>مكيف</option><option>غير مكيف</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الحالة</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background">
                {["متاحة","محجوزة","مؤجرة","خارج الخدمة"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Field label="المساحة (م²)" type="number" value={form.area_sqm} onChange={v => set("area_sqm", +v)} />
            <Field label="الطول (م)" type="number" value={form.length_m} onChange={v => set("length_m", +v)} />
            <Field label="العرض (م)" type="number" value={form.width_m} onChange={v => set("width_m", +v)} />
            <Field label="الارتفاع (م)" type="number" value={form.height_m} onChange={v => set("height_m", +v)} />
          </div>
          <Field label="السعر الشهري (ر.س) *" type="number" value={form.monthly_price} onChange={v => set("monthly_price", +v)} />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">وصف الوحدة</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none" />
          </div>
          {/* Features */}
          <div className="space-y-2">
            <label className="text-sm font-medium">المميزات الإضافية</label>
            <div className="flex gap-4">
              {[["has_security","أمان 24/7"],["has_cameras","كاميرات"],["easy_access","سهولة الوصول"]].map(([k,l]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} className="w-4 h-4 accent-primary" />{l}
                </label>
              ))}
            </div>
          </div>
          {/* Image */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">صورة الوحدة</label>
            {form.image_url && <img src={form.image_url} alt="" className="w-full h-32 object-cover rounded-lg border border-border" />}
            <input type="file" accept="image/*" onChange={e => e.target.files[0] && handleImage(e.target.files[0])}
              className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:bg-primary file:text-white file:rounded-lg" />
            {uploading && <p className="text-xs text-muted-foreground">جاري الرفع...</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.unit_number || !form.branch || !form.monthly_price}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ الوحدة"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
    </div>
  );
}

export default function StorageUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null | {} | unit
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const load = () => base44.entities.StorageUnit.list().then(u => { setUnits(u); setLoading(false); });
  useEffect(() => { load(); }, []);

  const handleExport = () => {
    const headers = ["unit_number","unit_name","branch","floor","unit_type","status","area_sqm","length_m","width_m","height_m","monthly_price","description","has_security","has_cameras","easy_access"];
    const rows = units.map(u => headers.map(h => `"${u[h] ?? ""}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = "storage-units.csv";
    a.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
    const records = lines.slice(1).map(line => {
      const vals = line.split(",").map(v => v.replace(/"/g, "").trim());
      const obj = {};
      headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
      ["area_sqm","length_m","width_m","height_m","monthly_price"].forEach(k => { if (obj[k]) obj[k] = +obj[k]; });
      ["has_security","has_cameras","easy_access"].forEach(k => { obj[k] = obj[k] === "true"; });
      return obj;
    }).filter(r => r.unit_number && r.branch);
    if (!records.length) { alert("لا توجد بيانات صالحة في الملف"); return; }
    await base44.entities.StorageUnit.bulkCreate(records);
    alert(`✅ تم استيراد ${records.length} وحدة`);
    load();
    e.target.value = "";
  };

  const deleteUnit = async (id) => {
    if (!confirm("هل أنت متأكد من حذف الوحدة؟")) return;
    await base44.entities.StorageUnit.delete(id);
    load();
  };

  const filtered = units
    .filter(u => !filterStatus || u.status === filterStatus)
    .filter(u => !search || u.unit_number?.includes(search) || u.unit_name?.includes(search) || u.branch?.includes(search));

  const stats = { total: units.length, available: units.filter(u => u.status === "متاحة").length, rented: units.filter(u => u.status === "مؤجرة").length, reserved: units.filter(u => u.status === "محجوزة").length };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Warehouse className="w-6 h-6 text-primary" />إدارة وحدات التخزين</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة جميع وحدات التخزين المتاحة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted">
            <Download className="w-4 h-4" />تصدير CSV
          </button>
          <label className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted cursor-pointer">
            <Upload className="w-4 h-4" />استيراد CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button onClick={() => setForm({})} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />إضافة وحدة
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "إجمالي الوحدات", value: stats.total, color: "text-foreground" },
          { label: "متاحة", value: stats.available, color: "text-green-600" },
          { label: "مؤجرة", value: stats.rented, color: "text-blue-600" },
          { label: "محجوزة", value: stats.reserved, color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث برقم الوحدة أو الفرع..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {["","متاحة","محجوزة","مؤجرة","خارج الخدمة"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${filterStatus === s ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
              {s || "الكل"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? <p className="text-center py-16 text-muted-foreground">جاري التحميل...</p>
        : filtered.length === 0 ? <p className="text-center py-16 text-muted-foreground">لا توجد وحدات</p>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(u => (
              <div key={u.id} className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
                {u.image_url
                  ? <img src={u.image_url} alt="" className="w-full h-36 object-cover" />
                  : <div className="w-full h-36 bg-muted/50 flex items-center justify-center"><Warehouse className="w-10 h-10 text-muted-foreground/30" /></div>}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground">{u.unit_number}</p>
                      <p className="text-xs text-muted-foreground">{u.unit_name || u.branch}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[u.status]}`}>{u.status}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded">{u.unit_type}</span>
                    {u.area_sqm > 0 && <span className="bg-muted px-2 py-0.5 rounded">{u.area_sqm} م²</span>}
                    {u.has_security && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded">🔒 أمان</span>}
                    {u.has_cameras && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded">📷 كاميرات</span>}
                    {u.easy_access && <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">🚪 وصول سهل</span>}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="font-bold text-primary">{u.monthly_price?.toLocaleString("ar-SA")} ر.س/شهر</p>
                    <div className="flex gap-1">
                      <button onClick={() => setForm(u)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteUnit(u.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {form !== null && <UnitForm unit={form?.id ? form : null} onSave={() => { setForm(null); load(); }} onClose={() => setForm(null)} />}
    </div>
  );
}