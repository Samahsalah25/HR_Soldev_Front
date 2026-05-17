import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Warehouse, Eye, EyeOff, User, Building2, Upload } from "lucide-react";
import { setCustomerSession, simpleHash } from "../lib/customerAuth";

export default function CustomerLogin() {
  const [mode, setMode] = useState("login"); // login | register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Register state
  const [reg, setReg] = useState({
    customer_type: "فرد",
    full_name: "", phone: "", email: "", password: "", confirm_password: "",
    id_number: "", birth_date: "", storage_type: "", contract_months: 1,
    company_name: "", company_rep: "", commercial_reg: "", tax_number: "",
    id_image_url: "", commercial_reg_url: "",
  });
  const setR = (k, v) => setReg(r => ({ ...r, [k]: v }));

  const redirectAfterLogin = () => {
    const next = new URLSearchParams(window.location.search).get("next") || "/my-account";
    window.location.href = next;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const allCustomers = await base44.entities.StorageCustomer.list();
      const customers = allCustomers.filter(c => c.email === loginEmail);
      const customer = customers.find(c => c.password_hash === simpleHash(loginPass));
      if (customers.length === 0) { setError("لا يوجد حساب بهذا البريد، يرجى إنشاء حساب جديد من تبويب (إنشاء حساب جديد)"); setLoading(false); return; }
      if (!customer) { setError("كلمة المرور غير صحيحة"); setLoading(false); return; }
      setCustomerSession(customer);
      redirectAfterLogin();
    } catch (err) {
      console.error("Register error:", err);
      setError("حدث خطأ: " + (err?.message || err?.error || JSON.stringify(err)));
      setLoading(false);
    }
  };

  const handleUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setR(field, "uploading");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setR(field, file_url);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (reg.password !== reg.confirm_password) { setError("كلمات المرور غير متطابقة"); setLoading(false); return; }
      if (reg.password.length < 6) { setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); setLoading(false); return; }
      const allCustomers = await base44.entities.StorageCustomer.list();
      const existing = allCustomers.filter(c => c.email === reg.email);
      if (existing.length > 0) { setError("البريد الإلكتروني مسجل مسبقاً، سجل دخولك"); setLoading(false); return; }
      const { confirm_password, password, ...rest } = reg;
      // Remove empty string values to avoid API validation errors
      const cleanData = Object.fromEntries(
        Object.entries(rest).filter(([_, v]) => v !== "" && v !== null && v !== undefined)
      );
      const customer = await base44.entities.StorageCustomer.create({
        ...cleanData,
        password_hash: simpleHash(password),
      });
      setCustomerSession(customer);
      redirectAfterLogin();
    } catch (err) {
      console.error("Register error:", err);
      setError("حدث خطأ: " + (err?.message || err?.error || JSON.stringify(err)));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <a href="/rent" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-gray-900 text-lg leading-none">مخزن</p>
            <p className="text-xs text-primary font-medium">Self Storage</p>
          </div>
        </a>
        <a href="/rent" className="text-sm text-muted-foreground hover:text-primary transition-colors">← العودة للموقع</a>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[["login","تسجيل الدخول"],["register","إنشاء حساب جديد"]].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-4 text-sm font-bold transition-colors ${mode === m ? "text-primary border-b-2 border-primary" : "text-gray-400 hover:text-gray-600"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 text-center">{error}</div>}

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
                  <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
                    placeholder="example@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={loginPass} onChange={e => setLoginPass(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute left-3 top-3.5 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {loading ? "جاري الدخول..." : "تسجيل الدخول"}
                </button>
                <p className="text-center text-sm text-gray-500">ليس لديك حساب؟{" "}
                  <button type="button" onClick={() => setMode("register")} className="text-primary font-bold hover:underline">أنشئ حساباً الآن</button>
                </p>
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-center text-xs text-gray-400">
                    هل أنت موظف؟{" "}
                    <a href="/login-employee" className="text-primary hover:underline font-medium">تسجيل دخول الموظفين</a>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                {/* Customer Type */}
                <div className="grid grid-cols-2 gap-3">
                  {["فرد","شركة"].map(t => (
                    <button key={t} type="button" onClick={() => setR("customer_type", t)}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${reg.customer_type === t ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {t === "فرد" ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      {t}
                    </button>
                  ))}
                </div>

                {/* Common Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <Field label="الاسم الكامل *" value={reg.full_name} onChange={v => setR("full_name", v)} required />
                  <Field label="رقم الجوال *" value={reg.phone} onChange={v => setR("phone", v)} required />
                  <Field label="البريد الإلكتروني *" type="email" value={reg.email} onChange={v => setR("email", v)} required />
                  <Field label="رقم الهوية / الإقامة *" value={reg.id_number} onChange={v => setR("id_number", v)} required />
                  <Field label="تاريخ الميلاد" type="date" value={reg.birth_date} onChange={v => setR("birth_date", v)} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">نوع المخزون *</label>
                    <input value={reg.storage_type} onChange={e => setR("storage_type", e.target.value)}
                      placeholder="أثاث، بضاعة، أرشيف..."
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>

                {/* Company Fields */}
                {reg.customer_type === "شركة" && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
                    <Field label="اسم الشركة" value={reg.company_name} onChange={v => setR("company_name", v)} />
                    <Field label="اسم المفوض" value={reg.company_rep} onChange={v => setR("company_rep", v)} />
                    <Field label="رقم السجل التجاري" value={reg.commercial_reg} onChange={v => setR("commercial_reg", v)} />
                    <Field label="الرقم الضريبي" value={reg.tax_number} onChange={v => setR("tax_number", v)} />
                  </div>
                )}

                {reg.customer_type === "شركة" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">المرفقات</p>
                    <UploadField label="ملف السجل التجاري" value={reg.commercial_reg_url} onChange={e => handleUpload(e, "commercial_reg_url")} />
                  </div>
                )}

                {/* Password */}
                <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-3">
                  <Field label="كلمة المرور *" type="password" value={reg.password} onChange={v => setR("password", v)} required />
                  <Field label="تأكيد كلمة المرور *" type="password" value={reg.confirm_password} onChange={v => setR("confirm_password", v)} required />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {loading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
                </button>
                <p className="text-center text-sm text-gray-500">لديك حساب؟{" "}
                  <button type="button" onClick={() => setMode("login")} className="text-primary font-bold hover:underline">سجل دخولك</button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} placeholder={placeholder}
        className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary" />
    </div>
  );
}

function UploadField({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
      <Upload className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700">{label}</p>
        {value && value !== "uploading" && <p className="text-xs text-green-600 truncate">✅ تم الرفع</p>}
        {value === "uploading" && <p className="text-xs text-primary">جاري الرفع...</p>}
      </div>
      <label className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium cursor-pointer hover:bg-primary/90">
        اختر ملف
        <input type="file" className="hidden" accept="image/*,.pdf" onChange={onChange} />
      </label>
    </div>
  );
}