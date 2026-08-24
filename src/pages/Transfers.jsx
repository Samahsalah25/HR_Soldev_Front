import { useState, useEffect } from "react";
import { ArrowLeftRight, Plus, X, Save, CheckCircle, XCircle } from "lucide-react";
import { useRole } from "../lib/useRole";

import {
  getEmployeeTransfers,
  createEmployeeTransfer,
  updateEmployeeTransfer,
} from "@/api/employeeTransfersApi";
import {
  getEmployees, getDepartments
} from "@/api/departmentsApi";
import {
  getBranches,
} from "@/api/branchesApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

const STATUS_COLORS = {
  "قيد الاعتماد": "bg-amber-100 text-amber-700", "معتمد": "bg-green-100 text-green-700",
  "مرفوض": "bg-red-100 text-red-600", "مُلغى": "bg-gray-100 text-gray-500"
};

// function TransferForm({ employees, branches, departments, onSave, onClose }) {

//   const [saving,setSaving] = useState(false);
//   const set = (k,v) => setForm(f=>({...f,[k]:v}));
//   const [form, setForm] = useState({
//   employee_id: "",
//   employee_name: "",
//   from_branch: "",
//   from_department: "",
//   to_branch: "",
//   to_department: "",
//   transfer_date: new Date().toISOString().slice(0,10),
//   reason: "",
//   status: "قيد الاعتماد",
// });
//  const handleEmpSelect = (id) => {
//   const emp = employees.find(e => e.id === Number(id));
//   if (!emp) return;

//   set("employee_id", emp.id);
//   set("employee_name", emp.name);

