import { useState } from "react";
import { UserCog, X, Save } from "lucide-react";
import { createExpense, updateExpense } from "@/api/expensesApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useToast } from "@/components/ui/use-toast";

// ملاحظة: "own_account" و"company_account" دي القيم القياسية لحقل payment_mode في Odoo hr_expense.
export const PAYMENT_MODES = [
  { value: "own_account", label: "على حساب الموظف (تعويض لاحقًا)" },
  { value: "company_account", label: "على حساب الشركة مباشرة" },
];

// قيم مؤكدة من توثيق POST /expenses
export const EXPENSE_CATEGORIES = [
  { value: "stationary", label: "لوازم مكتبية" },
  { value: "travel", label: "سفر" },
  { value: "hospitality", label: "ضيافة" },
  { value: "rent", label: "إيجار" },
  { value: "receipt", label: "إيصال" },
  { value: "other", label: "أخرى" },
];

/* ────────────────────────────────────────────────────────────────────────
   فورم إنشاء / تعديل مصروف — مشترك بين صفحة "مصروفاتي" وصفحة محاسبة الموردين
   employees + showEmployeeField: بيتفعّلوا بس من صفحة المحاسبة عشان تقدر
   تنشئ مصروف لموظف تاني (employee_id اختياري — لو اتسابت فاضية بيتسجل
   للحساب الحالي تلقائيًا حسب توثيق الـ API)
   ──────────────────────────────────────────────────────────────────── */
export default function ExpenseForm({ expense, products, employees = [], showEmployeeField = false, onSave, onClose }) {
  const { toast } = useToast();
  const isEdit = Boolean(expense?.id);

  const [form, setForm] = useState({
    name: expense?.name || "",
    total_amount: expense?.total_amount ?? "",
    employee_id: expense?.employee_id || "",
    product_id: expense?.product_id || "",
    date: expense?.date || new Date().toISOString().slice(0, 10),
    payment_mode: expense?.payment_mode || "own_account",
    expense_category: expense?.expense_category || "",
    receipt_number: expense?.receipt_number || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setError("");
    try {
      setSaving(true);
      const payload = {
        name: form.name,
        total_amount: Number(form.total_amount) || 0,
        employee_id: form.employee_id ? Number(form.employee_id) : undefined,
        product_id: form.product_id ? Number(form.product_id) : undefined,
        date: form.date,
        payment_mode: form.payment_mode,
        expense_category: form.expense_category || undefined,
        receipt_number: form.receipt_number || undefined,
      };

      if (isEdit) {
        await updateExpense(expense.id, payload);
      } else {
        await createExpense(payload);
      }

      onSave();
    } catch (err) {
      console.error("خطأ أثناء حفظ المصروف:", err);
      setError(extractApiErrorMessage(err, "حصل خطأ أثناء حفظ المصروف، حاول تاني."));
      toast({
        title: "تعذّر حفظ المصروف",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" />
            {isEdit ? "تعديل مصروف" : "مصروف جديد"}
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg border border-red-200">{error}</div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">وصف المصروف *</label>
            <input value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="مثال: غداء عمل مع عميل"
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
          </div>

          {showEmployeeField && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الموظف</label>
              <select value={form.employee_id} onChange={(e) => set("employee_id", e.target.value)}
                disabled={isEdit}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none disabled:opacity-50">
                <option value="">أنا (الحساب الحالي)</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name || emp.name_ar}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المنتج / نوع المصروف</label>
              <select value={form.product_id} onChange={(e) => set("product_id", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">اختر...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المبلغ *</label>
              <input type="number" min={0} dir="ltr" value={form.total_amount}
                onChange={(e) => set("total_amount", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التاريخ *</label>
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">طريقة الدفع</label>
              <select value={form.payment_mode} onChange={(e) => set("payment_mode", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">تصنيف المصروف</label>
              <select value={form.expense_category} onChange={(e) => set("expense_category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none">
                <option value="">بدون</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">رقم الإيصال</label>
              <input value={form.receipt_number} onChange={(e) => set("receipt_number", e.target.value)}
                dir="ltr"
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
          <button onClick={handleSave} disabled={saving || !form.name || !form.total_amount || !form.date}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="w-4 h-4" />{saving ? "جاري الحفظ..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}
