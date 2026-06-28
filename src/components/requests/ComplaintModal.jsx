import { useState } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { createComplaintRequest, createAppealRequest } from "@/api/requestsApi";

// complaint_type options
const COMPLAINT_TYPE_MAP = {
  "تجاوز صلاحيات": "authority_trespassing",
  "تقييم غير عادل": "unfair_evaluation",
  "بيئة عمل": "work_environment",
  "تعدي من زميل": "coworker_trespassing",
  "مشكلة راتب": "salary_problem",
  "أخرى": "other",
};

// appeal_type options
const APPEAL_TYPE_MAP = {
  "اعتراض على قرار تأديبي": "objection_disciplinary",
  "اعتراض على راتب": "objection_salary",
  "اعتراض على إجازة مرفوضة": "objection_refused_vacation",
  "اعتراض على تقييم أداء": "objection_evaluation",
  "أخرى": "other",
};

export default function ComplaintModal({ requestType, employees, onSave, onClose }) {
  const isObjection = requestType === "تقديم اعتراض";
  const typeMap = isObjection ? APPEAL_TYPE_MAP : COMPLAINT_TYPE_MAP;
  const categories = Object.keys(typeMap);

  const [form, setForm] = useState({
    is_anonymous: false,
    employee_id: "",
    category: categories[0],
    topic: "",
    meaned_employee_id: "",
    incident_date: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isObjection) {
        await createAppealRequest({
          is_anonymous: form.is_anonymous,
          employee_id: form.is_anonymous ? undefined : form.employee_id,
          appeal_type: typeMap[form.category],
          topic: form.topic,
          description: form.description,
        });
      } else {
        await createComplaintRequest({
          is_anonymous: form.is_anonymous,
          employee_id: form.is_anonymous ? undefined : form.employee_id,
          complaint_type: typeMap[form.category],
          topic: form.topic,
          meaned_employee_id: form.meaned_employee_id || undefined,
          incident_date: form.incident_date || undefined,
          description: form.description,
        });
      }
      onSave();
    } catch (err) {
      console.error(err?.response?.data || err);
      alert("حصل خطأ أثناء إرسال الطلب");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${isObjection ? "text-amber-600" : "text-red-600"}`} />
            <h3 className="font-bold text-foreground">{requestType}</h3>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* مجهول */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <input type="checkbox" checked={form.is_anonymous}
              onChange={e => set("is_anonymous", e.target.checked)}
              className="w-4 h-4 accent-amber-600" />
            <div>
              <span className="text-sm font-medium text-amber-800">تقديم بشكل مجهول</span>
              <p className="text-xs text-amber-600 mt-0.5">لن يُظهر النظام هويتك</p>
            </div>
          </label>

          {/* الموظف */}
          {!form.is_anonymous && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الموظف *</label>
              <select value={form.employee_id} onChange={e => set("employee_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر الموظف...</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name_ar || e.name || e.full_name_ar}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* التصنيف */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">التصنيف *</label>
            <select value={form.category} onChange={e => set("category", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* الموضوع */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الموضوع *</label>
            <input value={form.topic} onChange={e => set("topic", e.target.value)}
              placeholder={isObjection ? "موضوع الاعتراض..." : "عنوان الشكوى..."}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>

          {/* الشكوى فقط: الشخص المعني والتاريخ */}
          {!isObjection && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الشخص المعني</label>
                <select value={form.meaned_employee_id} onChange={e => set("meaned_employee_id", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  <option value="">اختر (اختياري)</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name_ar || e.name || e.full_name_ar}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">تاريخ الحادثة</label>
                <input type="date" value={form.incident_date} onChange={e => set("incident_date", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
            </div>
          )}

          {/* التفاصيل */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">التفاصيل *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave}
            disabled={saving || (!form.is_anonymous && !form.employee_id) || !form.topic || !form.description}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال"}
          </button>
        </div>
      </div>
    </div>
  );
}
