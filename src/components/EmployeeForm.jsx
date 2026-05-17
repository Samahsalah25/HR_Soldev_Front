import { useState, useEffect } from "react";
import { X, Save, User, Briefcase, DollarSign, FileText, Plane, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

const NATIONALITIES = ["سعودي","مصري","سوداني","يمني","باكستاني","هندي","فلبيني","إندونيسي","بنغلاديشي","نيبالي","إثيوبي","أردني","فلسطيني","سوري","لبناني","عراقي","كويتي","إماراتي","بحريني","قطري","عُماني","تونسي","جزائري","مغربي","ليبي","أمريكي","بريطاني","فرنسي","أخرى"];
function genEmployeeNumber() { return `EMP-${Date.now().toString().slice(-6)}`; }

const tabs = [
  { id: "personal", label: "البيانات الشخصية", icon: User },
  { id: "job", label: "بيانات الوظيفة", icon: Briefcase },
  { id: "salary", label: "الراتب والبدلات", icon: DollarSign },
  { id: "docs", label: "الوثائق والمستندات", icon: FileText },
  { id: "travel", label: "التذاكر والسفر", icon: Plane },
];

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const Input = ({ ...props }) => (
  <input {...props}
    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
);

const Select = ({ children, ...props }) => (
  <select {...props}
    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
    {children}
  </select>
);

import { USER_TYPES } from "./employees/AddEmployeeDropdown";

export default function EmployeeForm({ employee, initialRole, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState("personal");
  const [saving, setSaving] = useState(false);
  const [allEmployees, setAllEmployees] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFiles, setDocFiles] = useState([]);

  useEffect(() => {
    Promise.all([
      base44.entities.Employee.list(),
      base44.entities.Department.list(),
      base44.entities.Branch.list(),
    ]).then(([emps, depts, brs]) => {
      setAllEmployees(emps);
      setAllDepartments(depts);
      setAllBranches(brs);
    });
  }, []);

  const [form, setForm] = useState({
    full_name_ar: "", full_name_en: "", nationality: "سعودي", is_saudi: true,
    id_number: "", id_expiry: "", passport_number: "", passport_expiry: "",
    date_of_birth: "", gender: "ذكر", marital_status: "أعزب", dependents_count: 0,
    phone: "", email: "", employee_number: "", department: "", job_title: "",
    job_grade: "", manager: "", branch: "", cost_center: "", project: "",
    join_date: "", contract_type: "غير محدد المدة", contract_end_date: "",
    basic_salary: 0, housing_allowance: 0, transport_allowance: 0,
    food_allowance: 0, communication_allowance: 0, other_allowances: 0,
    bank_name: "", iban: "", gosi_number: "",
    ticket_entitlement: "سنوياً", ticket_class: "اقتصادية", ticket_destination: "", ticket_value: 0,
    status: "نشط", notes: "",
    user_role: "employee",
    ...(employee || {}),
    is_saudi: employee?.is_saudi ?? true,
    employee_number: employee?.employee_number || genEmployeeNumber(),
    user_role: employee?.user_role || initialRole || "employee",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const autoHousing = () => { if (!form.housing_allowance) set("housing_allowance", Math.round(form.basic_salary * 0.25)); };

  const handleDocUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingDoc(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const newDocs = [...(form.documents || []), file_url];
    set("documents", newDocs);
    setDocFiles(prev => [...prev, { name: file.name, url: file_url }]);
    setUploadingDoc(false);
  };

  const handleSubmit = async () => {
    setSaving(true);
    if (employee?.id) {
      await base44.entities.Employee.update(employee.id, form);
    } else {
      const created = await base44.entities.Employee.create(form);
      // If email provided, invite user and set role
      if (form.email && form.user_role) {
        try {
          await base44.users.inviteUser(form.email, form.user_role === "admin" ? "admin" : "user");
          // Update role after short delay
          setTimeout(async () => {
            try {
              const allUsers = await base44.entities.User.list();
              const newUser = allUsers.find(u => u.email === form.email);
              if (newUser && form.user_role !== "user") {
                await base44.entities.User.update(newUser.id, {
                  role: form.user_role,
                  employee_id: created.id,
                });
              }
            } catch {}
          }, 3000);
        } catch {}
      }
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-foreground">{employee ? "تعديل بيانات الموظف" : "إضافة مستخدم جديد"}</h2>
            {!employee && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                {USER_TYPES.find(t => t.value === form.user_role)?.emoji} {USER_TYPES.find(t => t.value === form.user_role)?.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-border px-6 gap-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "personal" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="الاسم الكامل (عربي) *">
                <Input value={form.full_name_ar} onChange={e => set("full_name_ar", e.target.value)} placeholder="محمد عبدالله الأحمد" />
              </Field>
              <Field label="الاسم الكامل (إنجليزي)">
                <Input value={form.full_name_en} onChange={e => set("full_name_en", e.target.value)} dir="ltr" />
              </Field>
              <Field label="الجنسية">
                <Select value={form.nationality} onChange={e => set("nationality", e.target.value)}>
                  {NATIONALITIES.map(n => <option key={n}>{n}</option>)}
                </Select>
              </Field>
              <Field label="تصنيف الموظف">
                <Select value={form.is_saudi ? "saudi" : "nonSaudi"} onChange={e => { const s = e.target.value === "saudi"; set("is_saudi", s); if (s) set("nationality", "سعودي"); }}>
                  <option value="saudi">🇸🇦 سعودي</option>
                  <option value="nonSaudi">🌍 مقيم (غير سعودي)</option>
                </Select>
              </Field>
              <Field label="رقم الهوية / الإقامة *">
                <Input value={form.id_number} onChange={e => set("id_number", e.target.value)} placeholder="1xxxxxxxxx" />
              </Field>
              <Field label="تاريخ انتهاء الهوية/الإقامة">
                <Input type="date" value={form.id_expiry} onChange={e => set("id_expiry", e.target.value)} />
              </Field>
              <Field label="رقم جواز السفر">
                <Input value={form.passport_number} onChange={e => set("passport_number", e.target.value)} dir="ltr" />
              </Field>
              <Field label="تاريخ انتهاء الجواز">
                <Input type="date" value={form.passport_expiry} onChange={e => set("passport_expiry", e.target.value)} />
              </Field>
              <Field label="تاريخ الميلاد">
                <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
              </Field>
              <Field label="الجنس">
                <Select value={form.gender} onChange={e => set("gender", e.target.value)}>
                  <option>ذكر</option><option>أنثى</option>
                </Select>
              </Field>
              <Field label="الحالة الاجتماعية">
                <Select value={form.marital_status} onChange={e => set("marital_status", e.target.value)}>
                  <option>أعزب</option><option>متزوج</option><option>مطلق</option><option>أرمل</option>
                </Select>
              </Field>
              <Field label="عدد المعالين">
                <Input type="number" min={0} value={form.dependents_count} onChange={e => set("dependents_count", +e.target.value)} />
              </Field>
              <Field label="رقم الجوال">
                <Input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} dir="ltr" placeholder="+966 5x xxx xxxx" />
              </Field>
              <Field label="البريد الإلكتروني">
                <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} dir="ltr" />
              </Field>
            </div>
          )}

          {activeTab === "job" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="رقم الملف الوظيفي">
                <div className="flex items-center gap-2">
                  <Input value={form.employee_number} readOnly dir="ltr" className="bg-muted/50 cursor-not-allowed" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">تلقائي</span>
                </div>
              </Field>
              <Field label="المسمى الوظيفي *">
                <Input value={form.job_title} onChange={e => set("job_title", e.target.value)} />
              </Field>
              <Field label="القسم *">
                <Select value={form.department} onChange={e => set("department", e.target.value)}>
                  <option value="">اختر القسم...</option>
                  {allDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </Select>
              </Field>
              <Field label="الدرجة الوظيفية">
                <Input value={form.job_grade} onChange={e => set("job_grade", e.target.value)} />
              </Field>
              <Field label="المدير المباشر">
                <Select value={form.manager} onChange={e => set("manager", e.target.value)}>
                  <option value="">بدون مدير</option>
                  {allEmployees.filter(e=>e.id!==employee?.id).map(e => <option key={e.id} value={e.full_name_ar}>{e.full_name_ar} — {e.job_title}</option>)}
                </Select>
              </Field>
              <Field label="الفرع">
                <Select value={form.branch} onChange={e => set("branch", e.target.value)}>
                  <option value="">اختر الفرع...</option>
                  {allBranches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </Select>
              </Field>
              <Field label="مركز التكلفة">
                <Input value={form.cost_center} onChange={e => set("cost_center", e.target.value)} />
              </Field>
              <Field label="المشروع">
                <Input value={form.project} onChange={e => set("project", e.target.value)} />
              </Field>
              <Field label="تاريخ المباشرة *">
                <Input type="date" value={form.join_date} onChange={e => set("join_date", e.target.value)} />
              </Field>
              <Field label="نوع العقد *">
                <Select value={form.contract_type} onChange={e => set("contract_type", e.target.value)}>
                  <option>غير محدد المدة</option>
                  <option>محدد المدة</option>
                </Select>
              </Field>
              {form.contract_type === "محدد المدة" && (
                <Field label="تاريخ انتهاء العقد">
                  <Input type="date" value={form.contract_end_date} onChange={e => set("contract_end_date", e.target.value)} />
                </Field>
              )}
              <Field label="حالة الموظف">
                <Select value={form.status} onChange={e => set("status", e.target.value)}>
                  <option>نشط</option><option>في إجازة</option><option>تحت التجربة</option><option>مُنهي الخدمة</option>
                </Select>
              </Field>
              <Field label="🔐 نوع المستخدم في النظام">
                <Select value={form.user_role} onChange={e => set("user_role", e.target.value)}>
                  {USER_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="رصيد الإجازات السنوية (يوم)">
                <Input type="number" min={0} value={form.annual_leave_balance || 0} onChange={e => set("annual_leave_balance", +e.target.value)} />
              </Field>
            </div>
          )}

          {activeTab === "salary" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="الراتب الأساسي (ريال) *">
                <Input type="number" min={0} value={form.basic_salary} onChange={e => { set("basic_salary", +e.target.value); }} onBlur={autoHousing} />
              </Field>
              <Field label="بدل السكن (25% من الأساسي)">
                <Input type="number" min={0} value={form.housing_allowance} onChange={e => set("housing_allowance", +e.target.value)} />
              </Field>
              <Field label="بدل النقل">
                <Input type="number" min={0} value={form.transport_allowance} onChange={e => set("transport_allowance", +e.target.value)} />
              </Field>
              <Field label="بدل الغذاء">
                <Input type="number" min={0} value={form.food_allowance} onChange={e => set("food_allowance", +e.target.value)} />
              </Field>
              <Field label="بدل الاتصالات">
                <Input type="number" min={0} value={form.communication_allowance} onChange={e => set("communication_allowance", +e.target.value)} />
              </Field>
              <Field label="بدلات أخرى">
                <Input type="number" min={0} value={form.other_allowances} onChange={e => set("other_allowances", +e.target.value)} />
              </Field>
              <div className="sm:col-span-2 p-4 bg-muted/50 rounded-lg border border-border">
                <p className="text-sm font-semibold text-foreground mb-2">إجمالي الراتب الشهري</p>
                <p className="text-2xl font-bold text-primary">
                  {((form.basic_salary || 0) + (form.housing_allowance || 0) + (form.transport_allowance || 0) +
                    (form.food_allowance || 0) + (form.communication_allowance || 0) + (form.other_allowances || 0)).toLocaleString("ar-SA")} ريال
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  بدون احتساب الخصومات والإضافيات
                </p>
              </div>
              <Field label="اسم البنك">
                <Input value={form.bank_name} onChange={e => set("bank_name", e.target.value)} />
              </Field>
              <Field label="رقم IBAN">
                <Input value={form.iban} onChange={e => set("iban", e.target.value)} dir="ltr" placeholder="SA00 0000 0000 0000 0000 0000" />
              </Field>
              <Field label="رقم التأمينات الاجتماعية">
                <Input value={form.gosi_number} onChange={e => set("gosi_number", e.target.value)} dir="ltr" />
              </Field>
            </div>
          )}

          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">وثائق الموظف</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {["هوية / إقامة","جواز السفر","عقد العمل","الشهادات","الحساب البنكي","أخرى"].map(lbl=>(
                    <div key={lbl} className="p-2 bg-muted/30 rounded-lg border border-dashed border-border">{lbl}</div>
                  ))}
                </div>
                <label className="flex items-center gap-2 p-3 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">{uploadingDoc ? "جاري الرفع..." : "رفع وثيقة"}</span>
                  <input type="file" className="hidden" onChange={handleDocUpload} disabled={uploadingDoc} />
                </label>
                {(form.documents||[]).length > 0 && (
                  <div className="space-y-1.5">
                    {(form.documents||[]).map((url, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                        <span className="text-xs text-green-700">📎 وثيقة {i+1}</span>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Field label="ملاحظات">
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                  rows={3} placeholder="أي ملاحظات إضافية عن الموظف..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </Field>
            </div>
          )}

          {activeTab === "travel" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="استحقاق التذكرة">
                <Select value={form.ticket_entitlement} onChange={e => set("ticket_entitlement", e.target.value)}>
                  <option>سنوياً</option><option>كل سنتين</option><option>غير مستحق</option>
                </Select>
              </Field>
              <Field label="درجة التذكرة">
                <Select value={form.ticket_class} onChange={e => set("ticket_class", e.target.value)}>
                  <option>اقتصادية</option><option>أعمال</option>
                </Select>
              </Field>
              <Field label="وجهة التذكرة (مطار المسقط)">
                <Input value={form.ticket_destination} onChange={e => set("ticket_destination", e.target.value)} placeholder="القاهرة، عمّان، مانيلا..." />
              </Field>
              <Field label="قيمة التذكرة (ريال)">
                <Input type="number" min={0} value={form.ticket_value} onChange={e => set("ticket_value", +e.target.value)} />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
            إلغاء
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ البيانات"}
          </button>
        </div>
      </div>
    </div>
  );
}