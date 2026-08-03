import { useState, useEffect } from "react";
import {
  Users,
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
} from "lucide-react";
import { getCustomers, getCustomerById, createCustomer, updateCustomer } from "@/api/accountingApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useToast } from "@/components/ui/use-toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[\d\s-]{7,20}$/;
const URL_REGEX = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i;

const emptyCustomer = {
  name: "",
  email: "",
  phone: "",
  mobile: "",
  website: "",
  vat: "",
  street: "",
  street2: "",
  city: "",
  zip: "",
  country_id: "",
  company: false,
};

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

function CustomerForm({ customer, onBack, onSave }) {
  const { toast } = useToast();
  const [form, setForm] = useState(
    customer
      ? {
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          mobile: customer.mobile || "",
          website: customer.website || "",
          vat: customer.vat || "",
          street: customer.street || "",
          street2: customer.street2 || "",
          city: customer.city || "",
          zip: customer.zip || "",
          country_id: customer.country_id || "",
          company: Boolean(customer.is_company),
        }
      : emptyCustomer
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const change = (key, value) => setForm({ ...form, [key]: value });

  const validateForm = () => {
    const newErrors = {};

    if (!form.name?.trim()) {
      newErrors.name = "اسم العميل مطلوب";
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
    setError("");
    if (!validateForm()) return;
    try {
      setSaving(true);

      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        mobile: form.mobile,
        website: form.website,
        vat: form.vat,
        street: form.street,
        street2: form.street2,
        city: form.city,
        zip: form.zip,
        country_id: form.country_id ? Number(form.country_id) : undefined,
        is_company: form.company,
        type: "customer",
      };

      if (customer?.id) {
        await updateCustomer(customer.id, payload);
      } else {
        await createCustomer(payload);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ العميل:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ العميل، حاول تاني."));
      toast({
        title: "تعذّر حفظ العميل",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground">
          <ArrowRight className="w-4 h-4" />
          العملاء
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{customer ? customer.name : "عميل جديد"}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{customer ? customer.name : "إنشاء عميل"}</h1>
          <p className="text-muted-foreground mt-1">بيانات العميل الأساسية</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !form.name}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "جاري الحفظ..." : "حفظ"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Card */}
      <div className="bg-card border rounded-2xl p-6">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="text-sm mb-1 block">الاسم *</label>
            <input value={form.name} onChange={(e) => change("name", e.target.value)}
              className={`w-full border rounded-lg p-2 ${errors.name ? "border-red-400" : ""}`} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-sm mb-1 block">البريد الإلكتروني</label>
            <input value={form.email} onChange={(e) => change("email", e.target.value)} dir="ltr"
              className={`w-full border rounded-lg p-2 ${errors.email ? "border-red-400" : ""}`} />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm mb-1 block">الهاتف</label>
            <input value={form.phone} onChange={(e) => change("phone", e.target.value)} dir="ltr"
              className={`w-full border rounded-lg p-2 ${errors.phone ? "border-red-400" : ""}`} />
            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-sm mb-1 block">الموبايل</label>
            <input value={form.mobile} onChange={(e) => change("mobile", e.target.value)} dir="ltr"
              className={`w-full border rounded-lg p-2 ${errors.mobile ? "border-red-400" : ""}`} />
            {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <label className="text-sm mb-1 block">الموقع الإلكتروني</label>
            <input value={form.website} onChange={(e) => change("website", e.target.value)} dir="ltr"
              className={`w-full border rounded-lg p-2 ${errors.website ? "border-red-400" : ""}`} />
            {errors.website && <p className="text-xs text-red-600 mt-1">{errors.website}</p>}
          </div>

          <div>
            <label className="text-sm mb-1 block">الرقم الضريبي</label>
            <input value={form.vat} onChange={(e) => change("vat", e.target.value)} className="w-full border rounded-lg p-2" />
          </div>

          <div>
            <label className="text-sm mb-1 block">الشارع</label>
            <input value={form.street} onChange={(e) => change("street", e.target.value)} className="w-full border rounded-lg p-2" />
          </div>

          <div>
            <label className="text-sm mb-1 block">شارع 2</label>
            <input value={form.street2} onChange={(e) => change("street2", e.target.value)} className="w-full border rounded-lg p-2" />
          </div>

          <div>
            <label className="text-sm mb-1 block">المدينة</label>
            <input value={form.city} onChange={(e) => change("city", e.target.value)} className="w-full border rounded-lg p-2" />
          </div>

          <div>
            <label className="text-sm mb-1 block">الرمز البريدي</label>
            <input value={form.zip} onChange={(e) => change("zip", e.target.value)} className="w-full border rounded-lg p-2" />
          </div>

          <div>
            <label className="text-sm mb-1 block">رقم الدولة (Country ID)</label>
            <input type="number" dir="ltr" value={form.country_id} onChange={(e) => change("country_id", e.target.value)}
              className={`w-full border rounded-lg p-2 ${errors.country_id ? "border-red-400" : ""}`} />
            {errors.country_id && <p className="text-xs text-red-600 mt-1">{errors.country_id}</p>}
          </div>

          <div className="flex items-center gap-3 mt-6">
            <input type="checkbox" checked={form.company} onChange={(e) => change("company", e.target.checked)} />
            <span>شركة</span>
          </div>
        </div>
      </div>

      {customer && (
        <div className="bg-card border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-5">معلومات إضافية</h3>

          <div className="grid md:grid-cols-3 gap-5">
            <InfoField label="البريد الإلكتروني" value={customer.email} icon={Mail} />
            <InfoField label="الهاتف" value={customer.phone} icon={Phone} />
            <InfoField label="الموقع" value={customer.website} icon={Globe} />
            <InfoField label="العنوان" value={customer.street} icon={MapPin} />
            <InfoField label="الرقم الضريبي" value={customer.vat} icon={BadgeInfo} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Customers() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("خطأ أثناء تحميل العملاء:", err);
      toast({
        title: "تعذّر تحميل العملاء",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = async (customer) => {
    try {
      const full = await getCustomerById(customer.id);
      setSelected(full || customer);
    } catch (err) {
      console.error("خطأ أثناء تحميل بيانات العميل:", err);
      setSelected(customer);
    }
  };

  if (selected) {
    return (
      <CustomerForm
        customer={selected}
        onBack={() => setSelected(null)}
        onSave={() => { setSelected(null); load(); }}
      />
    );
  }

  if (creating) {
    return (
      <CustomerForm
        customer={null}
        onBack={() => setCreating(false)}
        onSave={() => { setCreating(false); load(); }}
      />
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            العملاء
          </h1>
          <p className="text-muted-foreground mt-1">إدارة العملاء</p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          عميل جديد
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">لا يوجد عملاء بعد — ابدأ بإضافة عميل جديد</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => openEdit(customer)}
              className="bg-card border rounded-2xl p-5 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {customer.is_company ? (
                      <Building2 className="w-6 h-6 text-primary" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold">{customer.name}</h3>
                    <p className="text-xs text-muted-foreground">{customer.is_company ? "شركة" : "فرد"}</p>
                  </div>
                </div>
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <span>{customer.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <span>{customer.phone || "—"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{customer.city || "—"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
