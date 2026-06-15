import { useState } from "react";
import { X, Save } from "lucide-react";
import {
  createAsset,
  updateAsset,
  CATEGORY_TYPE_OPTIONS,
  STATE_OPTIONS,
  CONDITION_OPTIONS,
} from "@/api/assetsApi";

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
  />
);

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
  >
    {children}
  </select>
);

const DEFAULT_FORM = {
  name: "",
  category_type: "Other",
  asset_id_char: "",
  classification: "",
  description: "",
  notes: "",
  serial_no: "",
  brand: "",
  model: "",
  warranty_duration: "",
  cost: 0,
  vendor: "",
  invoice_number: "",
  actual_condition: "new",
  state: "available",
};


function assetToForm(asset) {
  if (!asset) return DEFAULT_FORM;
  return {
    name: asset.name ?? "",
    category_type: asset.category_type ?? "Other",
    asset_id_char: asset.asset_id_char ?? asset.asset_id ?? asset.asset_code ?? "",
    classification: asset.classification ?? "",
    description: asset.description ?? "",
    notes: asset.notes ?? "",
    serial_no: asset.serial_no ?? asset.serial_number ?? asset.serialNumber ?? "",
    brand: asset.brand ?? "",
    model: asset.model ?? "",
    warranty_duration: asset.warranty_duration ?? asset.warranty ?? "",
    cost: asset.cost ?? asset.purchase_price ?? 0,
    vendor: asset.vendor ?? "",
    invoice_number: asset.invoice_number ?? asset.invoice_no ?? "",
    actual_condition: asset.actual_condition ?? "new",
    state: asset.state ?? "available",
  };
}

export default function AssetForm({ asset, onClose, onSave }) {
  const [form, setForm] = useState(() => assetToForm(asset));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("اسم الأصل مطلوب");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category_type: form.category_type,
        asset_id_char: form.asset_id_char.trim(),
        classification: form.classification.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        serial_no: form.serial_no.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        warranty_duration: form.warranty_duration.trim(),
        cost: Number(form.cost) || 0,
        vendor: form.vendor.trim(),
        invoice_number: form.invoice_number.trim(),
        actual_condition: form.actual_condition,
        state: form.state,
      };

      if (asset?.id) {
        await updateAsset(asset.id, payload);
      } else {
        await createAsset(payload);
      }
      onSave();
    } catch (err) {
      console.error("Asset save error:", err);
      setError(err?.response?.data?.message ?? "حدث خطأ أثناء الحفظ، حاول مرة أخرى");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{asset ? "تعديل الأصل" : "إضافة أصل جديد"}</h2>
          <button onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">البيانات الأساسية</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="اسم الأصل *">
              <Input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                required
                placeholder="مثال: Lenovo ThinkPad P16"
              />
            </Field>
            <Field label="نوع الأصل (Category Type) *">
              <Select value={form.category_type} onChange={e => set("category_type", e.target.value)}>
                {CATEGORY_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="كود الأصل (Asset ID)">
              <Input
                value={form.asset_id_char}
                onChange={e => set("asset_id_char", e.target.value)}
                dir="ltr"
                placeholder="مثال: AST-A1B2C3"
              />
            </Field>
            <Field label="التصنيف (Classification)">
              <Input
                value={form.classification}
                onChange={e => set("classification", e.target.value)}
                placeholder="مثال: أجهزة إلكترونية"
              />
            </Field>
          </div>

          <Field label="الوصف (Description)">
            <textarea
              value={form.description}
              onChange={e => set("description", e.target.value)}
              rows={2}
              placeholder="وصف مختصر للأصل..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
            />
          </Field>

          {/* Technical Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">البيانات التقنية</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="الرقم التسلسلي">
              <Input
                value={form.serial_no}
                onChange={e => set("serial_no", e.target.value)}
                dir="ltr"
                placeholder="مثال: SN-A1B2C3"
              />
            </Field>
            <Field label="العلامة التجارية">
              <Input
                value={form.brand}
                onChange={e => set("brand", e.target.value)}
                placeholder="مثال: Lenovo"
              />
            </Field>
            <Field label="الموديل">
              <Input
                value={form.model}
                onChange={e => set("model", e.target.value)}
                placeholder="مثال: ThinkPad P16"
              />
            </Field>
            <Field label="مدة الضمان">
              <Input
                value={form.warranty_duration}
                onChange={e => set("warranty_duration", e.target.value)}
                placeholder="مثال: 3 Years"
              />
            </Field>
          </div>

          {/* Purchase Info */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">بيانات الشراء</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="التكلفة (ريال)">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.cost}
                onChange={e => set("cost", e.target.value)}
              />
            </Field>
            <Field label="المورد (Vendor)">
              <Input
                value={form.vendor}
                onChange={e => set("vendor", e.target.value)}
                placeholder="مثال: Lenovo Authorized Vendor"
              />
            </Field>
            <Field label="رقم الفاتورة (Invoice No)">
              <Input
                value={form.invoice_number}
                onChange={e => set("invoice_number", e.target.value)}
                dir="ltr"
                placeholder="مثال: INV-2026-0099"
              />
            </Field>
          </div>

          {/* Status */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">الحالة</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="الحالة الفعلية (Actual Condition)">
              <Select value={form.actual_condition} onChange={e => set("actual_condition", e.target.value)}>
                {CONDITION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
            <Field label="حالة الأصل (State)">
              <Select value={form.state} onChange={e => set("state", e.target.value)}>
                {STATE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="ملاحظات">
            <textarea
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
            />
          </Field>
        </form>

        {/* Footer */}
        <div className="flex gap-3 justify-end px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
