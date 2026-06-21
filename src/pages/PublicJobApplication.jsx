import { useState, useEffect } from "react";
import { Send, CheckCircle, Briefcase, Upload, ArrowRight, MapPin, Clock, Star, ChevronDown } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getJobs, applyForJob ,activeJobs } from "@/api/jobsApi"; // أو نفس الملف

function JobCard({ job, selected, onClick }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-xl border-2 transition-all ${selected ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40 bg-white"}`}>
      <button className="w-full text-right p-4" onClick={onClick}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-slate-800">{job.job_title}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                job.employment_type === "دوام كامل" ? "bg-blue-100 text-blue-700" :
                job.employment_type === "دوام جزئي" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
              }`}>{job.employment_type}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1"><Briefcase className="w-3 h-3"/>{job.department}</span>
              {job.branch && <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3"/>{job.branch}</span>}
              {job.closing_date && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3"/>آخر موعد: {new Date(job.closing_date).toLocaleDateString("ar-SA")}</span>}
            </div>
            {job.salary_range_min > 0 && (
              <p className="text-xs text-green-600 mt-1 font-semibold">
                {job.salary_range_min?.toLocaleString("ar-SA")} — {job.salary_range_max?.toLocaleString("ar-SA")} ر.س
              </p>
            )}
          </div>
          {selected && <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1"/>}
        </div>
      </button>

      {/* Job Details Toggle */}
      {(job.description || job.skills || job.req_experience_years || job.req_qualification) && (
        <div className="border-t border-slate-100">
          <button onClick={e=>{e.stopPropagation();setExpanded(v=>!v);}}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-500 hover:bg-slate-50">
            <span>{expanded ? "إخفاء التفاصيل" : "عرض تفاصيل الوظيفة"}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded?"rotate-180":""}`}/>
          </button>
          {expanded && (
            <div className="px-4 pb-4 space-y-3">
              {job.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">وصف الوظيفة</p>
                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">{job.description}</p>
                </div>
              )}
              {job.skills && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-1">المهارات المطلوبة</p>
                  <p className="text-xs text-slate-500">{job.skills}</p>
                </div>
              )}
              {(job.req_experience_years || job.req_qualification || job.req_languages || job.req_gender !== "غير محدد" || job.req_age_range || job.req_other) && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">متطلبات المتقدم</p>
                  <div className="grid grid-cols-2 gap-2">
                    {job.req_experience_years && <Req label="الخبرة" value={job.req_experience_years}/>}
                    {job.req_qualification && <Req label="المؤهل" value={job.req_qualification}/>}
                    {job.req_languages && <Req label="اللغات" value={job.req_languages}/>}
                    {job.req_gender && job.req_gender !== "غير محدد" && <Req label="الجنس" value={job.req_gender}/>}
                    {job.req_age_range && <Req label="الفئة العمرية" value={job.req_age_range}/>}
                    {job.req_other && <Req label="أخرى" value={job.req_other} className="col-span-2"/>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Req({ label, value, className = "" }) {
  return (
    <div className={`bg-slate-50 rounded-lg px-3 py-2 ${className}`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-xs font-medium text-slate-700">{value}</p>
    </div>
  );
}

export default function PublicJobApplication() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [form, setForm] = useState({
    applicant_name: "", email: "", phone: "", nationality: "",
    experience_years: 0, current_salary: 0, expected_salary: 0, cover_letter: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

 useEffect(() => {
  activeJobs()
    .then((res) => {
      const jobsData = res.data || res; // 👈 أهم سطر

      const jobsList = Array.isArray(jobsData)
        ? jobsData
        : [jobsData]; // لو جاي single job

      const mapped = jobsList
        .filter(job => job.active === true || job.state === "accepted")
        .map(job => ({
          id: job.id,
          job_title: job.name,
          department: job.department_name,
          branch: job.branch_name,
          employment_type: job.employment_type_label,
          salary_range_min: job.min_salary,
          salary_range_max: job.max_salary,
          closing_date: job.submission_end_date,
          description: job.job_description,
          skills: job.required_skills,
          req_experience_years: job.years_of_experience,
          req_gender: job.gender_label,
          req_qualification: job.qualification,
          req_languages: job.languages,
          req_age_range: job.age_range,
          req_other: job.other_requirement,
        }));

      setJobs(mapped);
      setLoading(false);
    })
    .catch((err) => {
      console.log("Jobs API error:", err);
      setJobs([]);
      setLoading(false);
    });
}, []);

const handleCvUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploading(true);

  setTimeout(() => {
    setCvFile(file);
    setUploading(false);
  }, 800);
};

const handleSubmit = async () => {
  if (!selectedJob || !form.applicant_name || !form.email || !form.phone) return;

  setSaving(true);

  await applyForJob(selectedJob.id, {
    full_name: form.applicant_name,
    nationality: form.nationality,
    email: form.email,
    mobile_no: form.phone,
    years_of_experience: form.experience_years,
    current_salary: form.current_salary,
    expected_salary: form.expected_salary,
    cover_letter: form.cover_letter,
    resume: cvFile, // هنشرحها تحت
  });

  setSubmitted(true);
  setSaving(false);
};

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">تم استلام طلبك!</h2>
          <p className="text-slate-500 text-sm mb-6">شكراً لتقديمك على وظيفة <span className="font-semibold text-slate-700">{selectedJob?.job_title}</span>. سيتم التواصل معك قريباً.</p>
          <button onClick={() => {
            setSubmitted(false); setSelectedJob(null); setCvUrl("");
            setForm({ applicant_name: "", email: "", phone: "", nationality: "", experience_years: 0, current_salary: 0, expected_salary: 0, cover_letter: "" });
          }} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
            تقديم طلب آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-3">
        <img src="https://media.base44.com/images/public/69f7177c4ad8b8c70dc86a2e/dfe020004_Soldevwhitelogo.png"
          className="h-8 object-contain invert" alt="SOLDEV" />
        <div className="h-5 w-px bg-slate-200 mx-2" />
        <span className="text-sm font-medium text-slate-700">التقديم على الوظائف</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">وظائف شاغرة</h1>
          <p className="text-slate-500 mt-2 text-sm">اختر الوظيفة المناسبة، اطلع على تفاصيلها، ثم قدم طلبك</p>
        </div>

        {/* Job Listings */}
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2"><Briefcase className="w-5 h-5 text-primary"/>الوظائف المتاحة</h2>
          {loading ? (
            <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin"/></div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-slate-200">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-30"/>
              <p className="text-sm">لا توجد وظائف شاغرة حالياً</p>
            </div>
          ) : jobs.map(job => (
            <JobCard key={job.id} job={job} selected={selectedJob?.id===job.id}
              onClick={() => setSelectedJob(selectedJob?.id===job.id ? null : job)}/>
          ))}
        </div>

        {/* Application Form */}
        {selectedJob && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary"/>
              <h2 className="font-bold text-slate-800">تقديم على: <span className="text-primary">{selectedJob.job_title}</span></h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">الاسم الكامل *</label>
                <input value={form.applicant_name} onChange={e=>set("applicant_name",e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">الجنسية</label>
                <input value={form.nationality} onChange={e=>set("nationality",e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">البريد الإلكتروني *</label>
                <input type="email" value={form.email} onChange={e=>set("email",e.target.value)} dir="ltr"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">رقم الجوال *</label>
                <input type="tel" value={form.phone} onChange={e=>set("phone",e.target.value)} dir="ltr"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">سنوات الخبرة</label>
                <input type="number" min={0} value={form.experience_years} onChange={e=>set("experience_years",+e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">الراتب الحالي (ر.س)</label>
                <input type="number" min={0} value={form.current_salary} onChange={e=>set("current_salary",+e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-sm font-medium text-slate-700">الراتب المتوقع (ر.س)</label>
                <input type="number" min={0} value={form.expected_salary} onChange={e=>set("expected_salary",+e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">خطاب التقديم</label>
              <textarea value={form.cover_letter} onChange={e=>set("cover_letter",e.target.value)} rows={3}
                placeholder="اكتب نبذة عن نفسك وسبب اهتمامك بهذه الوظيفة..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"/>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">السيرة الذاتية (PDF)</label>
          {cvFile ? (
  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
    <CheckCircle className="w-4 h-4 text-green-600"/>
    <span className="text-sm text-green-700 flex-1">
      تم اختيار الملف: {cvFile.name}
    </span>
    <button onClick={() => setCvFile(null)} className="text-xs text-red-500 hover:text-red-700">✕</button>
  </div>
) : (
  <label className="flex items-center gap-3 p-4 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors">
    <Upload className="w-5 h-5 text-primary"/>
    <span className="text-sm text-slate-500">
      {uploading ? "جاري الرفع..." : "اضغط لرفع السيرة الذاتية (PDF، Word)"}
    </span>
    <input
      type="file"
      className="hidden"
      accept=".pdf,.doc,.docx"
      onChange={handleCvUpload}
      disabled={uploading}
    />
  </label>
)}
            </div>

            <button onClick={handleSubmit}
              disabled={saving || !form.applicant_name || !form.email || !form.phone}
              className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Send className="w-4 h-4"/>{saving?"جاري الإرسال...":"إرسال الطلب"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}