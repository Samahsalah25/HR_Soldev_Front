// import { useState } from "react";
// import { X, Save, AlertTriangle } from "lucide-react";
// import { base44 } from "@/api/base44Client";

// const COMPLAINT_CATEGORIES = ["تجاوز صلاحيات", "تقييم غير عادل", "بيئة عمل", "تعدي من زميل", "مشكلة راتب", "أخرى"];
// const OBJECTION_CATEGORIES = ["اعتراض على قرار تأديبي", "اعتراض على راتب", "اعتراض على إجازة مرفوضة", "اعتراض على تقييم أداء", "أخرى"];
// import { createComplaint, createAppeal } from "@/api/requestsApi";
// export default function ComplaintModal({ requestType, employees, onSave, onClose }) {
//   const isObjection = requestType === "تقديم اعتراض";
//   const categories = isObjection ? OBJECTION_CATEGORIES : COMPLAINT_CATEGORIES;

//   const [form, setForm] = useState({
//     employee_id: "", employee_name: "", department: "",
//     category: categories[0], subject: "", description: "",
//     against_person: "", date_of_incident: "", is_anonymous: false
//   });
//   const [saving, setSaving] = useState(false);
//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

//   const handleEmpSelect = (id) => {
//     const emp = employees.find(e => e.id === id);
//     if (emp) { set("employee_id", id); set("employee_name", emp.full_name_ar); set("department", emp.department || ""); }
//   };

//   const handleSave = async () => {
//     setSaving(true);
//     const details = `التصنيف: ${form.category}\nالموضوع: ${form.subject}\nالوصف: ${form.description}${form.against_person ? `\nضد: ${form.against_person}` : ""}${form.date_of_incident ? `\nتاريخ الحادثة: ${form.date_of_incident}` : ""}`;
//     await base44.entities.EmployeeRequest.create({
//       employee_id: form.is_anonymous ? "" : form.employee_id,
//       employee_name: form.is_anonymous ? "مجهول" : form.employee_name,
//       department: form.department,
//       request_type: requestType,
//       details,
//       amount: 0,
//       status: "قيد المراجعة",
//     });
//     onSave();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
//       <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-border">
//           <div className="flex items-center gap-2">
//             <AlertTriangle className={`w-5 h-5 ${isObjection ? "text-amber-600" : "text-red-600"}`} />
//             <h3 className="font-bold text-foreground">{requestType}</h3>
//           </div>
//           <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-lg">
//             <input type="checkbox" checked={form.is_anonymous} onChange={e => set("is_anonymous", e.target.checked)} className="w-4 h-4 accent-amber-600" />
//             <div>
//               <span className="text-sm font-medium text-amber-800">تقديم بشكل مجهول</span>
//               <p className="text-xs text-amber-600 mt-0.5">لن يُظهر النظام هويتك للمدير</p>
//             </div>
//           </label>

//           {!form.is_anonymous && (
//             <div className="space-y-1.5">
//               <label className="text-sm font-medium text-foreground">الموظف *</label>
//               <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
//                 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
//                 <option value="">اختر الموظف...</option>
//                 {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar}</option>)}
//               </select>
//             </div>
//           )}

//           <div className="space-y-1.5">
//             <label className="text-sm font-medium text-foreground">تصنيف {isObjection ? "الاعتراض" : "الشكوى"}</label>
//             <select value={form.category} onChange={e => set("category", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
//               {categories.map(c => <option key={c}>{c}</option>)}
//             </select>
//           </div>

//           <div className="space-y-1.5">
//             <label className="text-sm font-medium text-foreground">الموضوع *</label>
//             <input value={form.subject} onChange={e => set("subject", e.target.value)}
//               placeholder={isObjection ? "موضوع الاعتراض..." : "عنوان الشكوى..."}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
//           </div>

//           {!isObjection && (
//             <div className="grid grid-cols-2 gap-3">
//               <div className="space-y-1.5">
//                 <label className="text-sm font-medium text-foreground">الشخص المعني</label>
//                 <select value={form.against_person} onChange={e => set("against_person", e.target.value)}
//                   className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
//                   <option value="">اختر الموظف...</option>
//                   {employees.map(e => <option key={e.id} value={e.full_name_ar}>{e.full_name_ar}</option>)}
//                 </select>
//               </div>
//               <div className="space-y-1.5">
//                 <label className="text-sm font-medium text-foreground">تاريخ الحادثة</label>
//                 <input type="date" value={form.date_of_incident} onChange={e => set("date_of_incident", e.target.value)}
//                   className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
//               </div>
//             </div>
//           )}

