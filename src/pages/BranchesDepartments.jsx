// import { useState, useEffect } from "react";
// import { Plus, Building2, Users, MapPin, Edit, Trash2, Save, X, Check } from "lucide-react";
// import {
//   getBranches,
//   createBranch,
//   updateBranch,
//   deleteBranchApi,
// } from "@/api/branchesApi";

// const Field = ({ label, children }) => (
//   <div className="space-y-1.5">
//     <label className="text-sm font-medium text-foreground">{label}</label>
//     {children}
//   </div>
// );
// const Input = (props) => (
//   <input {...props} className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
// );

// function BranchForm({ branch, onSave, onClose }) {
//   const [form, setForm] = useState({
//     name: "", name_en: "", city: "", address: "",
//     latitude: "", longitude: "", radius_meters: 200,
//     check_in_time: "08:00", check_out_time: "17:00", is_active: true, notes: "",
//     ...(branch || {}),
//   });
//   const [saving, setSaving] = useState(false);
//   const [gettingLocation, setGettingLocation] = useState(false);

//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

//   const getMyLocation = () => {
//     setGettingLocation(true);
//     navigator.geolocation.getCurrentPosition(
//       (pos) => {
//         set("latitude", pos.coords.latitude.toFixed(6));
//         set("longitude", pos.coords.longitude.toFixed(6));
//         setGettingLocation(false);
//       },
//       () => setGettingLocation(false)
//     );
//   };

//   const handleSave = async () => {
//     setSaving(true);
//     if (branch?.id) await base44.entities.Branch.update(branch.id, form);
//     else await base44.entities.Branch.create(form);
//     onSave();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
//       <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-border">
//           <h3 className="font-bold">{branch ? "تعديل الفرع" : "إضافة فرع جديد"}</h3>
//           <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <Field label="اسم الفرع *"><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="الرياض - الرئيسي" /></Field>
//             <Field label="Branch Name (EN)"><Input value={form.name_en} onChange={e => set("name_en", e.target.value)} dir="ltr" /></Field>
//             <Field label="المدينة *"><Input value={form.city} onChange={e => set("city", e.target.value)} placeholder="الرياض" /></Field>
//             <Field label="العنوان التفصيلي"><Input value={form.address} onChange={e => set("address", e.target.value)} /></Field>
//           </div>

