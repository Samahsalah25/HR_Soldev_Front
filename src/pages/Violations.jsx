import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Plus, X, CheckCircle } from "lucide-react";
import { useRole } from "../lib/useRole";

import {
  getViolations,
  createViolation,
  updateViolation,
} from "@/api/violationApi";

import { getEmployees } from "@/api/departmentsApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useServerPagination } from "@/lib/useServerPagination";
import TablePagination from "@/components/ui/TablePagination";

const STATUS_LABELS = {
  draft: "قيد المراجعة",
  under_review: "قيد المراجعة",
  approved: "مؤكدة",
  rejected: "ملغاة",
};

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  under_review: "bg-amber-100 text-amber-700",
  approved: "bg-red-100 text-red-600",
  rejected: "bg-gray-100 text-gray-500",
};

const VIOLATION_TYPES = [
  { label: "تأخر متكرر", value: "Frequent Lateness" },
  { label: "غياب بدون إذن", value: "Frequent Absence Without Permission" },
  { label: "مخالفة سلوكية", value: "Behaviour penalty" },
  { label: "مخالفة إجراءات", value: "Violation of procedures" },
  { label: "إهمال في العمل", value: "Negligence at work" },
  { label: "أخرى", value: "Other" },
];

const PENALTY_TYPES = [
  { label: "إنذار شفهي", value: "verbal_warning" },
  { label: "إنذار كتابي", value: "written_warning" },
  { label: "خصم من الراتب", value: "salary_deduction" },
  { label: "إيقاف عن العمل", value: "suspension" },
  { label: "إنهاء الخدمة", value: "end_of_service" },
  { label: "قيد التحقيق", value: "under_review" },
];