//   set("from_branch", emp.work_location_name || "");
//   set("from_department", emp.department_name || "");
// };
//   const handleSave = async() => {
//     setSaving(true);
//     await base44.entities.Transfer.create(form);
//     onSave();
//   };
//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
//       <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
//         <div className="flex items-center justify-between px-6 py-4 border-b border-border">
//           <h3 className="font-bold flex items-center gap-2"><ArrowLeftRight className="w-5 h-5 text-primary"/>حركة نقل موظف</h3>
//           <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground"/></button>
//         </div>
//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           <div className="space-y-1.5"><label className="text-sm font-medium">الموظف *</label>
//             <select value={form.employee_id} onChange={e=>handleEmpSelect(e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
//               <option value="">اختر الموظف...</option>
//               {employees.map(e=><option key={e.id} value={e.id}>{e.full_name_ar} — {e.department}</option>)}
//             </select></div>
//           {form.employee_id&&(
//             <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-lg p-3 text-sm">
//               <div><span className="text-muted-foreground text-xs">الفرع الحالي: </span><span className="font-medium">{form.from_branch||"—"}</span></div>
//               <div><span className="text-muted-foreground text-xs">القسم الحالي: </span><span className="font-medium">{form.from_department||"—"}</span></div>
//             </div>
//           )}
//           <div className="grid grid-cols-2 gap-3">
//             <div className="space-y-1.5"><label className="text-sm font-medium">الفرع الجديد *</label>
//               <select value={form.to_branch} onChange={e=>set("to_branch",e.target.value)}
//                 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
//                 <option value="">اختر الفرع...</option>
//                 {branches.map(b=><option key={b.id} value={b.name}>{b.name}</option>)}
//               </select></div>
//             <div className="space-y-1.5"><label className="text-sm font-medium">القسم الجديد</label>
//               <select value={form.to_department} onChange={e=>set("to_department",e.target.value)}
//                 className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
//                 <option value="">اختر القسم...</option>
//                 {departments.map(d=><option key={d.id} value={d.name}>{d.name}</option>)}
//               </select></div>
//           </div>
//           <div className="space-y-1.5"><label className="text-sm font-medium">تاريخ النقل</label>
//             <input type="date" value={form.transfer_date} onChange={e=>set("transfer_date",e.target.value)}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"/></div>
//           <div className="space-y-1.5"><label className="text-sm font-medium">سبب النقل *</label>
//             <textarea value={form.reason} onChange={e=>set("reason",e.target.value)} rows={3}
//               className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"/></div>
//         </div>
//         <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
//           <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
//           <button onClick={handleSave} disabled={saving||!form.employee_id||!form.to_branch||!form.reason}
//             className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
//             <Save className="w-4 h-4"/>{saving?"حفظ...":"حفظ قرار النقل"}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
function TransferForm({ employees, branches, departments, onSave, onClose }) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employee_id: "",
    employee_name: "",
    from_branch: "",
    from_department: "",
    to_branch: "",
    to_department: "",
    transfer_date: new Date().toISOString().slice(0, 10),
    reason: "",
    status: "draft",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // =========================
  // اختيار الموظف (API الجديد)
  // =========================
  const handleEmpSelect = (id) => {
    const emp = employees.find((e) => e.id === Number(id));
    if (!emp) return;

    set("employee_id", emp.id);
    set("employee_name", emp.name);

    // مفيش branch مباشر في API → غالبًا من work_location
    set("from_branch", emp.work_location_name || "");

    // department_name هو الصحيح
    set("from_department", emp.department_name || "");
  };

  // =========================
  // حفظ النقل (API جديد)
  // =========================
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        employee_id: form.employee_id,

        current_department_id:
          departments.find(
            (d) => d.name === form.from_department
          )?.id || null,

        current_branch_id:
          branches.find(
            (b) => b.name === form.from_branch
          )?.id || null,

        new_department_id:
          departments.find(
            (d) => d.name === form.to_department
          )?.id || null,

        new_branch_id:
          branches.find(
            (b) => b.name === form.to_branch
          )?.id || null,

        transfer_date: form.transfer_date,
        reason: form.reason,


        state: "submitted",
      };

      await createEmployeeTransfer(payload);

      onSave();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
            حركة نقل موظف
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Employee */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الموظف *</label>
            <select
              value={form.employee_id}
              onChange={(e) => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            >
              <option value="">اختر الموظف...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.department_name || "بدون قسم"}
                </option>
              ))}
            </select>
          </div>

          {/* Current Info */}
          {form.employee_id && (
            <div className="grid grid-cols-2 gap-3 bg-muted/30 rounded-lg p-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">الفرع الحالي:</span>
                <span className="font-medium">{form.from_branch || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">القسم الحالي:</span>
                <span className="font-medium">{form.from_department || "—"}</span>
              </div>
            </div>
          )}

          {/* New branch/department */}
          <div className="grid grid-cols-2 gap-3">

            <div className="space-y-1.5">
              <label className="text-sm font-medium">الفرع الجديد *</label>
              <select
                value={form.to_branch}
                onChange={(e) => set("to_branch", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              >
                <option value="">اختر الفرع...</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">القسم الجديد</label>
              <select
                value={form.to_department}
                onChange={(e) => set("to_department", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
              >
                <option value="">اختر القسم...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">تاريخ النقل</label>
            <input
              type="date"
              value={form.transfer_date}
              onChange={(e) => set("transfer_date", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
            />
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">سبب النقل *</label>
            <textarea
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
            />
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !form.employee_id || !form.to_branch || !form.reason}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "حفظ..." : "حفظ قرار النقل"}
          </button>
        </div>

      </div>
    </div>
  );
}

// export default function Transfers() {
//   const { user } = useRole();
//   const canCreate  = canDo(user, "transfers", "create");
//   const canApprove = canDo(user, "transfers", "approve");
//   const [transfers, setTransfers] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);

//   const [branches, setBranches] = useState([]);
//   const [departments, setDepartments] = useState([]);

// const load = async () => {
//   const [ts, emps, brs, depts] = await Promise.all([
//     getEmployeeTransfers(),
//     getEmployees(),
//     getBranches(),
//     getDepartments(),
//   ]);

//   setTransfers(ts?.data || ts);
//   setEmployees(emps?.data || emps);
//   setBranches(brs?.data || brs);
//   setDepartments(depts?.data || depts);

//   setLoading(false);
// };
//   useEffect(()=>{load();},[]);

//   const approve = async(id) => {
//     const user = await base44.auth.me();
//     const t = transfers.find(x=>x.id===id);
//     await base44.entities.Transfer.update(id,{status:"معتمد",approved_by:user.full_name||user.email,approval_date:new Date().toISOString().slice(0,10)});
//     if(t){await base44.entities.Employee.update(t.employee_id,{branch:t.to_branch,department:t.to_department||undefined});}
//     load();
//   };
//   const reject = async(id) => { await base44.entities.Transfer.update(id,{status:"مرفوض"}); load(); };

//   return (
//     <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ArrowLeftRight className="w-6 h-6 text-primary"/>حركة نقل الموظفين</h1>
//           <p className="text-sm text-muted-foreground mt-0.5">تسجيل واعتماد قرارات النقل بين الفروع والأقسام</p>
//         </div>
//         {canCreate && (
//           <button onClick={()=>setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
//             <Plus className="w-4 h-4"/>قرار نقل جديد
//           </button>
//         )}
//       </div>

//       <div className="grid grid-cols-3 gap-4">
//         {[
//           {label:"قيد الاعتماد",value:transfers.filter(t=>t.status==="قيد الاعتماد").length,color:"text-amber-600"},
//           {label:"معتمدة",value:transfers.filter(t=>t.status==="معتمد").length,color:"text-green-600"},
//           {label:"إجمالي",value:transfers.length,color:"text-primary"},
//         ].map(s=>(
//           <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
//             <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
//             <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
//           </div>
//         ))}
//       </div>

//       <div className="bg-card rounded-xl border border-border overflow-hidden">
//         <table className="w-full text-sm">
//           <thead><tr className="bg-muted/30 border-b border-border">
//             {["الموظف","من (فرع/قسم)","إلى (فرع/قسم)","التاريخ","السبب","الحالة","إجراء"].map(h=>(
//               <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
//             ))}
//           </tr></thead>
//           <tbody>
//             {loading?<tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
//             :transfers.length===0?<tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد حركات نقل</td></tr>
//             :transfers.map(t=>(
//               <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20">
//                 <td className="px-4 py-3 font-medium text-foreground">{t.employee_name}</td>
//                 <td className="px-4 py-3 text-xs text-muted-foreground">
//                   <p>{t.from_branch||"—"}</p><p className="text-xs">{t.from_department}</p>
//                 </td>
//                 <td className="px-4 py-3 text-xs text-primary font-medium">
//                   <p>{t.to_branch}</p><p className="text-xs text-muted-foreground">{t.to_department}</p>
//                 </td>
//                 <td className="px-4 py-3 text-xs text-muted-foreground">{t.transfer_date?new Date(t.transfer_date).toLocaleDateString("ar-SA"):"—"}</td>
//                 <td className="px-4 py-3 text-xs text-muted-foreground max-w-36 truncate">{t.reason||"—"}</td>
//                 <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>{t.status}</span></td>
//                 <td className="px-4 py-3">
//                   {t.status==="قيد الاعتماد" && canApprove && (
//                     <div className="flex gap-1">
//                       <button onClick={()=>approve(t.id)} title="اعتماد" className="p-1.5 hover:bg-green-50 text-green-600 rounded"><CheckCircle className="w-4 h-4"/></button>
//                       <button onClick={()=>reject(t.id)} title="رفض" className="p-1.5 hover:bg-red-50 text-red-600 rounded"><XCircle className="w-4 h-4"/></button>
//                     </div>
//                   )}
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {showForm&&<TransferForm employees={employees} branches={branches} departments={departments} onSave={()=>{setShowForm(false);load();}} onClose={()=>setShowForm(false)}/>}
//     </div>
//   );
// }
export default function Transfers() {
  const confirmDialog = useConfirm();
  const { user, canDo } = useRole();
  const canCreate = canDo("transfers", "create");
  const canApprove = canDo("transfers", "approve");

  const [transfers, setTransfers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);

  // =========================
  // LOAD
  // =========================
  const load = async () => {
    const [ts, emps, brs, depts] = await Promise.all([
      getEmployeeTransfers(),
      getEmployees(),
      getBranches(),
      getDepartments(),
    ]);

    const rawTransfers = ts?.data || ts || [];

    // =========================
    // 🔥 NORMALIZE API RESPONSE
    // =========================
    const formatted = rawTransfers.map((t) => ({
      id: t.id,
      employee_name: t.employee_name,

      from_branch: t.current_branch_name,
      from_department: t.current_department_name,

      to_branch: t.new_branch_name,
      to_department: t.new_department_name,

      transfer_date: t.transfer_date,
      reason: t.reason,

      // تحويل state إلى status للواجهة
      status:
        t.state === "approved"
          ? "معتمد"
          : t.state === "submitted"
            ? "قيد الاعتماد"
            : t.state === "draft"
              ? "مسودة"
              : "مرفوض",
    }));

    setTransfers(formatted);
    setEmployees(emps?.data || emps || []);
    setBranches(brs?.data || brs || []);
    setDepartments(depts?.data || depts || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // =========================
  // APPROVE
  // =========================
  const approve = async (id) => {
    const ok = await confirmDialog({
      title: "اعتماد النقل",
      message: "هل أنت متأكد من اعتماد طلب النقل؟",
      confirmText: "اعتماد",
    });
    if (!ok) return;
    try {
      await updateEmployeeTransfer(id, {
        state: "approved",
      });

      load();
    } catch (error) {
      console.error(error);
    }
  };

  // =========================
  // REJECT
  // =========================
  const reject = async (id) => {
    const ok = await confirmDialog({
      title: "رفض النقل",
      message: "هل أنت متأكد من رفض طلب النقل؟",
      confirmText: "رفض",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await updateEmployeeTransfer(id, {
        state: "refused",
      });

      load();
    } catch (error) {
      console.error(error);
    }
  };

  const transfersPagination = usePagination(transfers, 20);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            حركة نقل الموظفين
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            تسجيل واعتماد قرارات النقل بين الفروع والأقسام
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            قرار نقل جديد
          </button>
        )}
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "قيد الاعتماد",
            value: transfers.filter((t) => t.status === "قيد الاعتماد").length,
            color: "text-amber-600",
          },
          {
            label: "معتمدة",
            value: transfers.filter((t) => t.status === "معتمد").length,
            color: "text-green-600",
          },
          {
            label: "إجمالي",
            value: transfers.length,
            color: "text-primary",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card rounded-xl border border-border p-4 text-center"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {[
                "الموظف",
                "من (فرع/قسم)",
                "إلى (فرع/قسم)",
                "التاريخ",
                "السبب",
                "الحالة",
                "إجراء",
              ].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs text-muted-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  لا توجد حركات نقل
                </td>
              </tr>
            ) : (
              transfersPagination.pageItems.map((t) => (
                <tr key={t.id} className="border-b border-border hover:bg-muted/20">

                  <td className="px-4 py-3 font-medium">{t.employee_name}</td>

                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{t.from_branch || "—"}</p>
                    <p>{t.from_department || "—"}</p>
                  </td>

                  <td className="px-4 py-3 text-xs text-primary font-medium">
                    <p>{t.to_branch || "—"}</p>
                    <p className="text-muted-foreground">{t.to_department || "—"}</p>
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {t.transfer_date
                      ? new Date(t.transfer_date).toLocaleDateString("ar-SA")
                      : "—"}
                  </td>

                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-36 truncate">
                    {t.reason || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {t.status === "قيد الاعتماد" && canApprove && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => approve(t.id)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => reject(t.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination
          page={transfersPagination.page}
          totalPages={transfersPagination.totalPages}
          totalItems={transfersPagination.totalItems}
          pageSize={transfersPagination.pageSize}
          onPageChange={transfersPagination.setPage}
        />
      </div>

      {/* FORM */}
      {showForm && (
        <TransferForm
          employees={employees}
          branches={branches}
          departments={departments}
          onSave={() => {
            setShowForm(false);
            load();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}