//           <div className="bg-muted/30 rounded-xl p-4 space-y-3">
//             <div className="flex items-center justify-between">
//               <p className="text-sm font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />إحداثيات الفرع (لتحديد نطاق الحضور)</p>
//               <button onClick={getMyLocation} disabled={gettingLocation}
//                 className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
//                 {gettingLocation ? "جاري التحديد..." : "📍 موقعي الحالي"}
//               </button>
//             </div>
//             <div className="grid grid-cols-2 gap-3">
//               <Field label="خط العرض (Latitude)"><Input type="number" step="any" value={form.latitude} onChange={e => set("latitude", e.target.value)} dir="ltr" placeholder="24.7136" /></Field>
//               <Field label="خط الطول (Longitude)"><Input type="number" step="any" value={form.longitude} onChange={e => set("longitude", e.target.value)} dir="ltr" placeholder="46.6753" /></Field>
//             </div>
//             <Field label="نطاق الحضور (متر) — المسافة المسموح بها للتسجيل">
//               <div className="flex items-center gap-2">
//                 <Input type="number" min={50} max={2000} value={form.radius_meters} onChange={e => set("radius_meters", +e.target.value)} />
//                 <span className="text-sm text-muted-foreground whitespace-nowrap">متر</span>
//               </div>
//             </Field>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <Field label="وقت الحضور الرسمي"><Input type="time" value={form.check_in_time} onChange={e => set("check_in_time", e.target.value)} /></Field>
//             <Field label="وقت الانصراف الرسمي"><Input type="time" value={form.check_out_time} onChange={e => set("check_out_time", e.target.value)} /></Field>
//           </div>
//           <label className="flex items-center gap-3 cursor-pointer">
//             <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="w-4 h-4 accent-primary" />
//             <span className="text-sm font-medium">الفرع نشط</span>
//           </label>
//           <Field label="ملاحظات">
//             <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
//           </Field>
//         </div>
//         <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
//           <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
//           <button onClick={handleSave} disabled={saving || !form.name || !form.city}
//             className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
//             <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function DeptForm({ dept, branches, onSave, onClose }) {
//   const [form, setForm] = useState({ name: "", name_en: "", branch: "", manager: "", budget: 0, headcount: 0, is_active: true, notes: "", ...(dept || {}) });
//   const [saving, setSaving] = useState(false);
//   const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
//   const handleSave = async () => {
//     setSaving(true);
//     if (dept?.id) await base44.entities.Department.update(dept.id, form);
//     else await base44.entities.Department.create(form);
//     onSave();
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
//       <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-border">
//           <h3 className="font-bold">{dept ? "تعديل القسم" : "إضافة قسم جديد"}</h3>
//           <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
//         </div>
//         <div className="p-6 space-y-4">
//           <div className="grid grid-cols-2 gap-3">
//             <Field label="اسم القسم *"><Input value={form.name} onChange={e => set("name", e.target.value)} placeholder="الموارد البشرية" /></Field>
//             <Field label="Department Name (EN)"><Input value={form.name_en} onChange={e => set("name_en", e.target.value)} dir="ltr" /></Field>
//           </div>
//           <Field label="الفرع التابع له">
//             <select value={form.branch} onChange={e => set("branch", e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
//               <option value="">غير محدد</option>
//               {branches.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
//             </select>
//           </Field>
//           <Field label="مدير القسم"><Input value={form.manager} onChange={e => set("manager", e.target.value)} /></Field>
//           <div className="grid grid-cols-2 gap-3">
//             <Field label="الميزانية السنوية (ريال)"><Input type="number" min={0} value={form.budget} onChange={e => set("budget", +e.target.value)} /></Field>
//             <Field label="العدد المستهدف"><Input type="number" min={0} value={form.headcount} onChange={e => set("headcount", +e.target.value)} /></Field>
//           </div>
//           <label className="flex items-center gap-3 cursor-pointer">
//             <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} className="w-4 h-4 accent-primary" />
//             <span className="text-sm font-medium">القسم نشط</span>
//           </label>
//         </div>
//         <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
//           <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
//           <button onClick={handleSave} disabled={saving || !form.name}
//             className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
//             <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function BranchesDepartments() {
//   const [branches, setBranches] = useState([]);
//   const [departments, setDepartments] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("branches");
//   const [editBranch, setEditBranch] = useState(null);
//   const [showBranchForm, setShowBranchForm] = useState(false);
//   const [editDept, setEditDept] = useState(null);
//   const [showDeptForm, setShowDeptForm] = useState(false);

//   const load = async () => {
//     const [bs, ds] = await Promise.all([
//       base44.entities.Branch.list(),
//       base44.entities.Department.list(),
//     ]);
//     setBranches(bs); setDepartments(ds); setLoading(false);
//   };

//   useEffect(() => { load(); }, []);

//   const deleteBranch = async (id) => {
//     if (confirm("هل أنت متأكد من حذف هذا الفرع؟")) {
//       await base44.entities.Branch.delete(id); load();
//     }
//   };
//   const deleteDept = async (id) => {
//     if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
//       await base44.entities.Department.delete(id); load();
//     }
//   };

//   return (
//     <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
//       <div>
//         <h1 className="text-2xl font-bold text-foreground">الأقسام والفروع</h1>
//         <p className="text-sm text-muted-foreground mt-0.5">إدارة الهيكل التنظيمي — الفروع والأقسام ومواقع الحضور</p>
//       </div>

//       {/* Stats */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//         {[
//           { label: "الفروع", value: branches.length, icon: Building2, color: "text-primary" },
//           { label: "الفروع النشطة", value: branches.filter(b => b.is_active).length, icon: Check, color: "text-green-600" },
//           { label: "الأقسام", value: departments.length, icon: Users, color: "text-secondary" },
//           { label: "الأقسام النشطة", value: departments.filter(d => d.is_active).length, icon: Check, color: "text-teal-600" },
//         ].map(s => (
//           <div key={s.label} className="bg-card rounded-xl border border-border p-4">
//             <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />
//             <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
//             <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-1 border-b border-border">
//         {[
//           { id: "branches", label: "الفروع", icon: Building2 },
//           { id: "departments", label: "الأقسام", icon: Users },
//         ].map(tab => (
//           <button key={tab.id} onClick={() => setActiveTab(tab.id)}
//             className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
//             <tab.icon className="w-4 h-4" />{tab.label}
//           </button>
//         ))}
//       </div>

