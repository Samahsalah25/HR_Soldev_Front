import { useState, useEffect } from "react";
import { X, Save, User, Briefcase, DollarSign, FileText, Plane, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";
import api from "@/api/axios";
import { createEmployee, updateEmployee, uploadEmployeeDocument, toApiPayload } from "@/api/employeesApi";
import { useToast } from "@/components/ui/use-toast";

const NATIONALITIES = ["سعودي", "مصري", "سوداني", "يمني", "باكستاني", "هندي", "فلبيني", "إندونيسي", "بنغلاديشي", "نيبالي", "إثيوبي", "أردني", "فلسطيني", "سوري", "لبناني", "عراقي", "كويتي", "إماراتي", "بحريني", "قطري", "عُماني", "تونسي", "جزائري", "مغربي", "ليبي", "أمريكي", "بريطاني", "فرنسي", "أخرى"];
function genEmployeeNumber() { return `EMP-${Date.now().toString().slice(-6)}`; }

// Regex الخاصة بالـ Validation (لا تُغيّر أي شيء في التصميم أو الـ API)
const ID_NUMBER_REGEX = /^(1|2)\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAUDI_PHONE_REGEX = /^(05\d{8}|9665\d{8}|\+9665\d{8})$/;

const tabs = [
  { id: "personal", label: "البيانات الشخصية", icon: User },
  { id: "job", label: "بيانات الوظيفة", icon: Briefcase },
  { id: "salary", label: "الراتب والبدلات", icon: DollarSign },
  { id: "docs", label: "الوثائق والمستندات", icon: FileText },
  { id: "travel", label: "التذاكر والسفر", icon: Plane },
];

const Field = ({ label, children, error, warning }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">
      {label}
    </label>

    {children}

    {error && (
      <p className="text-xs text-red-500 mt-1">
        {error}
      </p>
    )}

    {!error && warning && (
      <p className="text-xs text-yellow-600 mt-1">
        {warning}
      </p>
    )}
  </div>
);

const Input = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2 text-sm border rounded-lg bg-background 
      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
      ${error ? "border-red-500 focus:ring-red-200" : "border-border"}`}
  />
);

const Select = ({ children, error, ...props }) => (
  <select
    {...props}
    className={`w-full px-3 py-2 text-sm border rounded-lg bg-background 
      focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
      ${error ? "border-red-500 focus:ring-red-200" : "border-border"}`}
  >
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
const [errors, setErrors] = useState({});
  const { toast } = useToast();  

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [emps, depts, brs] = await Promise.all([
          api.get("/employees").then(r => {
            const d = r.data?.data || r.data || [];
            return Array.isArray(d) ? d : [];
          }),
          api.get("/departments").then(r => {
            const d = r.data?.data || r.data || [];
            return Array.isArray(d) ? d : [];
          }),
          api.get("/branches").then(r => {
            const d = r.data?.data || r.data || [];
            return Array.isArray(d) ? d : [];
          }),
        ]);
        setAllEmployees(emps.map(e => ({
          id: e.id,
          full_name_ar: e.name_ar || e.name || "",
          name: e.name || e.name_ar || "",
          job_title: e.job_title || "",
        })));
        // Normalize departments: { id, name }
        setAllDepartments(depts.map(d => ({ id: d.id, name: d.name || d.department_name || "" })));
        // Normalize branches: { id, name }
        setAllBranches(brs.map(b => ({ id: b.id, name: b.name || b.branch_name || "" })));
      } catch (err) {
        console.error("Form data load error:", err);
        // Fallback to base44
        try {
          const [emps, depts, brs] = await Promise.all([
            base44.entities.Employee.list(),
            base44.entities.Department.list(),
            base44.entities.Branch.list(),
          ]);
          setAllEmployees(emps);
          setAllDepartments(depts);
          setAllBranches(brs);
        } catch { }
      }
    };
    loadFormData();
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

  // set() بيحدّث قيمة الحقل، وبيشيل رسالة الخطأ الخاصة بيه فورًا لو كانت موجودة
  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(errs => {
      if (!errs[k]) return errs;
      const next = { ...errs };
      delete next[k];
      return next;
    });
  };
  const autoHousing = () => { if (!form.housing_allowance) set("housing_allowance", Math.round(form.basic_salary * 0.25)); };

  // تنبيه (غير مانع للحفظ) لو الهوية/الإقامة منتهية
  const isIdExpired = (() => {
    if (!form.id_expiry) return false;
    const expiry = new Date(form.id_expiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiry < today;
  })();

  const handleDocUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingDoc(true);
    try {
      // Convert file to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // strip data:...;base64,
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      if (employee?.id) {
        // Upload to new API if employee already exists
        await uploadEmployeeDocument(employee.id, {
          document: base64,
          filename: file.name,
          notes: "",
        });
      } else {
        // Store pending doc for after creation
        const newDocs = [...(form.documents || []), { document: base64, filename: file.name, notes: "" }];
        set("documents", newDocs);
        setDocFiles(prev => [...prev, { name: file.name }]);
      }
    } catch (err) {
      console.error("Doc upload error:", err);
    } finally {
      setUploadingDoc(false);
    }
  };
const validateForm = () => {
  const newErrors = {};

  // البيانات الشخصية
  if (!form.full_name_ar?.trim()) {
    newErrors.full_name_ar = "الاسم الكامل (عربي) مطلوب";
  }

  if (!form.id_number?.trim()) {
    newErrors.id_number = "رقم الهوية / الإقامة مطلوب";
  } else if (!ID_NUMBER_REGEX.test(form.id_number.trim())) {
    newErrors.id_number = "رقم الهوية/الإقامة غير صحيح.";
  }

  if (form.date_of_birth) {
    const dob = new Date(form.date_of_birth);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dob > today) {
      newErrors.date_of_birth = "تاريخ الميلاد غير صحيح.";
    }
  }

  if (form.email && !EMAIL_REGEX.test(form.email.trim())) {
    newErrors.email = "البريد الإلكتروني غير صحيح.";
  }

  if (form.phone && !SAUDI_PHONE_REGEX.test(form.phone.trim())) {
    newErrors.phone = "رقم الجوال غير صحيح.";
  }

  if (
    form.dependents_count !== undefined &&
    form.dependents_count !== null &&
    form.dependents_count !== "" &&
    Number(form.dependents_count) < 0
  ) {
    newErrors.dependents_count = "القيمة لا يمكن أن تكون سالبة.";
  }


  // البيانات الوظيفية
  if (!form.job_title?.trim()) {
    newErrors.job_title = "المسمى الوظيفي مطلوب";
  }

  if (!form.department_id && !form.department) {
    newErrors.department_id = "اختيار القسم مطلوب";
  }

  if (!form.join_date) {
    newErrors.join_date = "تاريخ المباشرة مطلوب";
  } else {
    const joinDate = new Date(form.join_date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (joinDate > today) {
      newErrors.join_date = "لا يمكن أن يكون تاريخ المباشرة في المستقبل.";
    }
  }

  if (!form.contract_type) {
    newErrors.contract_type = "نوع العقد مطلوب";
  }

  if (
    form.contract_type === "محدد المدة" &&
    form.contract_end_date &&
    form.join_date
  ) {
    const endDate = new Date(form.contract_end_date);
    const joinDate = new Date(form.join_date);
    if (endDate <= joinDate) {
      newErrors.contract_end_date = "تاريخ انتهاء العقد يجب أن يكون بعد تاريخ المباشرة.";
    }
  }


  // الراتب
  if (
    form.basic_salary === undefined ||
    form.basic_salary === null ||
    form.basic_salary === "" ||
    Number(form.basic_salary) <= 0
  ) {
    newErrors.basic_salary = "الراتب الأساسي يجب أن يكون أكبر من صفر.";
  }

  [
    "housing_allowance",
    "transport_allowance",
    "food_allowance",
    "communication_allowance",
    "other_allowances",
  ].forEach((key) => {
    const val = form[key];
    if (val !== undefined && val !== null && val !== "" && Number(val) < 0) {
      newErrors[key] = "القيمة لا يمكن أن تكون سالبة.";
    }
  });

  if (
    form.iban &&
    !(form.iban.trim().startsWith("SA") && form.iban.trim().length === 24)
  ) {
    newErrors.iban = "رقم IBAN غير صحيح.";
  }


  // بيانات إضافية
  if (
    form.ticket_value !== undefined &&
    form.ticket_value !== null &&
    form.ticket_value !== "" &&
    Number(form.ticket_value) < 0
  ) {
    newErrors.ticket_value = "القيمة لا يمكن أن تكون سالبة.";
  }


  setErrors(newErrors);


  return {
    valid: Object.keys(newErrors).length === 0,
    errors: newErrors
  };
};
const handleSubmit = async () => {

  const validation = validateForm();


  // يوجد أخطاء
  if (!validation.valid) {

    const errors = validation.errors;


    // تحديد التاب الذي به الخطأ
    if (
      errors.full_name_ar ||
      errors.id_number ||
      errors.email ||
      errors.phone ||
      errors.date_of_birth ||
      errors.dependents_count
    ) {
      setActiveTab("personal");
    }

    else if (
      errors.job_title ||
      errors.department_id ||
      errors.join_date ||
      errors.contract_type ||
      errors.contract_end_date
    ) {
      setActiveTab("job");
    }

    else if (
      errors.basic_salary ||
      errors.housing_allowance ||
      errors.transport_allowance ||
      errors.food_allowance ||
      errors.communication_allowance ||
      errors.other_allowances ||
      errors.iban
    ) {
      setActiveTab("salary");
    }

    else if (
      errors.ticket_value
    ) {
      setActiveTab("travel");
    }


    return;
  }


  setSaving(true);


  try {

    const payload = toApiPayload(form);


    if (employee?.id) {

      await updateEmployee(
        employee.id,
        payload
      );

    } else {


      const pendingDocs =
        (form.documents || [])
          .filter(
            d =>
              typeof d === "object" &&
              d.document
          );


      if (pendingDocs.length > 0) {
        payload.documents = pendingDocs;
      }


      await createEmployee(payload);

    }


    onSave();


  } catch (err) {


    console.error(
      "Employee save error:",
      err
    );


    const apiError =
      err?.response?.data;


    const msg =
      apiError?.message ||
      apiError?.error ||
      (typeof apiError === "string"
        ? apiError
        : null) ||
      "حدث خطأ أثناء الحفظ";


 toast({
        title: "خطأ",
        description: msg,
        variant: "destructive",
      });

  } finally {

    setSaving(false);

  }
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

    <Field 
      label="الاسم الكامل (عربي) *"
      error={errors.full_name_ar}
    >
      <Input
        error={errors.full_name_ar}
        value={form.full_name_ar}
        onChange={e => set("full_name_ar", e.target.value)}
        placeholder="محمد عبدالله الأحمد"
      />
    </Field>


    <Field label="الاسم الكامل (إنجليزي)">
      <Input
        value={form.full_name_en}
        onChange={e => set("full_name_en", e.target.value)}
        dir="ltr"
      />
    </Field>


    <Field label="الجنسية">
      <Select
        value={form.nationality}
        onChange={e => set("nationality", e.target.value)}
      >
        {NATIONALITIES.map(n => (
          <option key={n}>{n}</option>
        ))}
      </Select>
    </Field>


    <Field label="تصنيف الموظف">
      <Select
        value={form.is_saudi ? "saudi" : "nonSaudi"}
        onChange={e => {
          const s = e.target.value === "saudi";
          set("is_saudi", s);

          if (s) {
            set("nationality", "سعودي");
          } else if (form.nationality === "سعودي") {
            // منع تعارض البيانات: موظف "غير سعودي" وجنسيته لسه "سعودي"
            set("nationality", "");
          }
        }}
      >
        <option value="saudi">🇸🇦 سعودي</option>
        <option value="nonSaudi">🌍 مقيم (غير سعودي)</option>
      </Select>
    </Field>


    <Field 
      label="رقم الهوية / الإقامة *"
      error={errors.id_number}
    >
      <Input
        error={errors.id_number}
        value={form.id_number}
        onChange={e => set("id_number", e.target.value)}
        placeholder="1xxxxxxxxx"
      />
    </Field>


    <Field
      label="تاريخ انتهاء الهوية/الإقامة"
      warning={isIdExpired ? "تنبيه: الهوية منتهية." : null}
    >
      <Input
        type="date"
        value={form.id_expiry}
        onChange={e => set("id_expiry", e.target.value)}
      />
    </Field>


    <Field label="رقم جواز السفر">
      <Input
        value={form.passport_number}
        onChange={e => set("passport_number", e.target.value)}
        dir="ltr"
      />
    </Field>


    <Field label="تاريخ انتهاء الجواز">
      <Input
        type="date"
        value={form.passport_expiry}
        onChange={e => set("passport_expiry", e.target.value)}
      />
    </Field>


    <Field
      label="تاريخ الميلاد"
      error={errors.date_of_birth}
    >
      <Input
        error={errors.date_of_birth}
        type="date"
        value={form.date_of_birth}
        onChange={e => set("date_of_birth", e.target.value)}
      />
    </Field>


    <Field label="الجنس">
      <Select
        value={form.gender}
        onChange={e => set("gender", e.target.value)}
      >
        <option>ذكر</option>
        <option>أنثى</option>
      </Select>
    </Field>


    <Field label="الحالة الاجتماعية">
      <Select
        value={form.marital_status}
        onChange={e => set("marital_status", e.target.value)}
      >
        <option>أعزب</option>
        <option>متزوج</option>
        <option>مطلق</option>
        <option>أرمل</option>
      </Select>
    </Field>


    <Field
      label="عدد المعالين"
      error={errors.dependents_count}
    >
      <Input
        error={errors.dependents_count}
        type="number"
        min={0}
        value={form.dependents_count}
        onChange={e => set("dependents_count", +e.target.value)}
      />
    </Field>


    <Field
      label="رقم الجوال"
      error={errors.phone}
    >
      <Input
        error={errors.phone}
        type="tel"
        value={form.phone}
        onChange={e => set("phone", e.target.value)}
        dir="ltr"
        placeholder="+966 5x xxx xxxx"
      />
    </Field>


    <Field
      label="البريد الإلكتروني"
      error={errors.email}
    >
      <Input
        error={errors.email}
        type="email"
        value={form.email}
        onChange={e => set("email", e.target.value)}
        dir="ltr"
      />
    </Field>

  </div>
)}

         {activeTab === "job" && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

    <Field label="رقم الملف الوظيفي">
      <div className="flex items-center gap-2">
        <Input
          value={form.employee_number}
          readOnly
          dir="ltr"
          className="bg-muted/50 cursor-not-allowed"
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          تلقائي
        </span>
      </div>
    </Field>


    <Field 
      label="المسمى الوظيفي *"
      error={errors.job_title}
    >
      <Input
        error={errors.job_title}
        value={form.job_title}
        onChange={e => set("job_title", e.target.value)}
      />
    </Field>


    <Field 
      label="القسم *"
      error={errors.department_id}
    >
      <Select
        error={errors.department_id}
        value={form.department_id || ""}
        onChange={e => {
          const dept = allDepartments.find(
            d => String(d.id) === e.target.value
          );

          setForm(f => ({
            ...f,
            department_id: Number(e.target.value) || null,
            department: dept?.name || ""
          }));
          setErrors(errs => {
            if (!errs.department_id) return errs;
            const next = { ...errs };
            delete next.department_id;
            return next;
          });
        }}
      >
        <option value="">اختر القسم...</option>

        {allDepartments.map(d => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </Select>
    </Field>


    <Field label="الدرجة الوظيفية">
      <Select
        value={form.job_grade}
        onChange={e => set("job_grade", e.target.value)}
      >
        <option value="">اختر الدرجة...</option>
        <option value="موظف عادي">موظف عادي</option>
        <option value="مدير قسم">مدير قسم</option>
        <option value="محاسب">محاسب</option>
        <option value="موارد بشرية">موارد بشرية</option>
        <option value="مدير تنفيذي">مدير تنفيذي</option>
        <option value="مدير نظام">مدير نظام</option>
      </Select>
    </Field>


    <Field label="المدير المباشر">
      <Select
        value={form.direct_manager || ""}
        onChange={e => {
          const emp = allEmployees.find(
            em => String(em.id) === e.target.value
          );

          setForm(f => ({
            ...f,
            direct_manager: Number(e.target.value) || null,
            manager: emp?.full_name_ar || emp?.name || ""
          }));
        }}
      >
        <option value="">بدون مدير</option>

        {allEmployees
          .filter(e => e.id !== employee?.id)
          .map(e => (
            <option key={e.id} value={e.id}>
              {e.full_name_ar || e.name} — {e.job_title}
            </option>
          ))}
      </Select>
    </Field>


    <Field label="الفرع">
      <Select
        value={form.branch_id || ""}
        onChange={e => {
          const br = allBranches.find(
            b => String(b.id) === e.target.value
          );

          setForm(f => ({
            ...f,
            branch_id: Number(e.target.value) || null,
            branch: br?.name || ""
          }));
        }}
      >
        <option value="">اختر الفرع...</option>

        {allBranches.map(b => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
    </Field>


    <Field label="مركز التكلفة">
      <Input
        value={form.cost_center}
        onChange={e => set("cost_center", e.target.value)}
      />
    </Field>


    <Field label="المشروع">
      <Input
        value={form.project}
        onChange={e => set("project", e.target.value)}
      />
    </Field>


    <Field 
      label="تاريخ المباشرة *"
      error={errors.join_date}
    >
      <Input
        error={errors.join_date}
        type="date"
        value={form.join_date}
        onChange={e => set("join_date", e.target.value)}
      />
    </Field>


    <Field label="نوع العقد *">
      <Select
        value={form.contract_type}
        onChange={e => set("contract_type", e.target.value)}
      >
        <option>غير محدد المدة</option>
        <option>محدد المدة</option>
      </Select>
    </Field>


    {form.contract_type === "محدد المدة" && (
      <Field
        label="تاريخ انتهاء العقد"
        error={errors.contract_end_date}
      >
        <Input
          error={errors.contract_end_date}
          type="date"
          value={form.contract_end_date}
          onChange={e => set("contract_end_date", e.target.value)}
        />
      </Field>
    )}


    <Field label="حالة الموظف">
      <Select
        value={form.status}
        onChange={e => set("status", e.target.value)}
      >
        <option>نشط</option>
        <option>في إجازة</option>
        <option>تحت التجربة</option>
        <option>مُنهي الخدمة</option>
      </Select>
    </Field>


    <Field label="🔐 نوع المستخدم في النظام">
      <Select
        value={form.user_role}
        onChange={e => set("user_role", e.target.value)}
      >
        {USER_TYPES.map(t => (
          <option key={t.value} value={t.value}>
            {t.emoji} {t.label}
          </option>
        ))}
      </Select>
    </Field>


    <Field label="رصيد الإجازات السنوية (يوم)">
      <Input
        type="number"
        min={0}
        value={form.annual_leave_balance || 0}
        onChange={e =>
          set("annual_leave_balance", +e.target.value)
        }
      />
    </Field>

  </div>
)}

         {activeTab === "salary" && (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

    <Field 
      label="الراتب الأساسي (ريال) *"
      error={errors.basic_salary}
    >
      <Input
        error={errors.basic_salary}
        type="number"
        min={0}
        value={form.basic_salary}
        onChange={e => {
          set("basic_salary", +e.target.value);
        }}
        onBlur={autoHousing}
      />
    </Field>


    <Field
      label="بدل السكن (25% من الأساسي)"
      error={errors.housing_allowance}
    >
      <Input
        error={errors.housing_allowance}
        type="number"
        min={0}
        value={form.housing_allowance}
        onChange={e =>
          set("housing_allowance", +e.target.value)
        }
      />
    </Field>


    <Field
      label="بدل النقل"
      error={errors.transport_allowance}
    >
      <Input
        error={errors.transport_allowance}
        type="number"
        min={0}
        value={form.transport_allowance}
        onChange={e =>
          set("transport_allowance", +e.target.value)
        }
      />
    </Field>


    <Field
      label="بدل الغذاء"
      error={errors.food_allowance}
    >
      <Input
        error={errors.food_allowance}
        type="number"
        min={0}
        value={form.food_allowance}
        onChange={e =>
          set("food_allowance", +e.target.value)
        }
      />
    </Field>


    <Field
      label="بدل الاتصالات"
      error={errors.communication_allowance}
    >
      <Input
        error={errors.communication_allowance}
        type="number"
        min={0}
        value={form.communication_allowance}
        onChange={e =>
          set("communication_allowance", +e.target.value)
        }
      />
    </Field>


    <Field
      label="بدلات أخرى"
      error={errors.other_allowances}
    >
      <Input
        error={errors.other_allowances}
        type="number"
        min={0}
        value={form.other_allowances}
        onChange={e =>
          set("other_allowances", +e.target.value)
        }
      />
    </Field>


    <div className="sm:col-span-2 p-4 bg-muted/50 rounded-lg border border-border">
      <p className="text-sm font-semibold text-foreground mb-2">
        إجمالي الراتب الشهري
      </p>

      <p className="text-2xl font-bold text-primary">
        {(
          (form.basic_salary || 0) +
          (form.housing_allowance || 0) +
          (form.transport_allowance || 0) +
          (form.food_allowance || 0) +
          (form.communication_allowance || 0) +
          (form.other_allowances || 0)
        ).toLocaleString("ar-SA")} ريال
      </p>

      <p className="text-xs text-muted-foreground mt-1">
        بدون احتساب الخصومات والإضافيات
      </p>
    </div>


    <Field label="اسم البنك">
      <Input
        value={form.bank_name}
        onChange={e =>
          set("bank_name", e.target.value)
        }
      />
    </Field>


    <Field
      label="رقم IBAN"
      error={errors.iban}
    >
      <Input
        error={errors.iban}
        value={form.iban}
        onChange={e =>
          set("iban", e.target.value)
        }
        dir="ltr"
        placeholder="SA00 0000 0000 0000 0000 0000"
      />
    </Field>


    <Field label="رقم التأمينات الاجتماعية">
      <Input
        value={form.gosi_number}
        onChange={e =>
          set("gosi_number", e.target.value)
        }
        dir="ltr"
      />
    </Field>

  </div>
)}

          {activeTab === "docs" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">وثائق الموظف</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {["هوية / إقامة", "جواز السفر", "عقد العمل", "الشهادات", "الحساب البنكي", "أخرى"].map(lbl => (
                    <div key={lbl} className="p-2 bg-muted/30 rounded-lg border border-dashed border-border">{lbl}</div>
                  ))}
                </div>
                <label className="flex items-center gap-2 p-3 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:bg-primary/5 transition-colors">
                  <Upload className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">{uploadingDoc ? "جاري الرفع..." : "رفع وثيقة"}</span>
                  <input type="file" className="hidden" onChange={handleDocUpload} disabled={uploadingDoc} />
                </label>
                {(form.documents || []).length > 0 && (
                  <div className="space-y-1.5">
                    {(form.documents || []).map((doc, i) => {
                      const url = typeof doc === "string" ? doc : (doc?.url || doc?.document_url || "");
                      const filename = (typeof doc === "object" && doc?.filename) || `وثيقة ${i + 1}`;
                      return (
                        <div key={i} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                          <span className="text-xs text-green-700">📎 {filename}</span>
                          {url
                            ? <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline">عرض</a>
                            : <span className="text-xs text-muted-foreground">سيتم رفعها بعد الحفظ</span>}
                        </div>
                      );
                    })}
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
              <Field label="قيمة التذكرة (ريال)" error={errors.ticket_value}>
                <Input error={errors.ticket_value} type="number" min={0} value={form.ticket_value} onChange={e => set("ticket_value", +e.target.value)} />
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