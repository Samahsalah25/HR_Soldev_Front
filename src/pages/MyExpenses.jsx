import { useState, useEffect } from "react";
import { Wallet, Plus, Save, Trash2, Paperclip, Eye } from "lucide-react";
import { getExpenses, deleteExpense, getExpenseAttachment } from "@/api/expensesApi";
import { getProducts } from "@/api/accountingApi";
import { getEmployees } from "@/api/departmentsApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useAuth } from "../lib/AuthContext";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import AttachReceiptModal from "@/components/expenses/AttachReceiptModal";

// ⚠️ "submitted" اتأكدت من بيانات حقيقية إنها القيمة الفعلية اللي الباك إند بيرجعها
// (مش "reported" زي ما كنت مخمّن الأول) — سايبين "reported" كـ fallback احتياطي بس.
const EXPENSE_STATE_LABELS = { draft: "مسودة", submitted: "مُقدَّم", reported: "مُقدَّم", done: "مُعتمد", approved: "مُعتمد", refused: "مرفوض", cancel: "ملغي", cancelled: "ملغي" };
const EXPENSE_STATE_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  reported: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-600",
  cancel: "bg-gray-100 text-gray-500",
  cancelled: "bg-gray-100 text-gray-500",
};

const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية — مصروفات
   إنشاء/تعديل/حذف المصروفات بس — التقديم كتقرير والاعتماد/الرفض/الدفع
   موجودين في صفحة "مصروفات الموظفين" بالمحاسبة.
   ──────────────────────────────────────────────────────────────────── */
export default function MyExpenses() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [receiptExpense, setReceiptExpense] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [expRes, prods, emps] = await Promise.all([
        getExpenses(),
        getProducts("expense").catch(() => []),
        getEmployees().catch(() => ({ data: [] })),
      ]);
      setExpenses(expRes?.expenses || []);
      setProducts(prods);
      setEmployees(emps?.data || emps || []);
    } catch (err) {
      console.error("خطأ أثناء تحميل المصروفات:", err);
      toast({
        title: "تعذّر تحميل المصروفات",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) load(); }, [user]);

  const openCreate = () => { setEditExpense(null); setShowExpenseForm(true); };
  const openEdit = (exp) => { setEditExpense(exp); setShowExpenseForm(true); };
  const closeForm = () => { setShowExpenseForm(false); setEditExpense(null); };

  const handleDelete = async (exp) => {
    const ok = await confirmDialog({
      title: "حذف المصروف",
      message: "هل أنت متأكد من حذف هذا المصروف؟ لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "حذف",
      variant: "destructive",
    });
    if (!ok) return;
    try {
      await deleteExpense(exp.id);
      toast({ title: "تم حذف المصروف" });
      load();
    } catch (err) {
      console.error("خطأ أثناء حذف المصروف:", err);
      toast({
        title: "تعذّر حذف المصروف",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const handleViewAttachment = async (exp) => {
    try {
      const blob = await getExpenseAttachment(exp.id);
      window.open(window.URL.createObjectURL(blob), "_blank");
    } catch (err) {
      console.error("خطأ أثناء عرض المرفق:", err);
      toast({
        title: "تعذّر عرض المرفق",
        description: extractApiErrorMessage(err),
        variant: "destructive",
      });
    }
  };

  const expensesPagination = usePagination(expenses, 20);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> مصروفات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">سجّل المصروفات وقدّمها للاعتماد والتعويض</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> مصروف جديد
        </button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              {["الوصف", "الموظف", "النوع", "التاريخ", "المبلغ", "الحالة", "إجراءات"].map((h) => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد مصروفات بعد</td></tr>
            ) : expensesPagination.pageItems.map((exp) => (
              <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-4 py-3 font-medium text-foreground">{exp.name}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{exp.employee_name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{exp.product_name || "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{exp.date}</td>
                <td className="px-4 py-3 font-semibold">{fmt(exp.total_amount)} ر.س</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${EXPENSE_STATE_COLORS[exp.state] || "bg-muted text-muted-foreground"}`}>
                    {EXPENSE_STATE_LABELS[exp.state] || exp.state}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {exp.message_main_attachment_id && (
                      <button onClick={() => handleViewAttachment(exp)} title="عرض المرفق" className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => setReceiptExpense(exp)} title="رفع إيصال" className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    {!exp.sheet_id && (
                      <>
                        <button onClick={() => openEdit(exp)} title="تعديل" className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                          <Save className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(exp)} title="حذف" className="p-1.5 hover:bg-red-50 rounded text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          page={expensesPagination.page}
          totalPages={expensesPagination.totalPages}
          totalItems={expensesPagination.totalItems}
          pageSize={expensesPagination.pageSize}
          onPageChange={expensesPagination.setPage}
        />
      </div>

      {showExpenseForm && (
        <ExpenseForm expense={editExpense} products={products} employees={employees} showEmployeeField
          onSave={() => { closeForm(); load(); }} onClose={closeForm} />
      )}
      {receiptExpense && (
        <AttachReceiptModal expense={receiptExpense} onClose={() => setReceiptExpense(null)}
          onDone={() => { setReceiptExpense(null); load(); }} />
      )}
    </div>
  );
}