//       {activeTab === "branches" && (
//         <div className="space-y-4">
//           <div className="flex justify-end">
//             <button onClick={() => { setEditBranch(null); setShowBranchForm(true); }}
//               className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium">
//               <Plus className="w-4 h-4" />إضافة فرع
//             </button>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {loading ? (
//               <p className="text-muted-foreground text-sm">جاري التحميل...</p>
//             ) : branches.length === 0 ? (
//               <div className="sm:col-span-2 text-center py-12 text-muted-foreground">
//                 <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
//                 <p className="text-sm">لا توجد فروع. أضف فرعاً الآن.</p>
//               </div>
//             ) : branches.map(b => (
//               <div key={b.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <h3 className="font-bold text-foreground">{b.name}</h3>
//                     {b.name_en && <p className="text-xs text-muted-foreground" dir="ltr">{b.name_en}</p>}
//                   </div>
//                   <div className="flex items-center gap-1">
//                     <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
//                       {b.is_active ? "نشط" : "غير نشط"}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="space-y-1.5 text-xs text-muted-foreground">
//                   <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{b.city}{b.address ? ` — ${b.address}` : ""}</p>
//                   {b.latitude && <p>📍 {b.latitude}, {b.longitude} (نطاق {b.radius_meters}م)</p>}
//                   <p>🕐 حضور {b.check_in_time} — انصراف {b.check_out_time}</p>
//                   {departments.filter(d => d.branch === b.name).length > 0 && (
//                     <div className="flex flex-wrap gap-1 pt-1">
//                       {departments.filter(d => d.branch === b.name).map(d => (
//                         <span key={d.id} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full">{d.name}</span>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex items-center gap-2 pt-1 border-t border-border">
//                   <button onClick={() => { setEditBranch(b); setShowBranchForm(true); }}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted">
//                     <Edit className="w-3 h-3" />تعديل
//                   </button>
//                   <button onClick={() => deleteBranch(b.id)}
//                     className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
//                     <Trash2 className="w-3 h-3" />حذف
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {activeTab === "departments" && (
//         <div className="space-y-4">
//           <div className="flex justify-end">
//             <button onClick={() => { setEditDept(null); setShowDeptForm(true); }}
//               className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium">
//               <Plus className="w-4 h-4" />إضافة قسم
//             </button>
//           </div>
//           <div className="bg-card rounded-xl border border-border overflow-hidden">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="bg-muted/30 border-b border-border">
//                   {["اسم القسم", "الفرع", "المدير", "الميزانية", "العدد المستهدف", "الحالة", "إجراءات"].map(h => (
//                     <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {loading ? (
//                   <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
//                 ) : departments.length === 0 ? (
//                   <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد أقسام مضافة</td></tr>
//                 ) : departments.map(d => (
//                   <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20">
//                     <td className="px-4 py-3">
//                       <p className="font-medium">{d.name}</p>
//                       {d.name_en && <p className="text-xs text-muted-foreground" dir="ltr">{d.name_en}</p>}
//                     </td>
//                     <td className="px-4 py-3 text-muted-foreground">{d.branch || "—"}</td>
//                     <td className="px-4 py-3 text-muted-foreground">{d.manager || "—"}</td>
//                     <td className="px-4 py-3">{d.budget ? `${d.budget.toLocaleString()} ريال` : "—"}</td>
//                     <td className="px-4 py-3 text-center">{d.headcount || "—"}</td>
//                     <td className="px-4 py-3">
//                       <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
//                         {d.is_active ? "نشط" : "غير نشط"}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="flex gap-1">
//                         <button onClick={() => { setEditDept(d); setShowDeptForm(true); }}
//                           className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Edit className="w-3.5 h-3.5" /></button>
//                         <button onClick={() => deleteDept(d.id)}
//                           className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {showBranchForm && (
//         <BranchForm branch={editBranch} onSave={() => { setShowBranchForm(false); load(); }} onClose={() => setShowBranchForm(false)} />
//       )}
//       {showDeptForm && (
//         <DeptForm dept={editDept} branches={branches} onSave={() => { setShowDeptForm(false); load(); }} onClose={() => setShowDeptForm(false)} />
//       )}
//     </div>
//   );
// }

















import { useState, useEffect } from "react";
import {
  Plus,
  Building2,
  Users,
  MapPin,
  Edit,
  Trash2,
  Save,
  X,
  Check,
} from "lucide-react";

import {
  getBranches,
  createBranch,
  updateBranch,

} from "@/api/branchesApi";
import { deleteBranch as deleteBranchApi } from "@/api/branchesApi";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartmentApi,
} from "@/api/departmentsApi";

import { getEmployees } from "@/api/departmentsApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
  />
);