function ViolationForm({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "",
    violation_type: VIOLATION_TYPES[0].value,
    description: "",
    date: new Date().toISOString().slice(0, 10),
    penalty: PENALTY_TYPES[1].value,
    penalty_days: 0,
    penalty_amount: 0,
    issued_by: "",
  });

  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find((e) => e.id === Number(id));
    if (emp) {
      set("employee_id", emp.id);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        employee_id: Number(form.employee_id),
        violation_type_id: form.violation_type,
        date_of_violation: form.date,
        description: form.description,
        penalty_type: form.penalty,
        issued_from: form.issued_by,
      };

      if (form.penalty === "salary_deduction") {
        payload.deducted_salary = Number(form.penalty_amount || 0);
      }

      if (form.penalty === "suspension") {
        payload.suspended_days = Number(form.penalty_days || 0);
      }

      await createViolation(payload);

      onSave();
    } catch (err) {
      console.error("Error creating violation:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            تسجيل مخالفة
          </h3>

          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* EMPLOYEE */}
          <div>
            <label className="text-sm font-medium">الموظف *</label>

            <select
              value={form.employee_id}
              onChange={(e) => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">اختر الموظف...</option>

              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {/* TYPE + DATE */}
          <div className="grid grid-cols-2 gap-3">

            <div>
              <label className="text-sm font-medium">نوع المخالفة</label>

              <select
                value={form.violation_type}
                onChange={(e) => set("violation_type", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {VIOLATION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">تاريخ المخالفة</label>

              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="text-sm font-medium">الوصف *</label>

            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* PENALTY */}
          <div>
            <label className="text-sm font-medium">العقوبة</label>

            <select
              value={form.penalty}
              onChange={(e) => set("penalty", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              {PENALTY_TYPES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* CONDITIONAL FIELDS */}
          {form.penalty === "salary_deduction" && (
            <input
              type="number"
              placeholder="مبلغ الخصم"
              value={form.penalty_amount}
              onChange={(e) => set("penalty_amount", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          )}

          {form.penalty === "suspension" && (
            <input
              type="number"
              placeholder="عدد أيام الإيقاف"
              value={form.penalty_days}
              onChange={(e) => set("penalty_days", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          )}

          {/* ISSUED BY */}
          <input
            placeholder="صادرة من"
            value={form.issued_by}
            onChange={(e) => set("issued_by", e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          />

        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">

          <button onClick={onClose}>
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !form.employee_id || !form.description}
            className="bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            {saving ? "جاري الحفظ..." : "تسجيل المخالفة"}
          </button>

        </div>

      </div>
    </div>
  );
}

export default function Violations() {
  const confirmDialog = useConfirm();
  const { user, canDo } = useRole();
  const canCreate = canDo("violations", "create");
  const canApprove = canDo("violations", "approve");

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDate, setFilterDate] = useState("");

  // ================= LOAD =================
  const load = async () => {
    try {
      setLoading(true);
      const emps = await getEmployees();
      setEmployees(emps?.data || emps || []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fetchViolationsPage = useCallback((params) => getViolations(params), []);
  const violationsPagination = useServerPagination(fetchViolationsPage, 20);

  const refreshAll = () => {
    load();
    violationsPagination.reload();
  };

  // ================= CONFIRM =================
  const confirm_ = async (id) => {
    const ok = await confirmDialog({
      title: "اعتماد المخالفة",
      message: "هل أنت متأكد من اعتماد هذه المخالفة؟",
      confirmText: "اعتماد",
    });
    if (!ok) return;
    try {
      const v = violationsPagination.pageItems.find((x) => x.id === id);

      await updateViolation(id, {
        state: "approved",
      });

      // create deduction if salary deduction
      if (v?.penalty_type === "salary_deduction" && v?.deducted_salary > 0) {
        await createDeduction?.({
          employee_id: v.employee_id,
          amount: v.deducted_salary,
          reason: v.description || "Violation deduction",
          violation_id: id,
          status: "pending",
        });
      }

      refreshAll();
    } catch (err) {
      console.error("Confirm error:", err);
    }
  };

  // ================= CANCEL =================
  const cancel_ = async (id) => {
    const ok = await confirmDialog({
      title: "رفض المخالفة",
      message: "هل أنت متأكد من رفض هذه المخالفة؟",
      confirmText: "رفض",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await updateViolation(id, {
        state: "rejected",
      });

      refreshAll();
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };
  const getViolationLabel = (value) =>
    VIOLATION_TYPES.find((t) => t.value === value)?.label || value;

  const getPenaltyLabel = (value) =>
    PENALTY_TYPES.find((p) => p.value === value)?.label || value;

  // ================= FILTER =================
  // ملاحظة: الفلترة دلوقتي بتشتغل على الصفحة الحالية بس بعد ما بقى الـ pagination من الباك
  const filtered = violationsPagination.pageItems
    .filter((v) => !filterDate || v.date?.slice(0, 7) === filterDate)
    .filter(
      (v) =>
        !search ||
        v.employee_name?.includes(search) ||
        getViolationLabel(v.violation_type_name)?.includes(search)
    );

  // ================= UI =================
  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            المخالفات التأديبية
          </h1>
          <p className="text-sm text-muted-foreground">
            تسجيل وإدارة المخالفات
          </p>
        </div>

        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            <Plus className="w-4 h-4 inline-block ml-1" />
            تسجيل مخالفة
          </button>
        )}
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "إجمالي المخالفات",
            value: violationsPagination.totalItems,
            color: "text-foreground",
          },
          {
            label: "قيد المراجعة",
            value: violationsPagination.pageItems.filter((v) => v.state === "under_review").length,
            color: "text-amber-600",
          },
          {
            label: "مؤكدة",
            value: violationsPagination.pageItems.filter((v) => v.state === "approved").length,
            color: "text-red-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-card border rounded-xl p-4 text-center"
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالموظف أو نوع المخالفة..."
          className="border px-3 py-2 rounded-lg"
        />

        <input
          type="month"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />

        {filterDate && (
          <button onClick={() => setFilterDate("")}>مسح</button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              {["الموظف", "المخالفة", "التاريخ", "العقوبة", "الحالة", "إجراء"].map(
                (h) => (
                  <th key={h} className="p-3 text-right">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {violationsPagination.loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  جاري التحميل...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center">
                  لا يوجد بيانات
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b hover:bg-muted/20">
                  <td className="p-3">
                    <div className="font-medium">{v.employee_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.department_name}
                    </div>
                  </td>

                  <td className="p-3">{getViolationLabel(v.violation_type_name)}</td>

                  <td className="p-3 text-xs">
                    {v.date
                      ? new Date(v.date).toLocaleDateString(
                        "ar-SA"
                      )
                      : "—"}
                  </td>

                  <td className="p-3">

                    <div>{getPenaltyLabel(v.custom_penalty_type)}</div>

                    {v.deduction_amount > 0 && (
                      <div className="text-red-600 text-xs">
                        {v.deduction_amount} ر.س
                      </div>
                    )}

                    {v.suspension_days > 0 && (
                      <div className="text-amber-600 text-xs">
                        {v.suspension_days} أيام
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded ${STATUS_COLORS[v.state]}`}>
                      {STATUS_LABELS[v.state] || v.state}
                    </span>
                  </td>

                  <td className="p-3">
                    {v.state === "under_review" && canApprove && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => confirm_(v.id)}
                          className="text-green-600"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => cancel_(v.id)}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
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
          page={violationsPagination.page}
          totalPages={violationsPagination.totalPages}
          totalItems={violationsPagination.totalItems}
          pageSize={violationsPagination.pageSize}
          onPageChange={violationsPagination.setPage}
        />
      </div>

      {/* FORM */}
      {showForm && canCreate && (
        <ViolationForm
          employees={employees}
          onSave={() => {
            setShowForm(false);
            refreshAll();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}