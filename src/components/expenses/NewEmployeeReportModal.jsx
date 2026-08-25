import { useState } from "react";
import { UserPlus, X, Send } from "lucide-react";
import { submitExpenseReport } from "@/api/expensesApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useToast } from "@/components/ui/use-toast";

const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ────────────────────────────────────────────────────────────────────────
   بوب-أب واحد — نفس أسلوب فورم "مصروف جديد": حقل اختيار الموظف (select) في الأعلى،
   وبمجرد الاختيار تظهر مصروفاته تحته في نفس الشاشة (من غير خطوات/رجوع).
   ──────────────────────────────────────────────────────────────────── */
export default function NewEmployeeReportModal({ employees, expenses, onClose, onDone }) {
  const { toast } = useToast();
  const [employeeId, setEmployeeId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [reportName, setReportName] = useState("");
  const [saving, setSaving] = useState(false);

  const employee = employees.find((e) => String(e.id) === String(employeeId)) || null;

  const handlePickEmployee = (id) => {
    setEmployeeId(id);
    setSelectedIds([]);
    setReportName("");
  };

  // الباك إند بيرفض تقديم أي مصروف مش في حالة "draft" — مثال رسالة الخطأ المؤكدة:
  // "No valid draft expenses found for this employee"
  const employeeExpenses = employee
    ? expenses.filter((e) => e.state === "draft" && !e.sheet_id && (String(e.employee_id) === String(employee.id) || e.employee_name === employee.name))
    : [];

  const toggleSelect = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  const selectedExpenses = employeeExpenses.filter((e) => selectedIds.includes(e.id));
  const total = selectedExpenses.reduce((s, e) => s + (e.total_amount || 0), 0);

  const submit = async () => {
    try {
      setSaving(true);
      await submitExpenseReport({
        name: reportName.trim(),
        expense_ids: selectedIds,
      });
      toast({ title: "تم تقديم تقرير المصروفات بنجاح ✅" });
      onDone();
    } catch (err) {
      console.error("خطأ أثناء تقديم التقرير:", err);
      toast({
        title: "تعذّر تقديم التقرير",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> مصروف موظف جديد
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الموظف *</label>
            <select value={employeeId} onChange={(e) => handlePickEmployee(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
              <option value="">اختر الموظف...</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name || emp.name_ar}</option>)}
            </select>
          </div>

          {employee && (
            <>
              {employeeExpenses.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">لا توجد مصروفات غير مُقدَّمة لهذا الموظف</p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        <th className="w-8 px-3 py-2" />
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">الوصف</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">التاريخ</th>
                        <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeeExpenses.map((exp) => (
                        <tr key={exp.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">
                            <input type="checkbox" checked={selectedIds.includes(exp.id)} onChange={() => toggleSelect(exp.id)}
                              className="w-4 h-4 accent-primary" />
                          </td>
                          <td className="px-3 py-2 font-medium text-foreground">{exp.name}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{exp.date}</td>
                          <td className="px-3 py-2 font-semibold">{fmt(exp.total_amount)} ر.س</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedIds.length > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">
                    هيتم تجميع {selectedIds.length} مصروف بإجمالي {fmt(total)} ر.س في تقرير واحد.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">اسم التقرير *</label>
                    <input value={reportName} onChange={(e) => setReportName(e.target.value)}
                      placeholder="مثال: مصروفات سفر أغسطس"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={submit} disabled={saving || selectedIds.length === 0 || !reportName.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Send className="w-4 h-4" />{saving ? "جاري التقديم..." : "تقديم التقرير"}
          </button>
        </div>
      </div>
    </div>
  );
}