function BranchForm({ branch, onSave, onClose }) {
  const [form, setForm] = useState({
    name: "",
    city: "",
    name_ar:"",
    detailed_address: "",
    latitude: "",
    longitude: "",
    radius_meters: 200,
    work_start: "08:00",
    work_end: "17:00",
    active: true,
    notes: "",
    grace_period: 15,
  allowed_late_minutes: 30,
weekend_days: Array.isArray(branch?.weekend_days)
  ? branch.weekend_days
  : [5, 6],
    ...(branch || {}),
  });

  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const getMyLocation = () => {
    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", pos.coords.latitude.toFixed(6));
        set("longitude", pos.coords.longitude.toFixed(6));
        setGettingLocation(false);
      },
      () => setGettingLocation(false)
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        name: form.name,
        name_ar:form.name_ar ,
        city: form.city,
        detailed_address: form.detailed_address,
        latitude: form.latitude || null,
        longitude: form.longitude || null,
        radius_meters: form.radius_meters,
        work_start: form.work_start,
        work_end: form.work_end,
        active: form.active,
        notes: form.notes,
          grace_period: form.grace_period,
  allowed_late_minutes: form.allowed_late_minutes,
  weekend_days: form.weekend_days,
      };

      if (branch?.id) {
        await updateBranch(branch.id, payload);
      } else {
        await createBranch(payload);
      }

      onSave();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const WEEK_DAYS = [
  { label: "السبت", value: 6 },
  { label: "الأحد", value: 0 },
  { label: "الاثنين", value: 1 },
  { label: "الثلاثاء", value: 2 },
  { label: "الأربعاء", value: 3 },
  { label: "الخميس", value: 4 },
  { label: "الجمعة", value: 5 },
];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold">
            {branch ? "تعديل الفرع" : "إضافة فرع جديد"}
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

            <Field label="اسم الفرع بالعربي *">
              <Input
                value={form.name_ar}
                onChange={(e) => set("name_ar", e.target.value)}
                placeholder="الرياض - الرئيسي"
              />
            </Field>
             <Field label="اسم الفرع بالانجلش *">
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="الرياض - الرئيسي"
              />
            </Field>
               

           
          </div>
                 <div className="grid grid-cols-2 gap-3">
 <Field label="المدينة *">
              <Input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="الرياض"
              />
            </Field>
          <Field label="العنوان بالتفصيل">
            <Input
              value={form.detailed_address}
              onChange={(e) => set("detailed_address", e.target.value)}
              placeholder="Office Address"
            />
          </Field>
</div>
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                إحداثيات الفرع
              </p>

              <button
                onClick={getMyLocation}
                disabled={gettingLocation}
                className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
              >
                {gettingLocation ? "جاري التحديد..." : "📍 موقعي الحالي"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude">
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => set("latitude", e.target.value)}
                  dir="ltr"
                />
              </Field>

              <Field label="Longitude">
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => set("longitude", e.target.value)}
                  dir="ltr"
                />
              </Field>
            </div>

            <Field label="نطاق الحضور (متر)">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={50}
                  max={2000}
                  value={form.radius_meters}
                  onChange={(e) =>
                    set("radius_meters", +e.target.value)
                  }
                />

                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  متر
                </span>
              </div>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="وقت الحضور">
              <Input
                type="time"
                value={form.work_start}
                onChange={(e) =>
                  set("work_start", e.target.value)
                }
              />
            </Field>

            <Field label="وقت الانصراف">
              <Input
                type="time"
                value={form.work_end}
                onChange={(e) =>
                  set("work_end", e.target.value)
                }
              />
            </Field>
          </div>
<div className="grid grid-cols-2 gap-3">

  <Field label="فترة السماح (دقائق)">
    <Input
      type="number"
      value={form.grace_period}
      onChange={(e) => set("grace_period", Number(e.target.value))}
    />
  </Field>

  <Field label="التأخير المسموح (دقائق)">
    <Input
      type="number"
      value={form.allowed_late_minutes}
      onChange={(e) => set("allowed_late_minutes", Number(e.target.value))}
    />
  </Field>

