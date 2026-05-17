import { useState } from "react";
import { X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);
const Input = (props) => (
  <input {...props} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
);
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">{children}</select>
);

export default function AssetForm({ asset, onClose, onSave }) {
  const [form, setForm] = useState({
    asset_name: "", asset_type: "أخرى", asset_code: "", description: "",
    category: "", serial_number: "", brand: "", model: "",
    purchase_price: 0, supplier_name: "", invoice_number: "", warranty_period: "",
    condition: "جديد", status: "متاح", notes: "",
    ...(asset || {}),
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const me = await base44.auth.me();
    if (asset?.id) {
      await base44.entities.Asset.update(asset.id, form);
    } else {
      await base44.entities.Asset.create({
        ...form,
        history: [{ action: "إنشاء", performed_by: me.full_name || me.email, date: new Date().toISOString().slice(0, 10), notes: "تم إنشاء الأصل" }]
      });
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{asset ? "تعديل الأصل" : "إضافة أصل جديد"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Basic Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">البيانات الأساسية</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="اسم الأصل *">
              <Input value={form.asset_name} onChange={e => set("asset_name", e.target.value)} required />
            </Field>
            <Field label="نوع الأصل *">
              <Select value={form.asset_type} onChange={e => set("asset_type", e.target.value)}>
                <option>أجهزة إلكترونية</option>
                <option>أدوات مكتبية</option>
                <option>معدات تشغيل</option>
                <option>أخرى</option>
              </Select>
            </Field>
            <Field label="كود الأصل (Asset ID)">
              <Input value={form.asset_code} onChange={e => set("asset_code", e.target.value)} dir="ltr" />
            </Field>
            <Field label="التصنيف">
              <Input value={form.category} onChange={e => set("category", e.target.value)} placeholder="أجهزة، أثاث، معدات..." />
            </Field>
          </div>
          <Field label="الوصف *">
            <textarea value={form.description} onChange={e => set("description", e.target.value)} required rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </Field>

          {/* Technical Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">البيانات التقنية</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="الرقم التسلسلي">
              <Input value={form.serial_number} onChange={e => set("serial_number", e.target.value)} dir="ltr" />
            </Field>
            <Field label="العلامة التجارية">
              <Input value={form.brand} onChange={e => set("brand", e.target.value)} />
            </Field>
            <Field label="الموديل">
              <Input value={form.model} onChange={e => set("model", e.target.value)} />
            </Field>
            <Field label="مدة الضمان">
              <Input value={form.warranty_period} onChange={e => set("warranty_period", e.target.value)} placeholder="مثال: سنة واحدة" />
            </Field>
          </div>

          {/* Purchase Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">بيانات الشراء</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="سعر الشراء (ريال)">
              <Input type="number" min={0} value={form.purchase_price} onChange={e => set("purchase_price", +e.target.value)} />
            </Field>
            <Field label="اسم المورد">
              <Input value={form.supplier_name} onChange={e => set("supplier_name", e.target.value)} />
            </Field>
            <Field label="رقم الفاتورة">
              <Input value={form.invoice_number} onChange={e => set("invoice_number", e.target.value)} dir="ltr" />
            </Field>
          </div>

          {/* Status */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">الحالة</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="الحالة الفعلية">
              <Select value={form.condition} onChange={e => set("condition", e.target.value)}>
                <option>جديد</option><option>جيد</option><option>تالف</option>
              </Select>
            </Field>
            <Field label="حالة الأصل">
              <Select value={form.status} onChange={e => set("status", e.target.value)}>
                <option>متاح</option><option>مخصص</option><option>صيانة</option>
              </Select>
            </Field>
          </div>
          <Field label="ملاحظات">
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </Field>
        </form>
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}