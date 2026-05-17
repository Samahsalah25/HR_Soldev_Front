import { useState } from "react";
import { X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { calcAutoLeaveBalance, getLeaveEntitlement, calcServiceYears } from "../../lib/hrUtils";

const LEAVE_TYPES = {
  "سنوية": null, "مرضية": 120, "أمومة": 70, "أبوة": 3,
  "زواج": 5, "وفاة": 5, "حج": 10, "بدون راتب": null,
};

export default function LeaveRequestModal({ employees, onSave, onClose }) {
  const [form, setForm] = useState({
    employee_id: "", employee_name: "", department: "",
    leave_type: "سنوية", start_date: "", end_date: "",
    include_ticket: false, notes: ""
  });
  const [saving, setSaving] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleEmpSelect = (id) => {
    const emp = employees.find(e => e.id === id);
    setSelectedEmp(emp || null);
    if (emp) set("employee_id", id), set("employee_name", emp.full_name_ar), set("department", emp.department || "");
  };

  const days = form.start_date && form.end_date
    ? Math.ceil((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1
    : 0;

  const balance = selectedEmp ? calcAutoLeaveBalance(selectedEmp.join_date, selectedEmp.annual_leave_balance || 0) : 0;
  const entitlement = selectedEmp ? getLeaveEntitlement(calcServiceYears(selectedEmp.join_date || "")) : 21;
  const isAnnual = form.leave_type === "سنوية";
  const overBalance = isAnnual && days > balance;

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.EmployeeRequest.create({
      ...form,
      request_type: "طلب إجازة",
      details: `نوع الإجازة: ${form.leave_type} | من ${form.start_date} إلى ${form.end_date} | ${days} أيام${form.include_ticket ? " | مع تذكرة طيران" : ""}`,
      amount: 0,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days_count: days,
      include_ticket: form.include_ticket,
      status: "قيد المراجعة",
    });
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground">طلب إجازة جديد</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">الموظف *</label>
            <select value={form.employee_id} onChange={e => handleEmpSelect(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar} — {e.department}</option>)}
            </select>
          </div>

          {selectedEmp && isAnnual && (
            <div className="bg-slate-50 border border-border rounded-lg px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">رصيد الإجازة السنوية</span>
              <span className={`text-lg font-bold ${balance < 5 ? "text-red-600" : "text-secondary"}`}>{balance} يوم</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">نوع الإجازة *</label>
            <select value={form.leave_type} onChange={e => set("leave_type", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none">
              {Object.entries(LEAVE_TYPES).map(([t, max]) => (
                <option key={t} value={t}>{t}{max ? ` (حتى ${max} يوم)` : ""}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">من تاريخ</label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">إلى تاريخ</label>
              <input type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none" />
            </div>
          </div>

          {days > 0 && (
            <div className={`rounded-lg px-4 py-2.5 text-sm border ${overBalance ? "bg-red-50 border-red-200" : "bg-primary/5 border-primary/20"}`}>
              <div className="flex justify-between">
                <span className={overBalance ? "text-red-700" : "text-foreground"}>عدد الأيام المطلوبة</span>
                <span className={`font-bold text-lg ${overBalance ? "text-red-700" : "text-primary"}`}>{days} يوم</span>
              </div>
              {isAnnual && overBalance && (
                <p className="text-xs text-red-600 mt-1">⚠️ يتجاوز رصيدك ({balance} يوم) — سيُعامَل كطلب استثنائي</p>
              )}
            </div>
          )}

          {form.leave_type === "سنوية" && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.include_ticket} onChange={e => set("include_ticket", e.target.checked)} className="w-4 h-4 accent-primary" />
              <span className="text-sm text-foreground">تضمين تذكرة طيران</span>
            </label>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">ملاحظات</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted text-foreground">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.employee_id || !form.start_date || !form.end_date}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الإرسال..." : "إرسال الطلب"}
          </button>
        </div>
      </div>
    </div>
  );
}