</div>
<Field label="أيام  الاجازة">
  <div className="grid grid-cols-2 gap-2">
   {WEEK_DAYS.map((day) => (
  <label key={day.value} className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={(form.weekend_days || []).includes(day.value)}
      onChange={(e) => {
        const current = Array.isArray(form.weekend_days)
          ? form.weekend_days
          : [];

        if (e.target.checked) {
          set("weekend_days", [...current, day.value]);
        } else {
          set(
            "weekend_days",
            current.filter((d) => d !== day.value)
          );
        }
      }}
    />
    {day.label}
  </label>
))}
  </div>
</Field>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />

            <span className="text-sm font-medium">Active</span>
          </label>

          <Field label="ملاحظات">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.city}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeptForm({
  dept,
  branches,
  employees,
  onSave,
  onClose,
}) {
  const [form, setForm] = useState({
    name: "",
    name_ar: "",
    work_location_id: "",
    manager_id: "",
    annual_salary: "",
    active: true,
    target_employee: "",
    ...(dept || {}),
  });

  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        name: form.name,
        name_ar: form.name_ar,
        work_location_id: form.work_location_id || null,
        manager_id: form.manager_id || null,
        annual_salary: Number(form.annual_salary || 0),
        active: form.active,
        target_employee: Number(form.target_employee || 0),
      };

      if (dept?.id) {
        await updateDepartment(dept.id, payload);
      } else {
        await createDepartment(payload);
      }

      onSave();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      dir="rtl"
    >
      <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold">
            {dept ? "تعديل القسم" : "إضافة قسم جديد"}
          </h3>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
           <div className="grid grid-cols-2 gap-3">
             <Field label="الاسم بالعربي">
            <Input
              value={form.name_ar}
              onChange={(e) => set("name_ar", e.target.value)}
            />
          </Field>

          <Field label="اسم بالانجليزي">
            <Input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </Field>

         
