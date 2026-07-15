import { useState, useEffect } from "react";
import { Plus, X, Save, Search, Edit2, Warehouse, Download, Upload } from "lucide-react";
import {
  getStorageUnits,
  createStorageUnit,
  updateStorageUnit,
  deleteStorageUnit,
  exportStorageUnitsCsv,
  importStorageUnitsCsv,
} from "@/api/storageUnitsApi";
import UnitPhoto from "@/components/storage/UnitPhoto";

const STATUS_COLORS = {
  "متاحة": "bg-green-100 text-green-700",
  "محجوزة": "bg-amber-100 text-amber-700",
  "مؤجرة": "bg-blue-100 text-blue-700",
  "خارج الخدمة": "bg-red-100 text-red-600",
};

// ─── Form ──────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, type = "text" }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
    </div>
  );
}

function UnitForm({ unit, onSave, onClose }) {
  const blank = {
    unit_number: "", unit_name: "", branch: "", unit_type: "غير مكيف",
    area_sqm: 0, length_m: 0, width_m: 0, height_m: 0,
    monthly_price: 0, status: "متاحة", description: "",
    has_security: false, has_cameras: false, easy_access: false,
    floor: "", image_url: "",
  };
  const [form, setForm] = useState(unit || blank);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (unit?.image_url) {
      setPreviewUrl(unit.image_url);
    }
  }, [unit?.image_url]);

  const handleImage = (file) => {
    setUploading(true);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.unit_number || !form.branch || !form.monthly_price) {
      setError("يرجى ملء الحقول الإلزامية (رقم الوحدة، الموقع، السعر)");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = imageFile ? { ...form, imageFile } : form;
      if (unit?.id) {
        await updateStorageUnit(unit.id, payload);
      } else {
        await createStorageUnit(payload);
      }
      onSave();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-primary" />
            {unit ? "تعديل وحدة" : "إضافة وحدة جديدة"}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* الأساسيات */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="رقم الوحدة *" value={form.unit_number} onChange={v => set("unit_number", v)} />
            <Field label="اسم الوحدة" value={form.unit_name} onChange={v => set("unit_name", v)} />
            <Field label="الموقع / الفرع *" value={form.branch} onChange={v => set("branch", v)} />
            <Field label="الطابق" value={form.floor} onChange={v => set("floor", v)} />
          </div>

          {/* النوع والحالة */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع الوحدة</label>
              <select value={form.unit_type} onChange={e => set("unit_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background">
                <option>مكيف</option>
                <option>غير مكيف</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الحالة</label>
              <select value={form.status} onChange={e => set("status", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background">
                {["متاحة", "محجوزة", "مؤجرة", "خارج الخدمة"].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* الأبعاد */}
          <div className="grid grid-cols-4 gap-3">
            <Field label="المساحة (م²)" type="number" value={form.area_sqm} onChange={v => set("area_sqm", +v)} />
            <Field label="الطول (م)" type="number" value={form.length_m} onChange={v => set("length_m", +v)} />
            <Field label="العرض (م)" type="number" value={form.width_m} onChange={v => set("width_m", +v)} />
            <Field label="الارتفاع (م)" type="number" value={form.height_m} onChange={v => set("height_m", +v)} />
          </div>

          <Field label="السعر الشهري (ر.س) *" type="number" value={form.monthly_price} onChange={v => set("monthly_price", +v)} />

          {/* الوصف */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">وصف الوحدة</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none" />
          </div>

          {/* المميزات */}
          <div className="space-y-2">
            <label className="text-sm font-medium">المميزات الإضافية</label>
            <div className="flex gap-4">
              {[
                ["has_security", "أمان 24/7"],
                ["has_cameras", "كاميرات"],
                ["easy_access", "سهولة الوصول"],
              ].map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" checked={!!form[k]}
                    onChange={e => set(k, e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                  {l}
                </label>
              ))}
            </div>
          </div>

          {/* الصورة */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">صورة الوحدة</label>
            {previewUrl && (
              <img src={previewUrl} alt="" className="w-full h-32 object-cover rounded-lg border border-border" />
            )}
            <input type="file" accept="image/*"
              onChange={e => e.target.files[0] && handleImage(e.target.files[0])}
              className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:bg-primary file:text-white file:rounded-lg" />
            {uploading && <p className="text-xs text-muted-foreground">جاري الرفع...</p>}
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">
            إلغاء
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ الوحدة"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function StorageUnits() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);       // null = مخفي | {} = إضافة | unit = تعديل
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ─── Load ─────────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getStorageUnits();
      setUnits(data);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "فشل تحميل الوحدات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف الوحدة؟")) return;
    try {
      await deleteStorageUnit(id);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || "فشل الحذف");
    }
  };

  // ─── Export CSV — يستخدم GET /storage/units/export ──────────────────────

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportStorageUnitsCsv();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || "فشل تصدير الملف");
    } finally {
      setExporting(false);
    }
  };

  // ─── Import CSV — يستخدم POST /storage/units/import ─────────────────────

  const [importing, setImporting] = useState(false);

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const result = await importStorageUnitsCsv(file);
      const count = result?.data?.imported_count ?? result?.imported_count;
      alert(`✅ ${count != null ? `تم استيراد ${count} وحدة` : "تم الاستيراد بنجاح"}`);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || "فشل الاستيراد");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // ─── Filter ───────────────────────────────────────────────────────────────

  const filtered = units
    .filter(u => !filterStatus || u.status === filterStatus)
    .filter(u =>
      !search ||
      u.unit_number?.includes(search) ||
      u.unit_name?.includes(search) ||
      u.branch?.includes(search)
    );

  const stats = {
    total: units.length,
    available: units.filter(u => u.status === "متاحة").length,
    rented: units.filter(u => u.status === "مؤجرة").length,
    reserved: units.filter(u => u.status === "محجوزة").length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-primary" />إدارة وحدات التخزين
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة جميع وحدات التخزين المتاحة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50">
            <Download className="w-4 h-4" />{exporting ? "جاري التصدير..." : "تصدير CSV"}
          </button>
          <label className={`flex items-center gap-2 px-3 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted cursor-pointer ${importing ? "opacity-50 pointer-events-none" : ""}`}>
            <Upload className="w-4 h-4" />{importing ? "جاري الاستيراد..." : "استيراد CSV"}
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} disabled={importing} />
          </label>
          <button onClick={() => setForm({})}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث برقم الوحدة أو الموقع..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {["", "متاحة", "محجوزة", "مؤجرة", "خارج الخدمة"].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors
                ${filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
                }`}>
              {s || "الكل"}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <p className="text-center py-16 text-muted-foreground">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground">لا توجد وحدات</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(u => (
            <div key={u.id}
              className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow">
              <UnitPhoto unit={u} />
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-foreground">{u.unit_number}</p>
                    <p className="text-xs text-muted-foreground">{u.unit_name || u.branch}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[u.status]}`}>
                    {u.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  <span className="bg-muted px-2 py-0.5 rounded">{u.unit_type}</span>
                  {u.area_sqm > 0 && <span className="bg-muted px-2 py-0.5 rounded">{u.area_sqm} م²</span>}
                  {u.has_security && <span className="bg-blue-50   text-blue-600   px-2 py-0.5 rounded">🔒 أمان</span>}
                  {u.has_cameras && <span className="bg-purple-50  text-purple-600 px-2 py-0.5 rounded">📷 كاميرات</span>}
                  {u.easy_access && <span className="bg-green-50   text-green-600  px-2 py-0.5 rounded">🚪 وصول سهل</span>}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="font-bold text-primary">
                    {u.monthly_price?.toLocaleString("ar-SA")} ر.س/شهر
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => setForm(u)}
                      className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(u.id)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {form !== null && (
        <UnitForm
          unit={form?.id ? form : null}
          onSave={() => { setForm(null); load(); }}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  );
}
