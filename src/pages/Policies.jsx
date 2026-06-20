import { useState, useEffect } from "react";
import { Plus, BookOpen, Upload, Trash2, Edit, ExternalLink, Save, X, FileText } from "lucide-react";
import {
  getCompanyPolicies,
  createCompanyPolicy,
  updateCompanyPolicy,
  deleteCompanyPolicy,
  downloadCompanyPolicy,
} from "@/api/companyPoliciesApi";

const CATEGORIES = ["الإجازات والغياب", "السلوك المهني", "الرواتب والمزايا", "الصحة والسلامة", "الأمن المعلوماتي", "أخرى"];

const CATEGORY_COLORS = {
  "الإجازات والغياب": "bg-blue-100 text-blue-700",
  "السلوك المهني": "bg-purple-100 text-purple-700",
  "الرواتب والمزايا": "bg-green-100 text-green-700",
  "الصحة والسلامة": "bg-red-100 text-red-700",
  "الأمن المعلوماتي": "bg-gray-100 text-gray-700",
  "أخرى": "bg-amber-100 text-amber-700",
};


function PolicyForm({ policy, onSave, onClose }) {
  const [form, setForm] = useState({
    title: "",
    title_en: "",
    category: "الإجازات والغياب",
    description: "",
    file_url: "",
    version: "",
    effective_date: "",
    is_active: true,
    ...(policy || {}),
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [fileBase64, setFileBase64] = useState("");
  const [fileName, setFileName] = useState("");

  const set = (k, v) =>
    setForm((f) => ({ ...f, [k]: v }));

  // =========================
  // CONVERT FILE TO BASE64
  // =========================
  const convertFileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = () => {
        const base64 =
          reader.result.split(",")[1];

        resolve(base64);
      };

      reader.onerror = reject;
    });

  // =========================
  // HANDLE FILE
  // =========================
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setUploading(true);

      const base64 =
        await convertFileToBase64(file);

      setFileBase64(base64);

      setFileName(file.name);

    } catch (err) {
      console.error(err);

      alert("فشل رفع الملف");
    } finally {
      setUploading(false);
    }
  };

  // =========================
  // SAVE
  // =========================
