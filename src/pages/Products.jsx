import { useState, useEffect } from "react";
import { Package, Plus, X, Save } from "lucide-react";
import { getProducts, createProduct, updateProduct, getTaxes, getAccounts } from "@/api/accountingApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useToast } from "@/components/ui/use-toast";

const fmt = (n) => (n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function TaxChip({ value }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
      {value}
    </span>
  );
}

function ProductForm({ product, taxes, accounts, onSave, onDiscard }) {
  const { toast } = useToast();
  const isEdit = Boolean(product?.id);

  const [form, setForm] = useState({
    name: product?.name || "",
    default_code: product?.default_code || "",
    list_price: product?.list_price ?? 0,
    standard_price: product?.standard_price ?? 0,
    type: product?.type || "service",
    sale_ok: product?.sale_ok ?? true,
    purchase_ok: product?.purchase_ok ?? false,
    can_be_expensed: product?.can_be_expensed ?? false,
    categ_id: product?.categ_id ?? "",
    tax_id: product?.taxes_id?.[0] ?? "",
    supplier_tax_id: product?.supplier_taxes_id?.[0] ?? "",
    property_account_income_id: product?.property_account_income_id || "",
    property_account_expense_id: product?.property_account_expense_id || "",
  });
  const [tab, setTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const saleTaxes = taxes.filter((t) => t.type_tax_use === "sale");
  const purchaseTaxes = taxes.filter((t) => t.type_tax_use === "purchase");
  const activeAccounts = accounts.filter((a) => a.is_active);

  const selectedSaleTax = saleTaxes.find((t) => String(t.id) === String(form.tax_id));
  const priceInclTax = selectedSaleTax ? form.list_price * (1 + (selectedSaleTax.amount || 0) / 100) : form.list_price;

  const handleSave = async () => {
    setError("");
    try {
      setSaving(true);

      const payload = {
        name: form.name,
        default_code: form.default_code || undefined,
        list_price: Number(form.list_price) || 0,
        standard_price: Number(form.standard_price) || 0,
        type: form.type,
        sale_ok: form.sale_ok,
        purchase_ok: form.purchase_ok,
        can_be_expensed: form.can_be_expensed,
        categ_id: form.categ_id ? Number(form.categ_id) : undefined,
        taxes_id: form.tax_id ? [Number(form.tax_id)] : [],
        supplier_taxes_id: form.supplier_tax_id ? [Number(form.supplier_tax_id)] : [],
        property_account_income_id: form.property_account_income_id ? Number(form.property_account_income_id) : undefined,
        property_account_expense_id: form.property_account_expense_id ? Number(form.property_account_expense_id) : undefined,
      };

      if (isEdit) {
        await updateProduct(product.id, payload);
      } else {
        await createProduct(payload);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ المنتج:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ المنتج، حاول تاني."));
      toast({
        title: "تعذّر حفظ المنتج",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumb + Save/Discard */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">المنتجات</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-foreground">{isEdit ? form.name : "جديد"}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving || !form.name} className="p-2 rounded-lg text-primary hover:bg-primary/10 disabled:opacity-50" title="حفظ">
            <Save className="w-4 h-4" />
          </button>
          <button onClick={onDiscard} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" title="إلغاء">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form body */}
      <div className="bg-card p-6 space-y-5">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>
        )}

        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-1">اسم المنتج *</p>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="مثال: خدمة استشارية"
            className="w-full text-xl border-0 border-b border-border focus:outline-none focus:border-primary bg-transparent py-1"
          />
          <div className="flex items-center gap-5 text-sm mt-3">
            {[
              ["sale_ok", "مبيعات"],
              ["purchase_ok", "مشتريات"],
              ["can_be_expensed", "يمكن أن يُصرف كمصروف"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="accent-primary" />
                {label}
              </label>
            ))}
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
                  ["consu", "سلعة"],
                  ["service", "خدمة"],
                ].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" checked={form.type === val} onChange={() => set("type", val)} className="accent-primary" />
                    {label}
                  </label>
                ))}
              </div>

              <div className="mt-4 space-y-1.5">
                <label className="text-sm font-medium text-foreground">الرقم المرجعي</label>
                <input
                  value={form.default_code}
                  onChange={(e) => set("default_code", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                />
              </div>

              <div className="mt-4 space-y-1.5">
                <label className="text-sm font-medium text-foreground">رقم التصنيف (Category ID)</label>
                <input
                  type="number" dir="ltr"
                  value={form.categ_id}
                  onChange={(e) => set("categ_id", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">سعر البيع</label>
                <input
                  type="number"
                  value={form.list_price}
                  onChange={(e) => set("list_price", +e.target.value)}
                  className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">ضريبة المبيعات</label>
                <div className="flex items-center gap-3 mt-1">
                  <select value={form.tax_id} onChange={(e) => set("tax_id", e.target.value)}
                    className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                    <option value="">بدون</option>
                    {saleTaxes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  {selectedSaleTax && (
                    <span className="text-xs text-muted-foreground">(= {fmt(priceInclTax)} شامل الضريبة)</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">التكلفة</label>
                <input
                  type="number"
                  value={form.standard_price}
                  onChange={(e) => set("standard_price", +e.target.value)}
                  className="w-32 px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">ضريبة المشتريات</label>
                <select value={form.supplier_tax_id} onChange={(e) => set("supplier_tax_id", e.target.value)}
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1">
                  <option value="">بدون</option>
                  {purchaseTaxes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-4 pt-2">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase border-b border-border pb-2 mb-3">حسابات مدينة</p>
              <label className="text-sm font-medium text-foreground">حساب الإيراد</label>
              <select value={form.property_account_income_id} onChange={(e) => set("property_account_income_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1">
                <option value="">بدون</option>
                {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase border-b border-border pb-2 mb-3">حسابات دائنة</p>
              <label className="text-sm font-medium text-foreground">حساب المصروف</label>
              <select value={form.property_account_expense_id} onChange={(e) => set("property_account_expense_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none mt-1">
                <option value="">بدون</option>
                {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.account_code} — {a.account_name}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Products() {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "form"
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      // الصفحة دي مشتركة بين تبويب "العملاء" و"الموردين" (نفس الكومبوننت في
      // AccountingMain.jsx)، فبنجيب منتجات المبيعات والمشتريات مع بعض
      // ونستبعد التكرار (منتج ممكن يكون sale_ok و purchase_ok مع بعض)
      const [saleProds, purchaseProds, taxesRes, accs] = await Promise.all([
        getProducts("sale"),
        getProducts("purchase").catch(() => []),
        getTaxes().catch(() => []),
        getAccounts().catch(() => []),
      ]);
      const byId = new Map();
      [...saleProds, ...purchaseProds].forEach((p) => byId.set(p.id, p));
      setProducts([...byId.values()]);
      setTaxes(taxesRes);
      setAccounts(
        (accs || []).map((item) => ({
          id: item.id,
          account_code: item.code ?? item.account_code,
          account_name: item.name_ar ?? item.account_name,
          is_active: item.active ?? item.is_active,
        }))
      );
    } catch (err) {
      console.error("خطأ أثناء تحميل المنتجات:", err);
      toast({
        title: "تعذّر تحميل المنتجات",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setView("form"); };
  const openEdit = (p) => { setEditing(p); setView("form"); };
  const closeForm = () => { setEditing(null); setView("list"); };

  if (view === "form") {
    return (
      <ProductForm
        product={editing}
        taxes={taxes}
        accounts={accounts}
        onSave={() => { closeForm(); load(); }}
        onDiscard={closeForm}
      />
    );
  }

  const taxNameById = (id) => taxes.find((t) => t.id === id)?.name;

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
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد منتجات</td></tr>
            ) : products.map((p) => (
              <tr
                key={p.id}
                onClick={() => openEdit(p)}
                className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
              >
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.default_code || "—"}</td>
                <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                <td className="px-4 py-3 font-semibold">{fmt(p.list_price)}</td>
                <td className="px-4 py-3"><TaxChip value={taxNameById(p.taxes_id?.[0])} /></td>
                <td className="px-4 py-3"><TaxChip value={taxNameById(p.supplier_taxes_id?.[0])} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
