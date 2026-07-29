import { useState } from "react";
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

// ===== Mock Data =====
const MOCK_CUSTOMERS = [
  {
    id: 1,
    name: "Acme Corp",
    email: "contact@acme.com",
    phone: "+123456789",
    mobile: "+198765432",
    website: "https://acme.com",
    vat: "US123456789",
    street: "123 Business Rd",
    street2: "",
    city: "Metropolis",
    zip: "12345",
    state: "California",
    country: "United States",
    company: true,
    type: "customer",
    lang: "English",
    tags: ["VIP", "Retail"],
    balance: 1250,
  },
  {
    id: 2,
    name: "Ahmed Mohamed",
    email: "ahmed@gmail.com",
    phone: "01000000000",
    mobile: "01000000001",
    website: "",
    vat: "",
    street: "Nasr City",
    street2: "",
    city: "Cairo",
    zip: "11865",
    state: "Cairo",
    country: "Egypt",
    company: false,
    type: "customer",
    lang: "Arabic",
    tags: ["Customer"],
    balance: 300,
  },
];

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
  state: "",
  country: "",
  company: false,
  type: "customer",
  lang: "Arabic",
  tags: [],
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

function CustomerForm({
  customer,
  onBack,
  onSave,
}) {
  const [form, setForm] = useState(customer || emptyCustomer);

  const change = (key, value) =>
    setForm({
      ...form,
      [key]: value,
    });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">

      {/* Breadcrumb */}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">

        <button
          onClick={onBack}
          className="flex items-center gap-1 hover:text-foreground"
        >
          <ArrowRight className="w-4 h-4" />
          العملاء
        </button>

        <span>/</span>

        <span className="text-foreground font-medium">
          {customer ? customer.name : "عميل جديد"}
        </span>

      </div>

      {/* Header */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-3xl font-bold">
            {customer ? customer.name : "إنشاء عميل"}
          </h1>

          <p className="text-muted-foreground mt-1">
            بيانات العميل الأساسية
          </p>

        </div>

        <button
          onClick={() => onSave(form)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          حفظ
        </button>

      </div>

      {/* Card */}

      <div className="bg-card border rounded-2xl p-6">

        <div className="grid md:grid-cols-2 gap-5">

          <div>

            <label className="text-sm mb-1 block">
              الاسم
            </label>

            <input
              value={form.name}
              onChange={(e)=>change("name",e.target.value)}
              className="w-full border rounded-lg p-2"
            />

          </div>

          <div>

            <label className="text-sm mb-1 block">
              البريد الإلكتروني
            </label>

            <input
              value={form.email}
              onChange={(e)=>change("email",e.target.value)}
              className="w-full border rounded-lg p-2"
            />

          </div>

          <div>

            <label className="text-sm mb-1 block">
              الهاتف
            </label>

            <input
              value={form.phone}
              onChange={(e)=>change("phone",e.target.value)}
              className="w-full border rounded-lg p-2"
            />

          </div>

          <div>

            <label className="text-sm mb-1 block">
              الموبايل
            </label>

            <input
              value={form.mobile}
              onChange={(e)=>change("mobile",e.target.value)}
              className="w-full border rounded-lg p-2"
            />

          </div>
                    <div>
            <label className="text-sm mb-1 block">
              الموقع الإلكتروني
            </label>

            <input
              value={form.website}
              onChange={(e) => change("website", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              الرقم الضريبي
            </label>

            <input
              value={form.vat}
              onChange={(e) => change("vat", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              الشارع
            </label>

            <input
              value={form.street}
              onChange={(e) => change("street", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              شارع 2
            </label>

            <input
              value={form.street2}
              onChange={(e) => change("street2", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              المدينة
            </label>

            <input
              value={form.city}
              onChange={(e) => change("city", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              المحافظة
            </label>

            <input
              value={form.state}
              onChange={(e) => change("state", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              الرمز البريدي
            </label>

            <input
              value={form.zip}
              onChange={(e) => change("zip", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              الدولة
            </label>

            <input
              value={form.country}
              onChange={(e) => change("country", e.target.value)}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="text-sm mb-1 block">
              اللغة
            </label>

            <select
              value={form.lang}
              onChange={(e) => change("lang", e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option>Arabic</option>
              <option>English</option>
            </select>
          </div>

          <div className="flex items-center gap-3 mt-6">

            <input
              type="checkbox"
              checked={form.company}
              onChange={(e) =>
                change("company", e.target.checked)
              }
            />

            <span>شركة</span>

          </div>

        </div>
      </div>

      {customer && (
        <div className="bg-card border rounded-2xl p-6">

          <h3 className="font-bold text-lg mb-5">
            معلومات إضافية
          </h3>

          <div className="grid md:grid-cols-3 gap-5">

            <InfoField
              label="البريد الإلكتروني"
              value={customer.email}
              icon={Mail}
            />

            <InfoField
              label="الهاتف"
              value={customer.phone}
              icon={Phone}
            />

            <InfoField
              label="الموقع"
              value={customer.website}
              icon={Globe}
            />

            <InfoField
              label="العنوان"
              value={customer.street}
              icon={MapPin}
            />

            <InfoField
              label="الرقم الضريبي"
              value={customer.vat}
              icon={BadgeInfo}
            />

            <InfoField
              label="الرصيد"
              value={`ر.س ${customer.balance}`}
              icon={Building2}
            />

          </div>

        </div>
      )}

    </div>
  );
}
export default function Customers() {

  const [customers, setCustomers] = useState(MOCK_CUSTOMERS);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const saveCustomer = (customer) => {

    if (selected) {

      setCustomers((prev) =>
        prev.map((c) =>
          c.id === selected.id ? { ...selected, ...customer } : c
        )
      );

      setSelected(null);

    } else {

      setCustomers((prev) => [
        ...prev,
        {
          ...customer,
          id: Date.now(),
          balance: 0,
        },
      ]);

      setCreating(false);
    }
  };

  if (selected) {
    return (
      <CustomerForm
        customer={selected}
        onBack={() => setSelected(null)}
        onSave={saveCustomer}
      />
    );
  }

  if (creating) {
    return (
      <CustomerForm
        customer={null}
        onBack={() => setCreating(false)}
        onSave={saveCustomer}
      />
    );
  }

  return (

    <div
      className="p-6 max-w-6xl mx-auto space-y-5"
      dir="rtl"
    >

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold flex items-center gap-2">

            <Users className="w-6 h-6 text-primary"/>

            العملاء

          </h1>

          <p className="text-muted-foreground mt-1">

            إدارة العملاء

          </p>

        </div>

        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center gap-2"
        >

          <Plus className="w-4 h-4"/>

          عميل جديد

        </button>

      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

        {customers.map((customer)=>(          <div
            key={customer.id}
            onClick={()=>setSelected(customer)}
            className="bg-card border rounded-2xl p-5 cursor-pointer hover:border-primary transition-all hover:shadow-lg"
          >

            <div className="flex justify-between items-center mb-5">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">

                  {customer.company ? (
                    <Building2 className="w-6 h-6 text-primary"/>
                  ) : (
                    <User className="w-6 h-6 text-primary"/>
                  )}

                </div>

                <div>

                  <h3 className="font-bold">
                    {customer.name}
                  </h3>

                  <p className="text-xs text-muted-foreground">
                    {customer.company ? "شركة" : "فرد"}
                  </p>

                </div>

              </div>

              <Pencil className="w-4 h-4 text-muted-foreground"/>

            </div>

            <div className="space-y-3 text-sm">

              <div className="flex items-center gap-2">

                <Mail className="w-4 h-4 text-primary"/>

                <span>{customer.email || "—"}</span>

              </div>

              <div className="flex items-center gap-2">

                <Phone className="w-4 h-4 text-primary"/>

                <span>{customer.phone || "—"}</span>

              </div>

              <div className="flex items-center gap-2">

                <MapPin className="w-4 h-4 text-primary"/>

                <span>{customer.city}</span>

              </div>

              <div className="flex items-center justify-between pt-4 border-t">

                <span className="text-muted-foreground">
                  الرصيد
                </span>

                <span className="font-bold text-primary">
                ر.س {customer.balance}
                </span>

              </div>

            </div>

          </div>

        ))}

      </div>

    </div>

  );

}