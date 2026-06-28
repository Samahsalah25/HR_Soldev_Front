import { useState, useEffect } from "react";
import { X, Save, AlertTriangle } from "lucide-react";
import { createVacationRequest, getVacationYearlyBalance } from "@/api/requestsApi";

const LEAVE_TYPES = {
  yearly: "سنوية",
  sick_leaves: "مرضية (حتى 120 يوم)",
  unpaid: "بدون راتب",
  peternety: "أمومة (حتى 70 يوم)",
  fatherly: "أبوة (حتى 3 أيام)",
  marriage: "زواج (حتى 5 أيام)",
  death: "وفاة (حتى 5 أيام)",
  plimsarage: "حج (حتى 10 أيام)",
};

export default function LeaveRequestModal({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "",
    vacation_type: "yearly",
    from: "",
    to: "",
    contains_flying_ticket: false,
    notes: "",
  });
  const [leaveBalance, setLeaveBalance] = useState(null); // null = لم يُحدد بعد
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const days = form.from && form.to
    ? Math.ceil((new Date(form.to) - new Date(form.from)) / 86400000) + 1
    : 0;

  const isYearly = form.vacation_type === "yearly";
  const overBalance = isYearly && leaveBalance !== null && days > leaveBalance;

  // جلب رصيد الإجازة لما يختار موظف
  const handleEmpSelect = async (id) => {
    set("employee_id", id);
    if (!id) { setLeaveBalance(null); return; }

    // جرب تجيب الرصيد من الـ employees list
    const emp = employees.find(e => String(e.id) === String(id));
    const localBalance = emp?.annual_leave_balance ?? emp?.leave_balance ?? null;

    if (localBalance !== null) {
      setLeaveBalance(Number(localBalance));
      return;
    }

    // fallback: جلب من الـ API
    setBalanceLoading(true);
    try {
      const data = await getVacationYearlyBalance();
      const list = Array.isArray(data) ? data : data?.data ?? [];
      const empBalance = list.find(b => String(b.employee_id) === String(id));
      setLeaveBalance(empBalance?.balance ?? empBalance?.remaining ?? 0);
    } catch {
      setLeaveBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleSave = async () => {
    // تحقق من رصيد الإجازة السنوية
    if (isYearly && leaveBalance !== null && days > leaveBalance) {
      alert(`رصيد إجازاتك السنوية (${leaveBalance} يوم) غير كافٍ للأيام المطلوبة (${days} يوم)`);
      return;
    }

    setSaving(true);
    try {
      await createVacationRequest({
        employee_id: form.employee_id,
        vacation_type: form.vacation_type,
        from: form.from,
        to: form.to,
        contains_flying_ticket: form.contains_flying_ticket,
        notes: form.notes,
      });
      onSave();
    } catch (err) {
      const rawError = err?.response?.data;
      let msg = "حصل خطأ أثناء إرسال الطلب";

      if (typeof rawError === "string" && rawError.includes("overlaps")) {
        msg = "الموظف لديه إجازة موافق عليها في نفس الفترة المطلوبة";
      } else if (rawError?.error) {
        if (rawError.error.includes("overlaps")) {
          msg = "الموظف لديه إجازة موافق عليها في نفس الفترة المطلوبة";
        } else {
          msg = rawError.error;
        }
      }
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">طلب إجازة جديد</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* الموظف */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الموظف *</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name_ar || e.name || e.full_name_ar} — {e.department_name || e.department || ""}
                </option>
              ))}
            </select>
          </div>

          {/* رصيد الإجازة السنوية */}
          {form.employee_id && isYearly && (
            <div className={`rounded-lg px-4 py-2.5 flex items-center justify-between border
              ${balanceLoading ? "bg-muted/30 border-border" :
                leaveBalance === 0 ? "bg-red-50 border-red-200" :
                  leaveBalance !== null && leaveBalance < 5 ? "bg-amber-50 border-amber-200" :
                    "bg-slate-50 border-border"}`}>
              <span className="text-sm text-muted-foreground">رصيد الإجازة السنوية</span>
              {balanceLoading ? (
                <span className="text-sm text-muted-foreground">جاري التحميل...</span>
              ) : (
                <span className={`text-lg font-bold ${leaveBalance === 0 ? "text-red-600" :
                  leaveBalance !== null && leaveBalance < 5 ? "text-amber-600" :
                    "text-secondary"}`}>
                  {leaveBalance ?? "—"} يوم
                </span>
              )}
            </div>
          )}

          {/* نوع الإجازة */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">نوع الإجازة *</label>
            <select value={form.vacation_type} onChange={e => set("vacation_type", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              {Object.entries(LEAVE_TYPES).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          {/* التواريخ */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">من تاريخ *</label>
              <input type="date" value={form.from} onChange={e => set("from", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">إلى تاريخ *</label>
              <input type="date" value={form.to} onChange={e => set("to", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>

          {/* عدد الأيام + تحذير الرصيد */}
          {days > 0 && (
            <div className={`rounded-lg px-4 py-2.5 border text-sm
              ${overBalance ? "bg-red-50 border-red-200" : "bg-primary/5 border-primary/20"}`}>
              <div className="flex justify-between items-center">
                <span className={overBalance ? "text-red-700" : "text-foreground"}>عدد الأيام المطلوبة</span>
                <span className={`font-bold text-lg ${overBalance ? "text-red-700" : "text-primary"}`}>
                  {days} يوم
                </span>
              </div>
              {overBalance && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <p className="text-xs text-red-600">
                    رصيد إجازاتك ({leaveBalance} يوم) غير كافٍ للأيام المطلوبة ({days} يوم)
                  </p>
                </div>
              )}
            </div>
          )}

          {/* تذكرة طيران */}
          {isYearly && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.contains_flying_ticket}
                onChange={e => set("contains_flying_ticket", e.target.checked)}
                className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">تضمين تذكرة طيران ✈️</span>
            </label>
          )}

          {/* ملاحظات */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ملاحظات</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave}
            disabled={saving || !form.employee_id || !form.from || !form.to}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50
              ${overBalance ? "bg-red-600 text-white hover:bg-red-700" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}