</div>
<div className="grid grid-cols-2 gap-3">
          <Field label="الفرع">
            <select
              value={form.work_location_id || ""}
              onChange={(e) =>
                set("work_location_id", e.target.value)
              }
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            >
              <option value="">اختر الفرع</option>

              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="المدير">
            <select
              value={form.manager_id || ""}
              onChange={(e) => set("manager_id", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            >
              <option value="">اختر المدير</option>

              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </Field>
</div>
   <div className="grid grid-cols-2 gap-3">
          <Field label="الراتب السنوي">
            <Input
              type="number"
              value={form.annual_salary}
              onChange={(e) =>
                set("annual_salary", e.target.value)
              }
            />
          </Field>
<Field label="العدد المستهدف">
  <Input
    type="number"
    value={form.target_employee}
    onChange={(e) => set("target_employee", e.target.value)}
  />
</Field>
</div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => set("active", e.target.checked)}
              className="w-4 h-4 accent-primary"
            />

            <span className="text-sm font-medium">Active</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />

            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BranchesDepartments() {
  const confirmDialog = useConfirm();
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("branches");

  const [editBranch, setEditBranch] = useState(null);
  const [showBranchForm, setShowBranchForm] = useState(false);

  const [editDept, setEditDept] = useState(null);
  const [showDeptForm, setShowDeptForm] = useState(false);

  const load = async () => {
    try {
      setLoading(true);

      const [branchesRes, departmentsRes, employeesRes] =
        await Promise.all([
          getBranches(),
          getDepartments(),
          getEmployees(),
        ]);

      setBranches(branchesRes?.data || []);
      setDepartments(departmentsRes?.data || []);
      setEmployees(employeesRes?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

 const handleDeleteBranch = async (id) => {
  const ok = await confirmDialog({
    title: "حذف الفرع",
    message: "هل أنت متأكد من حذف الفرع؟ لا يمكن التراجع عن هذا الإجراء.",
    confirmText: "حذف",
    variant: "destructive",
  });
  if (ok) {
    await deleteBranchApi(id);
    load();
  }
};

  const deleteDept = async (id) => {
    const ok = await confirmDialog({
      title: "حذف القسم",
      message: "هل أنت متأكد من حذف القسم؟ لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (ok) {
      await deleteDepartmentApi(id);
      load();
    }
  };

  const departmentsPagination = usePagination(departments, 20);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          الأقسام والفروع
        </h1>

        <p className="text-sm text-muted-foreground mt-0.5">
          إدارة الفروع والأقسام
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "الفروع",
            value: branches.length,
            icon: Building2,
            color: "text-primary",
          },
          {
            label: "الفروع النشطة",
            value: branches.filter((b) => b.active).length,
            icon: Check,
            color: "text-green-600",
          },
          {
            label: "الأقسام",
            value: departments.length,
            icon: Users,
            color: "text-secondary",
          },
          {
            label: "الأقسام النشطة",
            value: departments.filter((d) => d.active).length,
            icon: Check,
            color: "text-teal-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl border border-border p-4"
          >
            <s.icon className={`w-5 h-5 mb-2 ${s.color}`} />

            <p className={`text-2xl font-bold ${s.color}`}>
              {s.value}
            </p>

            <p className="text-xs text-muted-foreground mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          {
            id: "branches",
            label: "الفروع",
            icon: Building2,
          },
          {
            id: "departments",
            label: "الأقسام",
            icon: Users,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "branches" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditBranch(null);
                setShowBranchForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              إضافة فرع
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              <p className="text-muted-foreground text-sm">
                جاري التحميل...
              </p>
            ) : branches.length === 0 ? (
              <div className="sm:col-span-2 text-center py-12 text-muted-foreground">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />

                <p className="text-sm">
                  لا توجد فروع حالياً
                </p>
              </div>
            ) : (
              branches.map((b) => (
                <div
                  key={b.id}
                  className="bg-card rounded-xl border border-border p-5 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground">
                        {b.name}-{b.name_ar}
                      </h3>
                    </div>

                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        b.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.active ? "نشط" : "غير نشط"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      {b.city}
                      {b.detailed_address
                        ? ` — ${b.detailed_address}`
                        : ""}
                    </p>

                    {b.latitude && (
                      <p>
                        📍 {b.latitude}, {b.longitude}
                      </p>
                    )}

                    <p>
                      🕐 {b.work_start} —{" "}
                      {b.work_end}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <button
                      onClick={() => {
                        setEditBranch(b);
                        setShowBranchForm(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted"
                    >
                      <Edit className="w-3 h-3" />
                      تعديل
                    </button>

                    <button
                      onClick={() => handleDeleteBranch(b.id)}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                      حذف
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "departments" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setEditDept(null);
                setShowDeptForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              إضافة قسم
            </button>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {[
                    "اسم القسم",
                    "الاسم بالعربي",
                    "الفرع",
                    "المدير",
                    "الراتب السنوي",
                    "الموظفين",
                    "الحالة",
                    "إجراءات",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      جاري التحميل...
                    </td>
                  </tr>
                ) : departments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      لا توجد أقسام
                    </td>
                  </tr>
                ) : (
                  departmentsPagination.pageItems.map((d) => (
                    <tr
                      key={d.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3 font-medium">
                        {d.name || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {d.name_ar || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {d.work_location_name || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {d.manager_name || "—"}
                      </td>

                      <td className="px-4 py-3">
                        {d.annual_salary
                          ? `${Number(
                              d.annual_salary
                            ).toLocaleString()} ريال`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {d.target_employee || 0}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            d.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {d.active ? "نشط" : "غير نشط"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditDept(d);
                              setShowDeptForm(true);
                            }}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deleteDept(d.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <TablePagination
              page={departmentsPagination.page}
              totalPages={departmentsPagination.totalPages}
              totalItems={departmentsPagination.totalItems}
              pageSize={departmentsPagination.pageSize}
              onPageChange={departmentsPagination.setPage}
            />
          </div>
        </div>
      )}

      {showBranchForm && (
        <BranchForm
          branch={editBranch}
          onSave={() => {
            setShowBranchForm(false);
            load();
          }}
          onClose={() => setShowBranchForm(false)}
        />
      )}

      {showDeptForm && (
        <DeptForm
          dept={editDept}
          branches={branches}
          employees={employees}
          onSave={() => {
            setShowDeptForm(false);
            load();
          }}
          onClose={() => setShowDeptForm(false)}
        />
      )}
    </div>
  );
}