//           <div className="space-y-1.5">
//             <label className="text-sm font-medium text-foreground">التفاصيل *</label>
//             <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
//               placeholder="اكتب تفاصيل كاملة..."
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
//           </div>
//         </div>
//         <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
//           <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
//           <button onClick={handleSave} disabled={saving || (!form.is_anonymous && !form.employee_id) || !form.subject || !form.description}
//             className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
//             <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import {
  createComplaint,
  createAppeal,
} from "@/api/requestsApi";

const COMPLAINT_CATEGORIES = [
  "تجاوز صلاحيات",
  "تقييم غير عادل",
  "بيئة عمل",
  "تعدي من زميل",
  "مشكلة راتب",
  "أخرى",
];

const OBJECTION_CATEGORIES = [
  "اعتراض على قرار تأديبي",
  "اعتراض على راتب",
  "اعتراض على إجازة مرفوضة",
  "اعتراض على تقييم أداء",
  "أخرى",
];


export default function ComplaintModal({
  requestType,
  employees,
  onSave,
  onClose,
}) {
  const isObjection = requestType === "تقديم اعتراض";
  const categories = isObjection
    ? OBJECTION_CATEGORIES
    : COMPLAINT_CATEGORIES;

  const [form, setForm] = useState({
    employee_id: "",
    employee_name: "",
    department: "",
    category: categories[0],
    subject: "",
    description: "",
    against_person: "",
    date_of_incident: "",
    is_anonymous: false,
  });

  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find((e) => String(e.id) === String(id));
    if (emp) {
      set("employee_id", emp.id);
      set("employee_name", emp.full_name_ar);
      set("department", emp.department || "");
    }
  };

  const buildPayload = () => {
    if (isObjection) {
      return {
        is_anonymous: form.is_anonymous,
        employee_id: form.is_anonymous ? null : form.employee_id,
        appeal_type: "other", // ممكن نعمل mapping بعدين
        topic: form.subject,
        description: `${form.category}\n${form.description}`,
      };
    }

    return {
      is_anonymous: form.is_anonymous,
      employee_id: form.is_anonymous ? null : form.employee_id,
      complaint_type: "other", // ممكن نعمل mapping ذكي بعدين
      topic: form.subject,
      meaned_employee_id: form.against_person || null,
      incident_date: form.date_of_incident || null,
      description: `${form.category}\n${form.description}`,
    };
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = buildPayload();

      if (isObjection) {
        await createAppeal(payload);
      } else {
        await createComplaint (payload);
      }

      onSave();
    } catch (err) {
      console.error(err);
      alert("حصل خطأ أثناء إرسال الطلب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isObjection ? "text-amber-600" : "text-red-600"}`} />
            <h3 className="font-bold text-foreground">{requestType}</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={(e) => set("is_anonymous", e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
            <div>
              <span className="text-sm font-medium text-amber-800">
                تقديم بشكل مجهول
              </span>
              <p className="text-xs text-amber-600 mt-0.5">
                لن يُظهر النظام هويتك
              </p>
            </div>
          </label>

          {!form.is_anonymous && (
            <div>
              <label className="text-sm font-medium">الموظف</label>
              <select
                value={form.employee_id}
                onChange={(e) => handleEmpSelect(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              >
                <option value="">اختر الموظف...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">التصنيف</label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">الموضوع</label>
            <input
              value={form.subject}
              onChange={(e) => set("subject", e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>

          {!isObjection && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm">الشخص المعني</label>
                <select
                  value={form.against_person}
                  onChange={(e) => set("against_person", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                >
                  <option value="">اختر</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm">التاريخ</label>
                <input
                  type="date"
                  value={form.date_of_incident}
                  onChange={(e) => set("date_of_incident", e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">التفاصيل</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={saving || (!form.is_anonymous && !form.employee_id) || !form.subject || !form.description}
            className="px-5 py-2 bg-primary text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "جاري الإرسال..." : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}