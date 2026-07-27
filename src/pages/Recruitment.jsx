import { useState, useEffect } from "react";
import { UserPlus, Plus, X, Save, Search, CheckCircle, XCircle, Eye, ChevronRight, Calendar, Star, ExternalLink } from "lucide-react";
import { useRole } from "../lib/useRole";
import {
  getJobs,
  createJob,
  acceptJob,
  rejectJob as rejectJobApi,
} from "@/api/jobsApi";
import { getApplicants, updateApplicant, addApplicantMeeting, getMyMeetings, allMyMeetingsForanApplicant } from "@/api/applicantsApi";
import { getBranches } from "@/api/branchesApi";
import { getDepartments, getEmployees } from "@/api/departmentsApi";
import { getCurrentUser } from "@/api/authApi";
import { deleteMeeting as deleteMeetingApi, updateMeeting } from "@/api/meetingsApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { API_ORIGIN } from "@/api/axios";

// روابط الـ CV/المستندات ممكن ترجع من الـ API كمسار نسبي (مش رابط كامل) — نضيفله دومين السيرفر
function resolveFileUrl(url) {
  if (!url) return url;
  return /^https?:\/\//i.test(url) ? url : `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}

// تحويل نوع المقابلة من عربي لـ English key
const INTERVIEW_TYPE_TO_KEY = {
  "مقابلة HR": "hr_meeting",
  "مقابلة فنية": "technical_meeting",
  "مقابلة مدير": "manager_meeting",
  "مقابلة نهائية": "final_meeting",
};
const INTERVIEW_KEY_TO_LABEL = {
  "hr_meeting": "مقابلة HR",
  "technical_meeting": "مقابلة فنية",
  "manager_meeting": "مقابلة مدير",
  "final_meeting": "مقابلة نهائية",
};
// تحويل نتيجة المقابلة
const RESULT_TO_KEY = {
  "في الانتظار": "waiting",
  "ناجح": "accepted",
  "راسب": "rejected",
  "قيد المراجعة": "under_review",
};
const RESULT_KEY_TO_LABEL = {
  "waiting": "في الانتظار",
  "accepted": "ناجح",
  "rejected": "راسب",
  "under_review": "قيد المراجعة",
};
const STAGES = [
  { label: "جديد", value: "new" },
  { label: "فرز أولي", value: "first_stage" },
  { label: "مقابلة HR", value: "hr_meeting" },
  { label: "مقابلة فنية", value: "technical_meeting" },
  { label: "عرض وظيفي", value: "job_offering" },
  { label: "مقبول", value: "accepted" },
  { label: "مرفوض", value: "rejected" },
  { label: "انسحاب", value: "dropout" },
];
const STAGE_COLORS = {
  new: "bg-blue-100 text-blue-700",
  first_stage: "bg-indigo-100 text-indigo-700",
  hr_meeting: "bg-amber-100 text-amber-700",
  technical_meeting: "bg-orange-100 text-orange-700",
  job_offering: "bg-purple-100 text-purple-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  withdrawn: "bg-gray-100 text-gray-600",
};
const RESULT_COLORS = {
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  waiting: "bg-amber-100 text-amber-700",
  pending: "bg-gray-100 text-gray-600",
  under_review: "bg-gray-100 text-gray-600",
};
const STAGE_MAP = {
  new: "جديد",
  waiting: "قيد الاعتماد",
  accepted: "مقبول",
  rejected: "مرفوض",
};
const STAGE_LABELS = {
  new: "جديد",
  first_stage: "فرز أولي",
  hr_meeting: "مقابلة HR",
  under_review: "قيد المراجعة",
  technical_meeting: "مقابلة فنية",
  job_offering: "عرض وظيفي",
  accepted: "مقبول",
  rejected: "مرفوض",
  dropout: "انسحاب",
};

function JobForm({ departments, branches, onSave, onClose }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    job_title: "", department: "", branch: "", employment_type: "دوام كامل",
    vacancies_count: 1, salary_range_min: 0, salary_range_max: 0,
    description: "", skills: "", closing_date: "",
    req_experience_years: "", req_gender: "غير محدد", req_qualification: "",
    req_languages: "", req_age_range: "", req_other: "",
    reason: "", status: "قيد الاعتماد", notes: ""
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const salaryRangeInvalid =
    +form.salary_range_min > 0 &&
    +form.salary_range_max > 0 &&
    +form.salary_range_min > +form.salary_range_max;

  const handleSave = async () => {
    if (salaryRangeInvalid) {
      toast({
        title: "نطاق الراتب غير صحيح",
        description: "لا يمكن أن يكون الحد الأدنى للراتب أكبر من الحد الأقصى.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    await createJob({
      name: form.job_title,
      department_id: form.department,
      branch_id: form.branch,
      employment_type: form.employment_type,
      target: form.vacancies_count,
      min_salary: form.salary_range_min,
      max_salary: form.salary_range_max,
      submission_end_date: form.closing_date,
      job_description: form.description,
      required_skills: form.skills,
      years_of_experience: form.req_experience_years,
      gender:
        form.req_gender === "ذكر"
          ? "male"
          : form.req_gender === "أنثى"
            ? "female"
            : "any",
      qualification: form.req_qualification,
      languages: form.req_languages,
      age_range: form.req_age_range,
      other_requirement: form.req_other,
      reason: form.reason,
    });

    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" />طلب احتياج وظيفي جديد</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Basic Info */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">معلومات الوظيفة</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-medium">المسمى الوظيفي *</label>
                <input value={form.job_title} onChange={e => set("job_title", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">القسم *</label>
                <select
                  value={form.department}
                  onChange={e => set("department", e.target.value)}
                >
                  <option value="">اختر القسم...</option>

                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الفرع *</label>
                <select
                  value={form.branch}
                  onChange={e => set("branch", e.target.value)}
                >
                  <option value="">اختر الفرع...</option>

                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">نوع التوظيف *</label>
                <select value={form.employment_type} onChange={e => set("employment_type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  <option>دوام كامل</option><option>دوام جزئي</option><option>تدريب</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">عدد الشواغر</label>
                <input type="number" min={1} value={form.vacancies_count} onChange={e => set("vacancies_count", +e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الراتب من (ر.س)</label>
                <input type="number" min={0} value={form.salary_range_min} onChange={e => set("salary_range_min", +e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none ${salaryRangeInvalid ? "border-red-400" : "border-border"}`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الراتب إلى (ر.س)</label>
                <input type="number" min={0} value={form.salary_range_max} onChange={e => set("salary_range_max", +e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-background focus:outline-none ${salaryRangeInvalid ? "border-red-400" : "border-border"}`} />
                {salaryRangeInvalid && (
                  <p className="text-xs text-red-600">الحد الأدنى أكبر من الحد الأقصى</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">آخر موعد للتقديم</label>
                <input type="date" value={form.closing_date} onChange={e => set("closing_date", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
            </div>
            <div className="grid gap-3 mt-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">وصف الوظيفة</label>
                <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={3}
                  placeholder="اكتب وصفاً تفصيلياً للوظيفة والمهام..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">المهارات المطلوبة</label>
                <textarea value={form.skills} onChange={e => set("skills", e.target.value)} rows={2}
                  placeholder="مثال: Excel، التواصل الفعّال، إدارة الوقت..."
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">متطلبات المتقدم</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">سنوات الخبرة</label>
                <input value={form.req_experience_years} onChange={e => set("req_experience_years", e.target.value)} placeholder="مثال: 3-5 سنوات"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الجنس</label>
                <select value={form.req_gender} onChange={e => set("req_gender", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  <option>غير محدد</option><option>ذكر</option><option>أنثى</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">المؤهل العلمي</label>
                <input value={form.req_qualification} onChange={e => set("req_qualification", e.target.value)} placeholder="مثال: بكالوريوس إدارة أعمال"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">اللغات</label>
                <input value={form.req_languages} onChange={e => set("req_languages", e.target.value)} placeholder="مثال: العربية، الإنجليزية"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الفئة العمرية</label>
                <input value={form.req_age_range} onChange={e => set("req_age_range", e.target.value)} placeholder="مثال: 25-40 سنة"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">متطلبات أخرى</label>
                <input value={form.req_other} onChange={e => set("req_other", e.target.value)} placeholder="أي متطلبات إضافية"
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">سبب الاحتياج</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.job_title || !form.department || salaryRangeInvalid}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InterviewModal({ app, users, currentUser, onSave, onClose }) {
  const [interviews, setInterviews] = useState([]);

  // تحويل final_result من English لـ Arabic لعرضه في الـ select
  const [finalResult, setFinalResult] = useState(
    RESULT_KEY_TO_LABEL[app.final_result] || app.final_result || "قيد المراجعة"
  );
  const [hrNotes, setHrNotes] = useState(app.hr_notes || "");
  const [saving, setSaving] = useState(false);

  const [newInterview, setNewInterview] = useState({
    interview_type: "مقابلة HR", interview_date: "", interviewer_id: null, interviewer_name: "", interviewer_email: "", score: "", notes: "", result: "في الانتظار"
  });
  const normalizeMeetings = (meetings = []) => {
    return meetings.map(m => ({
      id: m.id || null,
      interview_type: INTERVIEW_KEY_TO_LABEL[m.type] || m.type_label || m.type || "مقابلة HR",
      interview_date: m.date ? m.date.split(" ")[0] : "",
      interviewer_id: m.interviewers?.[0]?.id || null,
      interviewer_name: m.interviewers?.[0]?.name || "",
      interviewer_email: m.interviewers?.[0]?.email || "",
      score: m.rating || 0,
      notes: m.notes || "",
      result: RESULT_KEY_TO_LABEL[m.result] || m.result_label || "في الانتظار",
    }));
  };
  useEffect(() => {
    if (app?.meetings) {
      setInterviews(normalizeMeetings(app.meetings));
    }
  }, [app]);

  useEffect(() => {
  
  }, [currentUser]);

  const matchesMe = (iv) =>
    (iv.interviewer_email && iv.interviewer_email === currentUser?.email) ||
    (!iv.interviewer_email && iv.interviewer_name && currentUser?.full_name &&
      iv.interviewer_name.trim().toLowerCase() === currentUser.full_name.trim().toLowerCase());

  const isHR =
    currentUser?.data?.role === "Admin" ||
    currentUser?.data?.role === "hr";
  
  const addInterview = () => {
    if (!newInterview.interview_date || !newInterview.interviewer_name) return;
    setInterviews(prev => [...prev, { ...newInterview, score: +newInterview.score || 0 }]);
    setNewInterview({ interview_type: "مقابلة HR", interview_date: "", interviewer_id: null, interviewer_name: "", interviewer_email: "", score: "", notes: "", result: "في الانتظار" });
  };

  const removeInterview = (idx) => setInterviews(prev => prev.filter((_, i) => i !== idx));

  const updateInterviewField = (idx, field, value) => {
    setInterviews(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };



  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. حفظ النتيجة النهائية وملاحظات HR على المتقدم
      // مزامنة المرحلة مع النتيجة النهائية
      const finalResultKey = RESULT_TO_KEY[finalResult] || finalResult;
      const updateData = {
        final_result: finalResultKey,
        hr_notes: hrNotes,
      };
      if (finalResultKey === "accepted") {
        updateData.stage = "accepted";
      } else if (finalResultKey === "rejected") {
        updateData.stage = "rejected";
      }
      await updateApplicant(app.id, updateData);

      // 2. تحديث المقابلات الموجودة (عندها id)
      const meetingUpdates = interviews
        .filter(iv => iv.id)
        .map(iv => {
          const payload = {
            rating: String(iv.score || 0),
            notes: iv.notes || "",
            result: RESULT_TO_KEY[iv.result] || iv.result || "waiting",
          };
          return updateMeeting(iv.id, payload)
            .catch(e => console.warn("meeting update failed:", iv.id, e));
        });

      // 3. إنشاء المقابلات الجديدة (بدون id)
      const newMeetings = interviews
        .filter(iv => !iv.id)
        .map(iv =>
          addApplicantMeeting(app.id, {
            type: INTERVIEW_TYPE_TO_KEY[iv.interview_type] || "hr_meeting",
            date: iv.interview_date ? `${iv.interview_date} 09:00:00` : null,
            interviewer_ids: iv.interviewer_id ? [iv.interviewer_id] : [],
            rating: String(iv.score || 0),
            notes: iv.notes || "",
            result: RESULT_TO_KEY[iv.result] || "waiting",
          }).catch(e => console.warn("meeting create failed:", e))
        );

      await Promise.all([...meetingUpdates, ...newMeetings]);
      onSave();
    } catch (err) {
      console.error("Error saving interviews:", err);
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const avgScore = interviews.length > 0
    ? (interviews.reduce((s, i) => s + (+i.score || 0), 0) / interviews.length).toFixed(1)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />إدارة المقابلات</h3>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-xs text-muted-foreground">{app.applicant_name} — {app.job_title}</p>
              {app.cv_url && (
                <a href={resolveFileUrl(app.cv_url)} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="w-3 h-3" />السيرة الذاتية
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary */}
          {interviews.length > 0 && (
            <div className="flex items-center gap-4 bg-muted/30 rounded-xl p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{avgScore}</p>
                <p className="text-xs text-muted-foreground">متوسط التقييم</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{interviews.length}</p>
                <p className="text-xs text-muted-foreground">مقابلة</p>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">آخر مقابلة</p>
                <p className="text-sm font-medium">{interviews[interviews.length - 1]?.interview_type} — {interviews[interviews.length - 1]?.interviewer_name}</p>
              </div>
            </div>
          )}

          {/* Existing Interviews */}
          {interviews.map((iv, idx) => {
            const canEditThis = isHR || matchesMe(iv);
            return (
              <div key={idx} className={`border rounded-xl p-4 space-y-3 ${matchesMe(iv) ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{iv.interview_type}</span>
                    {matchesMe(iv) && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">أنت المحاور</span>
                    )}
                  </div>
                  {isHR && <button onClick={() => removeInterview(idx)} className="text-red-500 hover:text-red-700 text-xs">حذف</button>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">نوع المقابلة</label>
                    <select value={iv.interview_type} onChange={e => updateInterviewField(idx, "interview_type", e.target.value)}
                      disabled={!canEditThis}
                      className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none disabled:opacity-60">
                      <option>مقابلة HR</option><option>مقابلة فنية</option><option>مقابلة مدير</option><option>مقابلة نهائية</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">التاريخ</label>
                    <input type="date" value={iv.interview_date} onChange={e => updateInterviewField(idx, "interview_date", e.target.value)}
                      disabled={!canEditThis}
                      className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none disabled:opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">المحاور</label>
                    {isHR ? (
                      <select value={iv.interviewer_id ? String(iv.interviewer_id) : ""} onChange={e => {
                        const u = users.find(x => String(x.id) === e.target.value);
                        setInterviews(prev => prev.map((item, i) => i === idx ? {
                          ...item,
                          interviewer_id: u?.id || null,
                          interviewer_email: u?.email || "",
                          interviewer_name: u?.full_name || u?.name || ""
                        } : item));
                      }} className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none">
                        <option value="">اختر محاوراً...</option>
                        {users.map(u => <option key={u.id} value={String(u.id)}>{u.full_name || u.name} ({u.role || u.job_title})</option>)}
                      </select>
                    ) : (
                      <p className="px-2 py-1.5 text-xs border border-border rounded-lg bg-muted/30">{iv.interviewer_name}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">التقييم (1-10)</label>
                    <input type="number" min={1} max={10} value={iv.score} onChange={e => updateInterviewField(idx, "score", +e.target.value)}
                      disabled={!canEditThis}
                      className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none disabled:opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">النتيجة</label>
                    <select value={iv.result} onChange={e => updateInterviewField(idx, "result", e.target.value)}
                      disabled={!canEditThis}
                      className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none disabled:opacity-60">
                      <option>في الانتظار</option><option>ناجح</option><option>راسب</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">ملاحظات</label>
                    <input value={iv.notes} onChange={e => updateInterviewField(idx, "notes", e.target.value)}
                      disabled={!canEditThis}
                      className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none disabled:opacity-60" />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Interview — HR only */}
          {isHR && (
            <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 space-y-3 bg-primary/5">
              <p className="text-sm font-semibold text-primary">+ إضافة مقابلة جديدة</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">نوع المقابلة</label>
                  <select value={newInterview.interview_type} onChange={e => setNewInterview(f => ({ ...f, interview_type: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none">
                    <option>مقابلة HR</option><option>مقابلة فنية</option><option>مقابلة مدير</option><option>مقابلة نهائية</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">التاريخ *</label>
                  <input type="date" value={newInterview.interview_date} onChange={e => setNewInterview(f => ({ ...f, interview_date: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-muted-foreground">المحاور *</label>
                  <select value={newInterview.interviewer_id || ""} onChange={e => {
                    const u = users.find(x => String(x.id) === e.target.value);
                    setNewInterview(f => ({ ...f, interviewer_id: u?.id || null, interviewer_name: u?.full_name || u?.name || "", interviewer_email: u?.email || "" }));
                  }}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none">
                    <option value="">اختر المحاور...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name || u.name} ({u.role || u.job_title})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">التقييم (1-10)</label>
                  <input type="number" min={1} max={10} value={newInterview.score} onChange={e => setNewInterview(f => ({ ...f, score: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">ملاحظات</label>
                  <input value={newInterview.notes} onChange={e => setNewInterview(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-2 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none" />
                </div>
              </div>
              <button onClick={addInterview} disabled={!newInterview.interview_date || !newInterview.interviewer_name}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-50">
                إضافة المقابلة
              </button>
            </div>
          )}

          {/* Final Result — HR only */}
          {isHR && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">النتيجة النهائية</label>
                <select value={finalResult} onChange={e => setFinalResult(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                  <option>قيد المراجعة</option><option>ناجح</option><option>راسب</option><option>في الانتظار</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">ملاحظات HR الداخلية</label>
                <input value={hrNotes} onChange={e => setHrNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "حفظ التقييمات"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Recruitment() {
  const confirmDialog = useConfirm();
  const { user, canDo } = useRole();
  const canCreate = canDo("recruitment", "create");
  const canApprove = canDo("recruitment", "approve");
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState(window.location.hash === "#my-interviews" ? "my-interviews" : "jobs");
  const [selectedJob, setSelectedJob] = useState(null);
  const [interviewApp, setInterviewApp] = useState(null);
  const [search, setSearch] = useState("");
  const [applicants, setApplicants] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (err) {
        console.error(err);
      }
    };

    loadUser();
  }, []);


  const load = async () => {
    setLoading(true);
    try {
      const [jobsResponse, departmentsResponse, branchesResponse, applicantsData] =
        await Promise.all([
          getJobs(),
          getDepartments(),
          getBranches(),
          getApplicants(),
        ]);

      setJobs(jobsResponse.data || []);
      setDepartments(departmentsResponse.data || []);
      setBranches(branchesResponse.data || []);
      setApplicants(applicantsData);

      // users (للمحاورين) — نحمّلهم منفصل عشان لو فشلوا ما يكسروا بقية البيانات
      try {
        const usersData = await getEmployees();
        const empList = usersData?.data || usersData || [];
        setUsers(Array.isArray(empList) ? empList : []);
      } catch (_) {
        // مش critical — نكمل بدونهم
      }
    } catch (err) {
      console.error("Recruitment load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const approveJob = async (id) => {
    const ok = await confirmDialog({
      title: "اعتماد الوظيفة",
      message: "هل أنت متأكد من اعتماد هذه الوظيفة؟",
      confirmText: "اعتماد",
    });
    if (!ok) return;
    await acceptJob(id);
    load();
  };

  const rejectJob = async (id) => {
    const ok = await confirmDialog({
      title: "رفض الوظيفة",
      message: "هل أنت متأكد من رفض هذه الوظيفة؟",
      confirmText: "رفض",
      variant: "destructive",
    });
    if (!ok) return;
    await rejectJobApi(id);
    load();
  };
  const updateStage = async (appId, stage) => {
    await updateApplicant(appId, { stage });
    load();
  };

  const displayedApps = selectedJob
    ? applicants.filter(a => a.job_id === selectedJob.id)
    : applicants.filter(a => !search || a.applicant_name?.includes(search) || a.job_title?.includes(search));

  const activeJobs = jobs.filter(
    j => j.state === "accepted"
  );

  const pendingJobs = jobs.filter(
    j => j.state === "under_review"
  );
  const isMyInterview = (iv) => {
    if (!currentUser) return false;
    // currentUser قد يكون { data: { id, email, ... } } أو { id, email, ... }
    const me = currentUser?.data || currentUser;
    const myId = me?.employee_id || me?.id;
    const myEmail = me?.email;
    const myName = me?.full_name || me?.name;

    // مقارنة بالـ id (الأدق)
    if (myId && iv.interviewer_id && Number(iv.interviewer_id) === Number(myId)) return true;
    // مقارنة بالـ email
    if (myEmail && iv.interviewer_email && iv.interviewer_email.toLowerCase() === myEmail.toLowerCase()) return true;
    // fallback بالاسم
    if (myName && iv.interviewer_name &&
      iv.interviewer_name.trim().toLowerCase() === myName.trim().toLowerCase()) return true;

    return false;
  };

  // My interviews — الـ applicants من الـ backend بييجوا بـ meetings
  // normalizeMeetings بتحول meetings → interviews format في الـ modal
  // هنا نشيك على كلا الـ fields
  const myInterviewApps = applicants.filter(a => {
    const meetings = a.meetings || a.interviews || [];
    return meetings.some(m => {
      // raw meeting من الـ backend
      const interviewerIds = m.interviewers?.map(i => i.id) || [];
      const me = currentUser?.data || currentUser;
      const myId = me?.employee_id || me?.id;
      const myEmail = me?.email;
      const myName = me?.full_name || me?.name;

      if (myId && interviewerIds.includes(Number(myId))) return true;
      if (myEmail && m.interviewers?.some(i => i.email?.toLowerCase() === myEmail?.toLowerCase())) return true;
      if (myName && m.interviewers?.some(i => i.name?.trim().toLowerCase() === myName?.trim().toLowerCase())) return true;
      return false;
    });
  });

  const saveMyInterviewResult = async (app, ivIdx, field, value) => {
    const meetings = app.meetings || app.interviews || [];
    const meeting = meetings[ivIdx];
    if (!meeting || !meeting.id) return;

    // تحويل الـ field name للـ backend format
    const fieldMap = { score: "rating", result: "result", notes: "notes" };
    const backendField = fieldMap[field] || field;
    const backendValue = field === "score" ? String(+value)
      : field === "result" ? (RESULT_TO_KEY[value] || value)
        : value;

    await updateMeeting(meeting.id, { [backendField]: backendValue })
      .catch(e => console.warn("saveMyInterviewResult failed:", e));
    load();
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><UserPlus className="w-6 h-6 text-primary" />التوظيف والمرشحون</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة طلبات الاحتياج الوظيفي والمتقدمين</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            <Plus className="w-4 h-4" />طلب وظيفي جديد
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "وظائف نشطة", value: activeJobs.length, color: "text-green-600" },
          { label: "قيد الاعتماد", value: pendingJobs.length, color: "text-amber-600" },
          { label: "إجمالي المتقدمين", value: applicants.length, color: "text-primary" },
          { label: "مقبولون", value: applicants.filter(a => a.stage === "accepted" || a.stage === "مقبول").length, color: "text-secondary" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { id: "jobs", label: `الوظائف (${jobs.length})` },
          { id: "applications", label: `المتقدمون (${applicants.length})` },
          { id: "my-interviews", label: myInterviewApps.length > 0 ? `مقابلاتي (${myInterviewApps.length})` : "مقابلاتي" },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setSelectedJob(null); }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "jobs" && (
        <div className="space-y-3">
          {pendingJobs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-sm font-semibold text-amber-800 mb-2">⏳ تنتظر الاعتماد:</p>
              <div className="space-y-2">
                {pendingJobs.map(j => (
                  <div key={j.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-amber-100">
                    <div>
                      <p className="font-medium text-sm text-foreground">{j.name}</p>
                      <p className="text-xs text-muted-foreground">{j.department_name} {j.branch_name ? `— ${j.branch_name}` : ""} — {j.target} شاغر · {j.employment_type}</p>
                    </div>
                    {canApprove && (
                      <div className="flex gap-2">
                        <button onClick={() => approveJob(j.id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200">
                          <CheckCircle className="w-3.5 h-3.5" />اعتماد
                        </button>
                        <button onClick={() => rejectJob(j.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200">
                          <XCircle className="w-3.5 h-3.5" />رفض
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["المسمى", "القسم / الفرع", "نوع التوظيف", "الشواغر", "الراتب", "آخر موعد", "المتقدمون", "الحالة", "إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
                  : jobs.length === 0 ? <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">لا توجد وظائف</td></tr>
                    : jobs.map(j => {
                      const appCount = applications.filter(a => a.recruitment_id === j.id).length;
                      return (
                        <tr key={j.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                          <td className="px-4 py-3 font-medium text-foreground">{j.name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <p>  {j.department_name || "-"}

                            </p>
                            {j.branch_name && <p className="text-muted-foreground/70">{j.branch_name}</p>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{j.employment_type}</td>
                          <td className="px-4 py-3 text-center font-semibold">{j.target}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {j.min_salary > 0 ? `${j.min_salary?.toLocaleString("ar-SA")} - ${j.max_salary?.toLocaleString("ar-SA")}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{j.submission_end_date ? new Date(j.submission_end_date).toLocaleDateString("ar-SA") : "—"}</td>
                          <td className="px-4 py-3 text-center"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{j.total_applicants}</span></td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${j.state === "accepted" ? "bg-green-100 text-green-700" :
                              j.state === "under_review" ? "bg-amber-100 text-amber-700" :
                                j.state === "rejected" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                              {j.state_label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setSelectedJob(j); setActiveTab("applications"); }}
                              className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <Eye className="w-3.5 h-3.5" />المتقدمون
                            </button>
                          </td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "applications" && (
        <div className="space-y-4">
          {selectedJob ? (
            <div className="flex items-center gap-3 bg-primary/5 rounded-xl px-4 py-3">
              <button onClick={() => setSelectedJob(null)} className="text-sm text-primary hover:underline">كل الوظائف</button>
              <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
              <span className="font-semibold text-sm text-foreground">{selectedJob.job_title}</span>
              <span className="text-xs text-muted-foreground">({displayedApps.length} متقدم)</span>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم المتقدم أو الوظيفة..."
                className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-card focus:outline-none" />
            </div>
          )}

          <div className="bg-card rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["المتقدم", "الوظيفة", "التواصل", "الخبرة", "الراتب المتوقع", "المرحلة", "التقييم", "النتيجة", "مقابلات", "تغيير المرحلة"].map(h => (
                  <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {displayedApps.length === 0
                  ? <tr><td colSpan={10} className="text-center py-8 text-muted-foreground">لا توجد طلبات</td></tr>
                  : displayedApps.map(app => {
                    const avgScore = app.interviews?.length > 0
                      ? (app.interviews.reduce((s, i) => s + (+i.score || 0), 0) / app.interviews.length).toFixed(1)
                      : null;
                    return (
                      <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                        <td className="px-3 py-3">
                          <p className="font-medium text-foreground">{app.applicant_name}</p>
                          <p className="text-xs text-muted-foreground">{app.nationality}</p>
                          {app.resume_url && (
                            <a href={resolveFileUrl(app.resume_url)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                              <ExternalLink className="w-3 h-3" />CV
                            </a>
                          )}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">{app.job_title}</td>
                        <td className="px-3 py-3">
                          <p className="text-xs" dir="ltr">{app.email}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{app.phone}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-xs font-medium">{app.experience_years} سنة</td>
                        <td className="px-3 py-3 text-xs text-green-600 font-semibold">{app.expected_salary > 0 ? `${app.expected_salary?.toLocaleString("ar-SA")} ر.س` : "—"}</td>
                        <td className="px-3 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[app.stage]}`}>{STAGE_LABELS[app.stage]}</span></td>
                        <td className="px-3 py-3 text-center">
                          {avgScore ? <span className="font-bold text-amber-600 flex items-center gap-0.5 justify-center"><Star className="w-3 h-3" />{avgScore}</span> : "—"}
                        </td>
                        <td className="px-3 py-3">
                          {app.final_result ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_COLORS[app.final_result] || "bg-gray-100 text-gray-600"}`}>{STAGE_MAP[app.final_result]}</span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => setInterviewApp(app)}
                            className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20">
                            <Calendar className="w-3 h-3" />
                            {app.total_meetings || 0} مقابلة
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={app.stage}
                            onChange={e => updateStage(app.id, e.target.value)}
                          >
                            {STAGES.map(s => (
                              <option key={s.value} value={s.value}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "my-interviews" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            هذه المقابلات المخصصة لك — يمكنك تسجيل تقييمك ونتيجة كل مقابلة مباشرة.
          </div>
          {myInterviewApps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد مقابلات مخصصة لك</p>
            </div>
          ) : myInterviewApps.map(app => {
            const myInterviews = (app.meetings || app.interviews || [])
              .map((m, idx) => ({
                _idx: idx,
                id: m.id || null,
                interview_type: INTERVIEW_KEY_TO_LABEL[m.type] || m.type_label || m.type || "مقابلة HR",
                interview_date: m.date ? m.date.split(" ")[0] : "",
                interviewer_id: m.interviewers?.[0]?.id || null,
                interviewer_name: m.interviewers?.[0]?.name || "",
                interviewer_email: m.interviewers?.[0]?.email || "",
                score: m.rating || 0,
                notes: m.notes || "",
                result: RESULT_KEY_TO_LABEL[m.result] || m.result_label || "في الانتظار",
              }))
              .filter(iv => isMyInterview(iv));
            return (
              <div key={app.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Applicant header */}
                <div className="flex items-center justify-between px-5 py-4 bg-muted/20 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">{app.applicant_name}</p>
                    <p className="text-xs text-muted-foreground">{app.job_title} {app.nationality ? `· ${app.nationality}` : ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.cv_url && (
                      <a href={resolveFileUrl(app.cv_url)} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <ExternalLink className="w-3.5 h-3.5" />السيرة الذاتية
                      </a>
                    )}
                    {app.final_result && app.final_result !== "under_review" ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_COLORS[app.final_result] || "bg-gray-100 text-gray-600"}`}>
                        {RESULT_KEY_TO_LABEL[app.final_result] || app.final_result}
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STAGE_COLORS[app.stage]}`}>
                        {STAGE_LABELS[app.stage] || app.stage_label || app.stage}
                      </span>
                    )}
                  </div>
                </div>
                {/* My interviews for this applicant */}
                <div className="divide-y divide-border">
                  {myInterviews.map(iv => (
                    <div key={iv._idx} className="px-5 py-4 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">{iv.interview_type}</span>
                        {iv.interview_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />{new Date(iv.interview_date).toLocaleDateString("ar-SA")}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">التقييم (1-10)</label>
                          <input
                            type="number" min={1} max={10}
                            defaultValue={iv.score || ""}
                            onBlur={e => saveMyInterviewResult(app, iv._idx, "score", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="من 1 إلى 10"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-muted-foreground">النتيجة</label>
                          <select
                            value={iv.result || "في الانتظار"}
                            onChange={e => saveMyInterviewResult(app, iv._idx, "result", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <option>في الانتظار</option>
                            <option>ناجح</option>
                            <option>راسب</option>
                          </select>
                        </div>
                        <div className="space-y-1 col-span-2 sm:col-span-1">
                          <label className="text-xs font-medium text-muted-foreground">ملاحظات</label>
                          <input
                            type="text"
                            defaultValue={iv.notes || ""}
                            onBlur={e => saveMyInterviewResult(app, iv._idx, "notes", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="أضف ملاحظاتك..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <JobForm departments={departments} branches={branches} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
      {interviewApp && <InterviewModal app={interviewApp} users={users} currentUser={currentUser} onSave={() => { setInterviewApp(null); load(); }} onClose={() => setInterviewApp(null)} />}
    </div>
  );
}