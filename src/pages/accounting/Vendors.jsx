// src/components/accounting/Vendors.jsx
import { useState, useEffect } from "react";
import {
  Truck,
  Plus,
  ArrowRight,
  Building2,
  User,
  Save,
  Pencil,
  Globe,
  Phone,
  Mail,
  MapPin,
  BadgeInfo,
  Camera,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";

import {
  getVendors,
  createVendor,
  updatePartner,
  deletePartner,
} from "../../api/partnersApi";
import { extractErrorMessage } from "../../utils/errorUtils";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s-]{7,20}$/;
const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;

const emptyVendor = {
  name: "",
  is_company: true,
  street: "",
  street2: "",
  city: "",
  zip: "",
  state_id: "",
  country_id: "",
  vat: "",
  phone: "",
  mobile: "",
  email: "",
  website: "",
};

// const TABS = [
//   { id: "contacts", label: "جهات الاتصال والعناوين" },
//   { id: "sales_purchase", label: "المبيعات والمشتريات" },
//   { id: "payment_followup", label: "متابعة الدفع" },
//   { id: "accounting", label: "المحاسبة" },
//   { id: "notes", label: "ملاحظات داخلية" },
//   { id: "assignment", label: "تخصيص الشريك" },
// ];

function InfoField({ label, value, icon }) {
  const Icon = icon;
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <p className="text-sm font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

/* ========================================================================
   فورم إنشاء / تعديل مورد
   ======================================================================== */
function VendorForm({ vendor, onBack, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(
    vendor
      ? {
          name: vendor.name || "",
          is_company: !!vendor.is_company,
          street: vendor.street || "",
          street2: vendor.street2 || "",
          city: vendor.city || "",
          zip: vendor.zip || "",
          state_id: vendor.state_id || "",
          country_id: vendor.country_id || "",
          vat: vendor.vat || "",
          phone: vendor.phone || "",
          mobile: vendor.mobile || "",
          email: vendor.email || "",
          website: vendor.website || "",
        }
      : emptyVendor
  );
  const [tab, setTab] = useState("contacts");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});

  const change = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validateForm = () => {
    const newErrors = {};

    if (!form.name?.trim()) {
      newErrors.name = "اسم المورد مطلوب";
    }

    if (form.email && !EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }

    if (form.phone && !PHONE_REGEX.test(form.phone.trim())) {
      newErrors.phone = "رقم الهاتف غير صحيح";
    }

    if (form.mobile && !PHONE_REGEX.test(form.mobile.trim())) {
      newErrors.mobile = "رقم الموبايل غير صحيح";
    }

    if (form.website && !URL_REGEX.test(form.website.trim())) {
      newErrors.website = "رابط الموقع الإلكتروني غير صحيح";
    }

    if (form.country_id !== "" && (Number(form.country_id) <= 0 || !Number.isInteger(Number(form.country_id)))) {
      newErrors.country_id = "رقم الدولة يجب أن يكون رقمًا صحيحًا أكبر من صفر";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    setError(null);
    if (!validateForm()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        country_id: form.country_id ? Number(form.country_id) : undefined,
        state_id: form.state_id ? Number(form.state_id) : undefined,
      };

      if (vendor) {
        await updatePartner(vendor.id, payload);
      } else {
        await createVendor(payload);
      }
      onSaved();
    } catch (err) {
      console.error("خطأ أثناء حفظ المورد:", err);
      setError(extractErrorMessage(err, "حدث خطأ أثناء حفظ بيانات المورد"));
      toast({
        title: "تعذّر حفظ المورد",
        description: extractErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6 pb-0">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="w-4 h-4" />
          الموردين
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">
          {vendor ? vendor.name : "مورد جديد"}
        </span>
      </div>

      {/* Top bar: Save */}
      <div className="flex justify-between items-center px-6 pt-4 pb-2 flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>

      {/* Card */}
      <div className="bg-card border-t border-border p-6">
        {/* Individual / Company toggle */}
        <div className="flex items-center gap-6 mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              checked={!form.is_company}
              onChange={() => change("is_company", false)}
              className="accent-primary"
            />
            فرد
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              checked={form.is_company}
              onChange={() => change("is_company", true)}
              className="accent-primary"
            />
            شركة
          </label>
        </div>

        <div className="flex justify-between items-start gap-6 mb-6">
          <div className="flex-1">
            <input
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
              placeholder="مثال: شركة الأخشاب المتحدة"
              className={`w-full text-2xl font-medium border-0 border-b focus:outline-none pb-2 bg-transparent placeholder:text-muted-foreground/50 ${errors.name ? "border-red-400" : "border-border focus:border-primary"}`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground shrink-0">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
          {/* يمين: العنوان */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">العنوان</label>
              <input
                value={form.street}
                onChange={(e) => change("street", e.target.value)}
                placeholder="الشارع..."
                className="w-full border border-border rounded-lg p-2 text-sm mb-2 placeholder:text-muted-foreground"
              />
              <input
                value={form.street2}
                onChange={(e) => change("street2", e.target.value)}
                placeholder="شارع 2..."
                className="w-full border border-border rounded-lg p-2 text-sm mb-2 placeholder:text-muted-foreground"
              />
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  value={form.city}
                  onChange={(e) => change("city", e.target.value)}
                  placeholder="المدينة"
                  className="border border-border rounded-lg p-2 text-sm placeholder:text-muted-foreground"
                />
                <input
                  type="number"
                  value={form.state_id}
                  onChange={(e) => change("state_id", e.target.value)}
                  placeholder="رقم المنطقة"
                  className="border border-border rounded-lg p-2 text-sm placeholder:text-muted-foreground"
                />
                <input
                  value={form.zip}
                  onChange={(e) => change("zip", e.target.value)}
                  placeholder="الرمز البريدي"
                  className="border border-border rounded-lg p-2 text-sm placeholder:text-muted-foreground"
                />
              </div>
              <input
                type="number"
                value={form.country_id}
                onChange={(e) => change("country_id", e.target.value)}
                placeholder="رقم الدولة (country_id)"
                className={`w-full border rounded-lg p-2 text-sm placeholder:text-muted-foreground ${errors.country_id ? "border-red-400" : "border-border"}`}
              />
              {errors.country_id && <p className="text-xs text-red-600 mt-1">{errors.country_id}</p>}
              <p className="text-[11px] text-muted-foreground mt-1">
                * لسه محتاجين endpoint لجلب قائمة الدول عشان نستبدلها بـ select صحيح
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                الرقم الضريبي <span className="text-muted-foreground text-xs">؟</span>
              </label>
              <input
                value={form.vat}
                onChange={(e) => change("vat", e.target.value)}
                placeholder="/ إن لم يكن قابلاً للتطبيق"
                className="w-full border border-border rounded-lg p-2 text-sm placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* شمال: بيانات التواصل */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">الهاتف</label>
              <input
                value={form.phone}
                onChange={(e) => change("phone", e.target.value)}
                dir="ltr"
                className={`w-full border rounded-lg p-2 text-sm ${errors.phone ? "border-red-400" : "border-border"}`}
              />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الموبايل</label>
              <input
                value={form.mobile}
                onChange={(e) => change("mobile", e.target.value)}
                dir="ltr"
                className={`w-full border rounded-lg p-2 text-sm ${errors.mobile ? "border-red-400" : "border-border"}`}
              />
              {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
              <input
                value={form.email}
                onChange={(e) => change("email", e.target.value)}
                dir="ltr"
                className={`w-full border rounded-lg p-2 text-sm ${errors.email ? "border-red-400" : "border-border"}`}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الموقع الإلكتروني</label>
              <input
                value={form.website}
                onChange={(e) => change("website", e.target.value)}
                dir="ltr"
                placeholder="e.g. https://www.example.com"
                className={`w-full border rounded-lg p-2 text-sm placeholder:text-muted-foreground ${errors.website ? "border-red-400" : "border-border"}`}
              />
              {errors.website && <p className="text-xs text-red-600 mt-1">{errors.website}</p>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        {/* <div className="flex gap-1 border-b border-border mt-8 mb-4 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div> */}

        {/* <div className="py-6 text-sm text-muted-foreground text-center">
          {tab === "contacts" && "لا توجد جهات اتصال أو عناوين إضافية بعد"}
          {tab === "sales_purchase" && "إعدادات المبيعات والمشتريات الخاصة بالمورد"}
          {tab === "payment_followup" && "سجل متابعة الدفعات"}
          {tab === "accounting" && "الحسابات والدفتر المرتبط بالمورد"}
          {tab === "notes" && "لا توجد ملاحظات داخلية"}
          {tab === "assignment" && "تخصيص مسؤول المتابعة لهذا المورد"}
        </div> */}
      </div>

      {/* معلومات إضافية (وضع العرض فقط) */}
      {vendor && (
        <div className="bg-card border border-border rounded-2xl p-6 m-6 mt-4">
          <h3 className="font-bold text-lg mb-5">معلومات إضافية</h3>
          <div className="grid md:grid-cols-3 gap-5">
            <InfoField label="البريد الإلكتروني" value={vendor.email} icon={Mail} />
            <InfoField label="الهاتف" value={vendor.phone} icon={Phone} />
            <InfoField label="الموقع" value={vendor.website} icon={Globe} />
            <InfoField label="العنوان" value={vendor.street} icon={MapPin} />
            <InfoField label="الرقم الضريبي" value={vendor.vat} icon={BadgeInfo} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================
   الصفحة الرئيسية
   ======================================================================== */
export default function Vendors() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVendors();
      setVendors(data);
    } catch (err) {
      setError(extractErrorMessage(err, "تعذر تحميل قائمة الموردين"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSaved = () => {
    setSelected(null);
    setCreating(false);
    loadVendors();
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const ok = await confirmDialog({ title: "حذف المورد", message: "متأكد من حذف هذا المورد؟", confirmText: "حذف", variant: "destructive" });
    if (!ok) return;
    setDeletingId(id);
    try {
      await deletePartner(id);
      toast({ title: "تم حذف المورد" });
      loadVendors();
    } catch (err) {
      toast({ title: "تعذّر حذف المورد", description: extractErrorMessage(err), variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  if (selected) {
    return <VendorForm vendor={selected} onBack={() => setSelected(null)} onSaved={handleSaved} />;
  }

  if (creating) {
    return <VendorForm vendor={null} onBack={() => setCreating(false)} onSaved={handleSaved} />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6 text-primary" />
            الموردين
          </h1>
          <p className="text-muted-foreground mt-1">إدارة الموردين</p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          مورد جديد
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          جاري تحميل الموردين...
        </div>
      )}

      {!loading && error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={loadVendors} className="underline mr-auto">إعادة المحاولة</button>
        </div>
      )}

      {!loading && !error && vendors.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          لا يوجد موردين حتى الآن
        </div>
      )}

      {!loading && !error && vendors.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              onClick={() => setSelected(vendor)}
              className="bg-card border rounded-2xl p-5 cursor-pointer hover:border-primary transition-all hover:shadow-lg relative"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {vendor.is_company ? (
                      <Building2 className="w-6 h-6 text-primary" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">{vendor.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {vendor.is_company ? "شركة" : "فرد"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleDelete(e, vendor.id)}
                    disabled={deletingId === vendor.id}
                    className="text-muted-foreground hover:text-red-600 p-1"
                    title="حذف"
                  >
                    {deletingId === vendor.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{vendor.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{vendor.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{vendor.city || "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}