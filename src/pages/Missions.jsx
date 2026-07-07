import { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle, MapPin } from "lucide-react";
import { useRole } from "../lib/useRole";
import { formatCurrency } from "../lib/hrUtils";

import {
  getMissions,
  createMission,
  updateMission,
} from "@/api/missionApi";

import { getEmployees } from "@/api/departmentsApi";
// const STATUS_STYLES = {
//   "قيد الانتظار": "bg-amber-100 text-amber-700",
//   "موافق عليها": "bg-blue-100 text-blue-700",
//   "جارية": "bg-green-100 text-green-700",
//   "مكتملة": "bg-gray-100 text-gray-600",
//   "ملغاة": "bg-red-100 text-red-600",
// };
const STATUS_STYLES = {
  waiting: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
};
const STATUS_LABELS = {
  waiting: "قيد الانتظار",
  approved: "موافق عليها",
  ongoing: "جارية",
  completed: "مكتملة",
  cancelled: "ملغاة",
};
export default function Missions() {
  const { user } = useRole();
  const canCreate = canDo(user, "missions", "create");
  const canApprove = canDo(user, "missions", "approve");
  const [missions, setMissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    destination: "", purpose: "", start_date: "", end_date: "",
    days_count: 0, daily_allowance: 0, total_budget: 0,
    advance_amount: 0, cost_center: "", project: "", notes: "",
  });

  const load = async () => {
    try {
      setLoading(true);

      const [ms, emps] = await Promise.all([
        getMissions(),
        getEmployees(),
      ]);

      setMissions(ms?.data || []);
      setEmployees(emps?.data || []);
    } catch (error) {
      console.error("Error loading missions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === Number(id));

    if (emp) {
      setForm(f => ({
        ...f,
        employee_id: emp.id,
        employee_name: emp.name,
        department: emp.department_name || "",
      }));
    }
  };

  const calcDays = (start, end) => !start || !end ? 0 : Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;

  const handleDateChange = (key, val) => {
    const updated = { ...form, [key]: val };
    const days = calcDays(updated.start_date, updated.end_date);
    updated.days_count = days;
    updated.total_budget = days * updated.daily_allowance;
    setForm(updated);
  };

  const handleAllowanceChange = (val) => {
    const daily = +val;
    setForm(f => ({ ...f, daily_allowance: daily, total_budget: f.days_count * daily }));
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);

      await createMission({
        employee_id: Number(form.employee_id),

        destination: form.destination,

        reason: form.purpose,

        from_date: form.start_date,

        to_date: form.end_date,

        daily_allowance: Number(form.daily_allowance),

        advance_required: Number(form.advance_amount),

        cost_center: form.cost_center,

        comments: form.notes,

        state: "waiting",
      });

      setShowForm(false);

      setForm({
        employee_id: "",
        employee_name: "",
        department: "",

        destination: "",
        purpose: "",

        start_date: "",
        end_date: "",

        days_count: 0,

        daily_allowance: 0,
        total_budget: 0,

        advance_amount: 0,

        cost_center: "",
        project: "",
        notes: "",
      });

      load();
    } catch (error) {
      console.error("Error creating mission:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, state) => {
    try {
      await updateMission(id, {
        state,
      });

      load();
    } catch (error) {
      console.error("Error updating mission:", error);
    }
  };

  const stats = {
    total: missions.length,

    pending: missions.filter(
      (m) => m.state === "waiting"
    ).length,

    active: missions.filter(
      (m) => m.state === "ongoing"
    ).length,

    totalBudget: missions
      .filter(
        (m) => m.state !== "cancelled"
      )
      .reduce((s, m) => {

        const days =
          m.from_date && m.to_date
            ? Math.ceil(
              (new Date(m.to_date) - new Date(m.from_date)) /
              (1000 * 60 * 60 * 24)
            ) + 1
            : 0;

        return s + days * Number(m.daily_allowance || 0);

      }, 0),
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المهمات والسفر</h1>
          <p className="text-sm text-muted-foreground mt-0.5">إدارة طلبات المهمات الرسمية ومصاريف السفر</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium">
            <Plus className="w-4 h-4" />طلب مهمة
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المهمات", value: stats.total, color: "text-primary" },
          { label: "بانتظار الموافقة", value: stats.pending, color: "text-amber-600" },
          { label: "مهمات جارية", value: stats.active, color: "text-green-600" },
          { label: "إجمالي الميزانية", value: formatCurrency(stats.totalBudget), color: "text-secondary" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {[
                  "الموظف",
                  "الوجهة",
                  "الغرض",
                  "من",
                  "إلى",
                  "الأيام",
                  "البدل اليومي",
                  "الميزانية",
                  "الحالة",
                  "إجراءات",
                ].map((h) => (
                  <th
                    key={h}
                    className="text-right px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap"
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
                    colSpan={10}
                    className="text-center py-10 text-muted-foreground"
                  >
                    جاري التحميل...
                  </td>
                </tr>
              ) : missions.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-10 text-muted-foreground"
                  >
                    لا توجد مهمات مسجلة
                  </td>
                </tr>
              ) : (
                missions.map((m) => {
                  const days =
                    m.from_date && m.to_date
                      ? Math.ceil(
                        (new Date(m.to_date) - new Date(m.from_date)) /
                        (1000 * 60 * 60 * 24)
                      ) + 1
                      : 0;

                  const totalBudget =
                    days * Number(m.daily_allowance || 0);

                  return (
                    <tr
                      key={m.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      {/* الموظف */}
                      <td className="px-3 py-3">
                        <p className="font-medium">
                          {m.employee_name || "—"}
                        </p>

                        <p className="text-xs text-muted-foreground">
                          {m.department_name || "—"}
                        </p>
                      </td>

                      {/* الوجهة */}
                      <td className="px-3 py-3 text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {m.destination || "—"}
                        </div>
                      </td>

                      {/* الغرض */}
                      <td className="px-3 py-3 text-muted-foreground max-w-28 truncate">
                        {m.reason || "—"}
                      </td>

                      {/* من */}
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {m.from_date
                          ? new Date(m.from_date).toLocaleDateString("ar-SA")
                          : "—"}
                      </td>

                      {/* إلى */}
                      <td className="px-3 py-3 text-xs text-muted-foreground">
                        {m.to_date
                          ? new Date(m.to_date).toLocaleDateString("ar-SA")
                          : "—"}
                      </td>

                      {/* الأيام */}
                      <td className="px-3 py-3 text-center font-semibold">
                        {days}
                      </td>

                      {/* البدل اليومي */}
                      <td className="px-3 py-3">
                        {formatCurrency(m.daily_allowance || 0)}
                      </td>

                      {/* الميزانية */}
                      <td className="px-3 py-3 font-semibold text-secondary">
                        {formatCurrency(totalBudget)}
                      </td>

                      {/* الحالة */}
                      <td className="px-3 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[m.state] || ""
                            }`}
                        >
                          {STATUS_LABELS[m.state] || m.state}
                        </span>
                      </td>

                      {/* الإجراءات */}
                      <td className="px-3 py-3">
                        {m.state === "waiting" && canApprove && (
                          <div className="flex gap-1">
                            <button
                              onClick={() =>
                                updateStatus(m.id, "approved")
                              }
                              title="قبول"
                              className="p-1 rounded hover:bg-green-50 text-green-600"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                updateStatus(m.id, "cancelled")
                              }
                              title="رفض"
                              className="p-1 rounded hover:bg-red-50 text-red-600"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {m.state === "approved" && (
                          <button
                            onClick={() =>
                              updateStatus(m.id, "ongoing")
                            }
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                          >
                            بدأت
                          </button>
                        )}

                        {m.state === "ongoing" && (
                          <button
                            onClick={() =>
                              updateStatus(m.id, "completed")
                            }
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            اكتملت
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          dir="rtl"
        >
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">
                طلب مهمة رسمية
              </h3>

              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* EMPLOYEE */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  الموظف *
                </label>

                <select
                  value={form.employee_id}
                  onChange={(e) => handleEmpSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                >
                  <option value="">
                    اختر الموظف...
                  </option>

                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* DESTINATION + PURPOSE */}
              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    الوجهة *
                  </label>

                  <input
                    value={form.destination}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        destination: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                    placeholder="القاهرة، دبي، الرياض..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    سبب المهمة *
                  </label>

                  <input
                    value={form.purpose}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        purpose: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                    placeholder="اجتماع، تدريب، زيارة..."
                  />
                </div>

              </div>

              {/* DATES */}
              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    من تاريخ *
                  </label>

                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      handleDateChange("start_date", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    إلى تاريخ *
                  </label>

                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(e) =>
                      handleDateChange("end_date", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                </div>

              </div>

              {/* ALLOWANCE */}
              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    البدل اليومي
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={form.daily_allowance}
                    onChange={(e) =>
                      handleAllowanceChange(e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    المبلغ المسبق
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={form.advance_amount}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        advance_amount: +e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                </div>

              </div>

              {/* SUMMARY */}
              {form.days_count > 0 && (
                <div className="bg-secondary/10 rounded-lg p-3 text-sm">

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      عدد الأيام:
                    </span>

                    <span className="font-semibold">
                      {form.days_count} يوم
                    </span>
                  </div>

                  <div className="flex justify-between mt-1">
                    <span className="text-muted-foreground">
                      إجمالي الميزانية:
                    </span>

                    <span className="font-bold text-secondary">
                      {formatCurrency(form.total_budget)}
                    </span>
                  </div>

                </div>
              )}

              {/* COST CENTER */}
              <div className="grid grid-cols-2 gap-3">

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    مركز التكلفة
                  </label>

                  <input
                    value={form.cost_center}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        cost_center: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    المشروع
                  </label>

                  <input
                    value={form.project}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        project: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none"
                  />
                </div>

              </div>

              {/* NOTES */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  ملاحظات
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      notes: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none"
                />
              </div>

            </div>

            {/* FOOTER */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">

              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
              >
                إلغاء
              </button>

              <button
                onClick={handleSubmit}
                disabled={
                  saving ||
                  !form.employee_id ||
                  !form.destination ||
                  !form.purpose ||
                  !form.start_date ||
                  !form.end_date
                }
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "جاري الحفظ..." : "إرسال الطلب"}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}