const handleSave = async () => {
  setSaving(true);

  try {
    const formData = new FormData();

    formData.append("policy_title", form.title);
    formData.append("title_en", form.title_en);

    const policyClass = Object.keys(POLICY_CATEGORY_MAP).find(
      (key) => POLICY_CATEGORY_MAP[key] === form.category
    );

    formData.append("policy_class", policyClass);

    formData.append("description", form.description);
    formData.append("version", form.version);
    formData.append("effective_date", form.effective_date);
    formData.append("post_for_employees", form.is_active);

    // 👇 FILE HERE (important)
    if (fileBase64) {
      const file = new File(
        [Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0))],
        fileName
      );

      formData.append("policy_pdf", file);
    }

    console.log("FORMDATA =>", formData);

    if (policy?.id) {
      await updateCompanyPolicy(policy.id, formData);
    } else {
      await createCompanyPolicy(formData);
    }

    onSave();
  } catch (err) {
    console.error("ERROR:", err?.response?.data || err);
    alert("فشل الحفظ");
  } finally {
    setSaving(false);
  }
}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">
            {policy
              ? "تعديل السياسة"
              : "إضافة سياسة جديدة"}
          </h3>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                عنوان السياسة *
              </label>

              <input
                value={form.title}
                onChange={(e) =>
                  set(
                    "title",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                Policy Title (EN)
              </label>

              <input
                value={form.title_en}
                onChange={(e) =>
                  set(
                    "title_en",
                    e.target.value
                  )
                }
                dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              التصنيف
            </label>

            <select
              value={form.category}
              onChange={(e) =>
                set(
                  "category",
                  e.target.value
                )
              }
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option
                  key={c}
                  value={c}
                >
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              وصف مختصر
            </label>

            <textarea
              value={form.description}
              onChange={(e) =>
                set(
                  "description",
                  e.target.value
                )
              }
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                الإصدار
              </label>

              <input
                value={form.version}
                onChange={(e) =>
                  set(
                    "version",
                    e.target.value
                  )
                }
                placeholder="1.0"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">
                تاريخ السريان
              </label>

              <input
                type="date"
                value={
                  form.effective_date
                }
                onChange={(e) =>
                  set(
                    "effective_date",
                    e.target.value
                  )
                }
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* FILE UPLOAD */}
          <div className="space-y-2">

            <label className="text-sm font-medium text-foreground">
              رفع ملف السياسة
            </label>

            {fileName ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">

                <FileText className="w-4 h-4 text-green-700" />

                <span className="text-xs text-green-700 flex-1 truncate">
                  ✅ {fileName}
                </span>

                <button
                  onClick={() => {
                    setFileBase64("");
                    setFileName("");
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">

                <Upload className="w-5 h-5 text-muted-foreground" />

                <span className="text-sm text-muted-foreground">
                  {uploading
                    ? "جاري الرفع..."
                    : "اضغط لرفع ملف"}
                </span>

                <input
                  type="file"
                  accept="*"
                  className="hidden"
                  onChange={
                    handleFileUpload
                  }
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                set(
                  "is_active",
                  e.target.checked
                )
              }
              className="w-4 h-4 accent-primary"
            />

            <span className="text-sm text-foreground">
              منشور للموظفين
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">

          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={
              saving || !form.title
            }
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />

            {saving
              ? "جاري الحفظ..."
              : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}



export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");

 const load = async () => {
  try {
    setLoading(true);

    const data = await getCompanyPolicies();

    const list = data?.data || data || [];
    console.log("data is",list)
console.log("RAW API RESPONSE:", data);
console.log("LIST:", list);
    // 🔥 IMPORTANT: normalize API -> UI shape (WITHOUT changing UI)
   const normalized = list.map((p) => ({
  id: p.id,
  title: p.policy_title,
  title_en: p.title_en,
  description: p.description,

  // 👇 المهم هنا
  category: POLICY_CATEGORY_MAP[p.policy_class] || "أخرى",

  version: p.version,
  effective_date: p.effective_date,
  is_active: p.post_for_employees,
  has_pdf: p.has_pdf,
file_name: p.policy_pdf_filename,
file_url: p.policy_pdf || p.file_url || null
}));
console.log("NORMALIZED:", normalized);
    setPolicies(normalized);
    console.log("POLICIES STATE:", policies);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { load(); }, []);

 const deletePolicy = async (id) => {
  if (!confirm("هل أنت متأكد من حذف هذه السياسة؟")) return;

  try {
    await deleteCompanyPolicy(id);
    load();
  } catch (err) {
    console.error(err);
    alert("فشل الحذف");
  }
};
const handleOpen = async (id) => {
  const url = await downloadCompanyPolicy(id);

};
  const filtered = filterCategory ? policies.filter(p => p.category === filterCategory) : policies;
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(p => p.category === cat);
    if (items.length) acc[cat] = items;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">سياسات الشركة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة ونشر السياسات واللوائح الداخلية بصيغة PDF</p>
        </div>
        <button onClick={() => { setEditPolicy(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium">
          <Plus className="w-4 h-4" />إضافة سياسة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{policies.length}</p>
          <p className="text-xs text-muted-foreground mt-1">إجمالي السياسات</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{policies.filter(p => p.is_active).length}</p>
          <p className="text-xs text-muted-foreground mt-1">منشورة</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{policies.filter(p => p.has_pdf).length}</p>
          <p className="text-xs text-muted-foreground mt-1">برفق ملف PDF</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCategory("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!filterCategory ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
          الكل
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterCategory === cat ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Policies Grid */}
      {loading ? (
        <p className="text-center py-10 text-muted-foreground text-sm">جاري التحميل...</p>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">لا توجد سياسات. ابدأ بإضافة أول سياسة للشركة.</p>
        </div>
      ) : Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full ${CATEGORY_COLORS[cat]}`}>{cat}</span>
            <span className="text-muted-foreground font-normal">({items.length})</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map(pol => (
              <div key={pol.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-medium ${pol.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {pol.is_active ? "منشور" : "مخفي"}
                      </span>
                      {pol.version && <span className="text-xs text-muted-foreground">v{pol.version}</span>}
                    </div>
                    <h3 className="font-semibold text-foreground text-sm truncate">{pol.title}</h3>
                    {pol.title_en && <p className="text-xs text-muted-foreground" dir="ltr">{pol.title_en}</p>}
                    {pol.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{pol.description}</p>}
                    {pol.effective_date && (
                      <p className="text-xs text-muted-foreground mt-1">سريان: {new Date(pol.effective_date).toLocaleDateString("ar-SA")}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                   {pol.has_pdf && (
 <button
  onClick={() => downloadCompanyPolicy(pol.id, pol.file_name)}
  className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs"
>
  <ExternalLink className="w-3 h-3" />
  تحميل الملف
</button>
)}
                    <button onClick={() => { setEditPolicy(pol); setShowForm(true); }}
                      className="flex items-center gap-1 px-2 py-1 border border-border rounded-lg text-xs hover:bg-muted text-foreground">
                      <Edit className="w-3 h-3" />تعديل
                    </button>
                    <button onClick={() => deletePolicy(pol.id)}
                      className="flex items-center gap-1 px-2 py-1 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50">
                      <Trash2 className="w-3 h-3" />حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showForm && (
        <PolicyForm policy={editPolicy} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

export const POLICY_CATEGORY_MAP = {
  holidays_absence: "الإجازات والغياب",
  professional_conduct: "السلوك المهني",
  salaries_advantages: "الرواتب والمزايا",
  health_insurance: "الصحة والسلامة",
  information_security: "الأمن المعلوماتي",
  other: "أخرى",
};