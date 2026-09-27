import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import {
  createAsset,
  updateAsset,
  CATEGORY_TYPE_OPTIONS,
  STATE_OPTIONS,
  CONDITION_OPTIONS,
} from "@/api/assetsApi";
import { getVendors } from "@/api/Purchasesapi";
import { getAccounts, formatAccountLabel } from "@/api/accountingApi";

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

// تبويبات مستوحاة من فورم "Employee Custody" في أودوو (الوصف / بيانات المنتج / بيانات العهدة)
const TABS = [
  { id: "description", label: "الوصف" },
  { id: "product", label: "بيانات المنتج" },
  { id: "custody", label: "بيانات العهدة" },
];

const DEFAULT_FORM = {
  name: "",
  category_type: "Other",
  asset_id: "",
  classification: "",
  description: "",
  notes: "",
  serial_no: "",
  brand: "",
  model: "",
  warranty_duration: "",
  cost: 0,
  current_value: 0,
  partner_id: "",
  gl_account_id: "",
  invoice_number: "",
  actual_condition: "new",
  state: "available",
};


function assetToForm(asset) {
  if (!asset) return DEFAULT_FORM;
  return {
    name: asset.name ?? "",
    category_type: asset.category_type ?? "Other",
    asset_id: asset.asset_id ?? asset.asset_id_char ?? asset.asset_code ?? "",
    classification: asset.classification ?? "",
    description: asset.description ?? "",
    notes: asset.notes ?? "",
    serial_no: asset.serial_no ?? asset.serial_number ?? asset.serialNumber ?? "",
    brand: asset.brand ?? "",
    model: asset.model ?? "",
    warranty_duration: asset.warranty_duration ?? asset.warranty ?? "",
    cost: asset.cost ?? asset.purchase_price ?? 0,
    current_value: asset.current_value ?? 0,
    partner_id: asset.partner_id ?? "",
    gl_account_id: asset.gl_account_id ?? "",
    invoice_number: asset.invoice_number ?? asset.invoice_no ?? "",
    actual_condition: asset.actual_condition ?? "new",
    state: asset.state ?? "available",
  };
}

export default function AssetForm({ asset, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("description");
  const [form, setForm] = useState(() => assetToForm(asset));
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getVendors().then(setVendors).catch(() => setVendors([]));
    getAccounts().then(setAccounts).catch(() => setAccounts([]));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("اسم الأصل مطلوب");
      setActiveTab("description");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category_type: form.category_type,
        asset_id: form.asset_id.trim(),
        classification: form.classification.trim(),
        description: form.description.trim(),
        notes: form.notes.trim(),
        serial_no: form.serial_no.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        warranty_duration: form.warranty_duration.trim(),
        cost: Number(form.cost) || 0,
        current_value: Number(form.current_value) || 0,
        partner_id: form.partner_id ? Number(form.partner_id) : null,
        gl_account_id: form.gl_account_id ? Number(form.gl_account_id) : null,
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

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-border px-6 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ── الوصف ─────────────────────────────────────────── */}
          {activeTab === "description" && (
            <div className="space-y-4">
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
              <Field label="الوصف (Description)">
                <textarea
                  value={form.description}
                  onChange={e => set("description", e.target.value)}
                  rows={2}
                  placeholder="وصف مختصر للأصل..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
                />
              </Field>
              <Field label="ملاحظات">
                <textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
                />
              </Field>
            </div>
          )}

          {/* ── بيانات المنتج ─────────────────────────────────── */}
          {activeTab === "product" && (
            <div className="grid grid-cols-2 gap-4">
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
              <Field label="الرقم التسلسلي">
                <Input
                  value={form.serial_no}
                  onChange={e => set("serial_no", e.target.value)}
                  dir="ltr"
                  placeholder="مثال: SN-A1B2C3"
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
          )}

          {/* ── بيانات العهدة ─────────────────────────────────── */}
          {activeTab === "custody" && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="كود الأصل (Asset ID)">
                <Input
                  value={form.asset_id}
                  onChange={e => set("asset_id", e.target.value)}
                  dir="ltr"
                  placeholder="مثال: AST-A1B2C3"
                />
              </Field>
              <Field label="التصنيف (Classification)">
                <Input
                  value={form.classification}
                  onChange={e => set("classification", e.target.value)}
                  placeholder="مثال: high"
                />
              </Field>
              <Field label="المورد (Vendor)">
                <Select value={form.partner_id} onChange={e => set("partner_id", e.target.value)}>
                  <option value="">بدون مورد...</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="رقم الفاتورة (Invoice No)">
                <Input
                  value={form.invoice_number}
                  onChange={e => set("invoice_number", e.target.value)}
                  dir="ltr"
                  placeholder="مثال: INV-2026-0099"
                />
              </Field>
              <Field label="التكلفة (Cost)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.cost}
                  onChange={e => set("cost", e.target.value)}
                />
              </Field>
              <Field label="القيمة الحالية (Current Value)">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.current_value}
                  onChange={e => set("current_value", e.target.value)}
                />
              </Field>
              <Field label="حساب الأستاذ العام (GL Account)">
                <Select value={form.gl_account_id} onChange={e => set("gl_account_id", e.target.value)}>
                  <option value="">بدون حساب...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{formatAccountLabel(a)}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
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
