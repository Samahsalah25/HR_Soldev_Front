import { useState, useEffect } from "react";
import { Gift, Plus, X, Save, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import {
  getAdditions,
  createAddition,
  updateAddition,
} from "@/api/additionsApi";
import {
  getEmployees, getDepartments
} from "@/api/departmentsApi";

const STATUS_COLORS = {
  "قيد الاعتماد": "bg-amber-100 text-amber-700",
  "معتمدة": "bg-blue-100 text-blue-700",
  "مدفوعة": "bg-green-100 text-green-700",
  "مرفوضة": "bg-red-100 text-red-600",
};

function BonusForm({ employees, departments, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    bonus_type: "مكافأة أداء", scope: "فردية", amount: 0, reason: "", period: new Date().toISOString().slice(0, 7),
    requires_gm_approval: false,
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(
      (e) => e.id === Number(id)
    );

    if (emp) {
      set("employee_id", emp.id);

      set(
        "employee_name",
        emp.full_name_ar
      );

      set(
        "department",
        emp.department_id || ""
      );
    }
  };
  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        add_to:
          form.scope === "فردية"
            ? "employee"
            : form.scope === "قسم"
              ? "department"
              : "all",

        employee:
          form.scope === "فردية"
            ? Number(form.employee_id)
            : null,

        department:
          form.scope === "قسم"
            ? Number(form.department)
            : null,

        addition_type:
          form.bonus_type,

        date: form.period,

        amount: Number(form.amount),

        reason: form.reason,

        state: "under_approval",
      };

      

      await createAddition(payload);

      onSave();

    } catch (err) {
      console.error(
        "CREATE BONUS ERROR",
        err?.response?.data || err
      );

      alert("فشل إنشاء المكافأة");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2"><Gift className="w-5 h-5 text-green-600" />مكافأة جديدة</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">نطاق المكافأة *</label>
            <div className="flex gap-2">
              {["فردية", "قسم", "الشركة"].map(s => (
                <button key={s} onClick={() => set("scope", s)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${form.scope === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
                  {s === "فردية" ? "👤 فردية" : s === "قسم" ? "🏢 قسم" : "🏭 الشركة"}
                </button>
              ))}
            </div>
          </div>
          {form.scope === "فردية" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الموظف *</label>
              <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر الموظف...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar} — {e.department}</option>)}
              </select>
            </div>
          )}
          {form.scope === "قسم" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">القسم *</label>
              <select value={form.department} onChange={e => { set("department", e.target.value); set("employee_id", ""); set("employee_name", ""); }}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر القسم...</option>
                {departments.map((d) => (
                  <option
                    key={d.id}
                    value={d.id}
                  >
                    {d.name} (
                    {
                      employees.filter(
                        (e) =>
                          e.department_id === d.id
                      ).length
                    } موظف)
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.scope === "الشركة" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              ستُطبَّق المكافأة على جميع الموظفين النشطين ({employees.length} موظف)
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">نوع المكافأة</label>
              <select value={form.bonus_type} onChange={e => set("bonus_type", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {["مكافأة أداء", "مكافأة إنجاز", "مكافأة سنوية", "مكافأة رمضان", "مكافأة عيد", "مكافأة مشروع", "أخرى"].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الفترة</label>
              <input type="month" value={form.period} onChange={e => set("period", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">المبلغ (ريال) *</label>
            <input type="number" min={0} value={form.amount} onChange={e => set("amount", +e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            {form.scope !== "فردية" && form.amount > 0 && (
              <p className="text-xs text-muted-foreground">
                الإجمالي: {(
                  (
                    form.scope === "قسم"
                      ? employees.filter(
                        (e) =>
                          e.department_id === Number(form.department)
                      ).length
                      : employees.length
                  ) * form.amount
                )?.toLocaleString("ar-SA")} ر.س
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">السبب *</label>
            <textarea value={form.reason} onChange={e => set("reason", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
          {form.amount > 5000 && (
            <label className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer">
              <input type="checkbox" checked={form.requires_gm_approval} onChange={e => set("requires_gm_approval", e.target.checked)} className="w-4 h-4 accent-amber-600" />
              <div>
                <span className="text-sm font-medium text-amber-800">تحتاج موافقة المدير العام</span>
                <p className="text-xs text-amber-600 mt-0.5">المبلغ يتجاوز 5,000 ريال — يُنصح بموافقة GM</p>
              </div>
            </label>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave}
            disabled={saving || !form.amount || !form.reason || (form.scope === "فردية" && !form.employee_id) || (form.scope === "قسم" && !form.department)}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "حفظ..." : "إنشاء المكافأة"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Bonuses() {
  const { user, canDo } = useRole();
  const canCreate = canDo("bonuses", "create");
  const canApprove = canDo("bonuses", "approve");
  const [bonuses, setBonuses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");

  const load = async () => {
    try {
      setLoading(true);

      const [
        additionsRes,
        employeesRes,
        departmentsRes,
      ] = await Promise.all([
        getAdditions(),
        getEmployees(),
        getDepartments(),
      ]);

      // =========================
      // BONUSES
      // =========================
      const bonusesData =
        additionsRes?.data || [];

      const normalizedBonuses =
        bonusesData.map((b) => ({
          id: b.id,

          employee_id: b.employee_id,
          employee_name: b.employee_name,

          department_id: b.department_id,
          department: b.department_name,

          bonus_type:
            b.addition_type_arabic ||
            b.addition_type,

          scope:
            b.add_to === "employee"
              ? "فردية"
              : b.add_to === "department"
                ? "قسم"
                : "الشركة",

          amount: b.amount,

          reason: b.reason,

          period: b.date,

          status: b.state_arabic,

          raw_state: b.state,

          approved_by: b.approved_by_name,

          approval_date: b.approve_date,
        }));

      setBonuses(normalizedBonuses);

      // =========================
      // EMPLOYEES
      // =========================
      const employeesData =
        employeesRes?.data || [];

      const normalizedEmployees =
        employeesData.map((e) => ({
          id: e.id,

          full_name_ar:
            e.name,

          department:
            e.department_name,

          department_id:
            e.department_id,

          employee_number:
            e.employee_number,

          job_title:
            e.job_title,
        }));

      setEmployees(
        normalizedEmployees
      );

      // =========================
      // DEPARTMENTS
      // =========================
      const departmentsData =
        departmentsRes?.data || [];

      const normalizedDepartments =
        departmentsData.map((d) => ({
          id: d.id,

          name:
            d.name_ar ||
            d.name,

          english_name:
            d.name,

          total_employee:
            d.total_employee,
        }));

      setDepartments(
        normalizedDepartments
      );

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    const u = await base44.auth.me();
    await updateAddition(id, {
      state: "approved",
    });
    load();
  };
  const reject = async (id) => {
    await await updateAddition(id, {
      state: "rejected",
    });; load();
  };
  const pay = async (id) => {
    await updateAddition(id, {
      state: "paid",
    }); load();
  };

  const pending = bonuses.filter(
    b => b.raw_state === "under_approval"
  );

  const displayed =
    (activeTab === "pending"
      ? pending
      : bonuses
    ).filter(
      b =>
        !filterMonth ||
        b.period === filterMonth
    );
 
  const totals = {
    pending: pending.length,

    approved: bonuses.filter(
      b => b.raw_state === "approved"
    ).length,

    paid: bonuses
      .filter(
        b => b.raw_state === "paid"
      )
      .reduce(
        (s, b) => s + (b.amount || 0),
        0
      ),
  };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Gift className="w-6 h-6 text-green-600" />المكافآت والحوافز</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة مكافآت الموظفين فردياً أو على مستوى القسم أو الشركة</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus className="w-4 h-4" />مكافأة جديدة
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "قيد الاعتماد", value: totals.pending, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
          { label: "معتمدة (لم تُصرف)", value: totals.approved, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
          { label: "إجمالي المصروف (ريال)", value: `${totals.paid?.toLocaleString("ar-SA")} ر.س`, color: "text-green-600", bg: "bg-green-50 border-green-200" },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "all", label: `كل المكافآت (${bonuses.length})` },
          { id: "pending", label: `قيد الاعتماد (${pending.length})`, badge: pending.length > 0 },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
            {t.badge && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        {filterMonth && <button onClick={() => setFilterMonth("")} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 border border-border rounded-lg">مسح الفلتر</button>}
      </div>

      {activeTab === "pending" && pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          يوجد <span className="font-bold">{pending.length}</span> مكافأة بانتظار موافقتك
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["الموظف", "نوع المكافأة", "النطاق", "الفترة", "المبلغ", "الحالة", "الإجراءات"].map(h => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
              : displayed.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد مكافآت</td></tr>
                : displayed.map(b => (
                  <tr key={b.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${b.status === "قيد الاعتماد" ? "bg-amber-50/30" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{b.employee_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{b.department}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{b.bonus_type}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.scope}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.period}</td>
                    <td className="px-4 py-3 font-bold text-green-600">{b.amount?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {b.status === "قيد الاعتماد" && canApprove && <>
                          <button onClick={() => approve(b.id)} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 font-medium">اعتماد</button>
                          <button onClick={() => reject(b.id)} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-200 font-medium">رفض</button>
                        </>}
                        {b.status === "معتمدة" && canApprove && (
                          <button onClick={() => pay(b.id)} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" />صرف</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {showForm && <BonusForm employees={employees} departments={departments} onSave={() => { setShowForm(false); load(); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}