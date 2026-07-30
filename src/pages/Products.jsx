import { useState } from "react";
import { Package, Plus, X, Save, Star, Camera } from "lucide-react";

// ===== Mock Data (فيك داتا مؤقتة لحد ما نربطها بالـ API) =====
const MOCK_PRODUCTS = [
  {
    id: 1,
    reference: "EXP_GEN",
    name: "Expenses",
    favorite: false,
    sales: true,
    purchase: true,
    expenses: false,
    product_type: "service",
    sales_price: 1,
    sales_tax: "15%",
    cost: 0,
    purchase_tax: "",
    category: "الكل",
    barcode: "",
    income_account: "",
    expense_account: "",
    asset_type: "",
  },
  {
    id: 2,
    reference: "SRV-001",
    name: "Updated Name",
    favorite: false,
    sales: true,
    purchase: false,
    expenses: false,
    product_type: "service",
    sales_price: 150,
    sales_tax: "15%",
    cost: 0,
    purchase_tax: "",
    category: "الكل",
    barcode: "",
    income_account: "",
    expense_account: "",
    asset_type: "",
  },
];

const emptyProduct = {
  id: null,
  reference: "",
  name: "",
  favorite: false,
  sales: true,
  purchase: true,
  expenses: false,
  product_type: "goods",
  sales_price: 0,
  sales_tax: "15%",
  cost: 0,
  purchase_tax: "15%",
  category: "الكل",
  reference2: "",
  barcode: "",
  income_account: "",
  expense_account: "",
  asset_type: "",
};

const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TaxChip({ value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
      {value}
    </span>
  );
}

function ProductForm({ product, onSave, onDiscard }) {
  const [form, setForm] = useState(product || emptyProduct);
  const [tab, setTab] = useState("general");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const isEdit = Boolean(form.id);

  const priceInclTax = form.sales_tax
    ? form.sales_price * (1 + parseFloat(form.sales_tax) / 100)
    : form.sales_price;

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumb + Save/Discard */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 text-sm">
          <button onClick={onDiscard} className="px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-muted">
            جديد
          </button>
          <span className="text-muted-foreground">المنتجات</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{isEdit ? form.name : "جديد"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onSave(form)} className="p-2 rounded-lg text-primary hover:bg-primary/10" title="حفظ">
            <Save className="w-4 h-4" />
          </button>
          <button onClick={onDiscard} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" title="إلغاء">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="bg-card p-6 space-y-5">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground mb-1">المنتج</p>
            <div className="flex items-center gap-2">
              <button onClick={() => set("favorite", !form.favorite)} title="مفضل">
                <Star
                  className={`w-5 h-5 flex-shrink-0 ${
                    form.favorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                  }`}
                />
              </button>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="مثال: تشيز برجر"
                className="w-full text-xl border-0 border-b border-border focus:outline-none focus:border-primary bg-transparent py-1"
              />
            </div>
            <div className="flex items-center gap-5 text-sm mt-3">
              {[
                ["sales", "مبيعات"],
                ["purchase", "مشتريات"],
                ["expenses", "مصروفات"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => set(key, e.target.checked)}
                    className="accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <Camera className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {[
            { id: "general", label: "معلومات عامة" },
            { id: "accounting", label: "المحاسبة" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "general" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 pt-2">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">نوع المنتج</p>
              <div className="flex items-center gap-5 text-sm">
                {[
                  ["goods", "سلعة"],
                  ["service", "خدمة"],
                  ["combo", "مجموعة"],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.product_type === val}
                      onChange={() => set("product_type", val)}
                      className="accent-primary"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">سعر البيع</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="number"
                    value={form.sales_price}
                    onChange={(e) => set("sales_price", +e.target.value)}
                    className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">ضريبة المبيعات</label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    value={form.sales_tax}
                    onChange={(e) => set("sales_tax", e.target.value)}
                    placeholder="مثال: 15%"
                    className="w-24 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                  {form.sales_tax && (
                    <span className="text-xs text-muted-foreground">(= $ {fmt(priceInclTax)} شامل الضريبة)</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">التكلفة</label>
                <input
                  type="number"
                  value={form.cost}
                  onChange={(e) => set("cost", +e.target.value)}
                  className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">ضريبة المشتريات</label>
                <input
                  value={form.purchase_tax}
                  onChange={(e) => set("purchase_tax", e.target.value)}
                  placeholder="مثال: 15%"
                  className="w-24 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">الفئة</label>
                <input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">المرجع</label>
                <input
                  value={form.reference2}
                  onChange={(e) => set("reference2", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">الباركود</label>
                <input
                  value={form.barcode}
                  onChange={(e) => set("barcode", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 pt-2">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase border-b border-border pb-2 mb-3">
                حسابات مدينة
              </p>
              <label className="text-sm font-medium text-foreground">حساب الإيراد</label>
              <input
                value={form.income_account}
                onChange={(e) => set("income_account", e.target.value)}
                placeholder="اختر حساب..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase border-b border-border pb-2 mb-3">
                حسابات دائنة
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">حساب المصروف</label>
                  <input
                    value={form.expense_account}
                    onChange={(e) => set("expense_account", e.target.value)}
                    placeholder="اختر حساب..."
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">نوع الأصل</label>
                  <input
                    value={form.asset_type}
                    onChange={(e) => set("asset_type", e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [view, setView] = useState("list"); // "list" | "form"
  const [editing, setEditing] = useState(null);

  const openNew = () => { setEditing(null); setView("form"); };
  const openEdit = (p) => { setEditing(p); setView("form"); };
  const closeForm = () => { setEditing(null); setView("list"); };

  const handleSave = (form) => {
    if (form.id) {
      setProducts((ps) => ps.map((p) => (p.id === form.id ? form : p)));
    } else {
      setProducts((ps) => [...ps, { ...form, id: Date.now() }]);
    }
    closeForm();
  };

  if (view === "form") {
    return <ProductForm product={editing} onSave={handleSave} onDiscard={closeForm} />;
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" /> المنتجات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة منتجات المبيعات والمشتريات والمصروفات</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> منتج جديد
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["الرقم المرجعي", "الاسم", "سعر البيع", "ضريبة المبيعات", "ضريبة المشتريات"].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد منتجات</td></tr>
            ) : products.map((p) => (
              <tr
                key={p.id}
                onClick={() => openEdit(p)}
                className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.reference || "—"}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 font-semibold">{fmt(p.sales_price)}</td>
                <td className="px-4 py-3"><TaxChip value={p.sales_tax} /></td>
                <td className="px-4 py-3"><TaxChip value={p.purchase_tax} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}