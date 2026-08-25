import { useState, useEffect } from "react";
import {
  UserCog, Save, Trash2, Paperclip, ArrowRight, X, Send, UserPlus,
  CheckCircle, XCircle, CreditCard, FileCheck,
} from "lucide-react";
import NewEmployeeReportModal from "@/components/expenses/NewEmployeeReportModal";
import {
  getExpenses,
  deleteExpense,
  getExpenseReports,
  getExpenseReport,
  approveExpenseReport,
  postExpenseReportToAccountant,
} from "@/api/expensesApi";
import { getProducts } from "@/api/accountingApi";
import { getEmployees } from "@/api/departmentsApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/use-toast";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import AttachReceiptModal from "@/components/expenses/AttachReceiptModal";
import SubmitReportModal from "@/components/expenses/SubmitReportModal";
import RefuseReportModal from "@/components/expenses/RefuseReportModal";
import RegisterPaymentModal from "@/components/expenses/RegisterPaymentModal";

const EXPENSE_STATE_LABELS = { draft: "مسودة", reported: "مُقدَّم", done: "مُعتمد", refused: "مرفوض" };
const EXPENSE_STATE_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  reported: "bg-amber-100 text-amber-700",
  done: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-600",
};

// ⚠️ مفيش عينة رد فيها تقرير فعلي من الـ API (الرد كان فاضي: reports: [])،
// فالـ labels دي افتراضية مبنية على تدفق Odoo القياسي (draft → submitted → approved → posted → paid)
// ولازم تتأكد من القيم الحقيقية اللي بترجع من الباك إند وتتعدّل هنا لو مختلفة.
const REPORT_STATE_LABELS = {
  draft: "مسودة",
  submitted: "بانتظار الاعتماد",
  approved: "معتمد",
  posted: "مُرحَّل للمحاسب",
  paid: "مدفوع",
  refused: "مرفوض",
  cancelled: "ملغي",
};
const REPORT_STATE_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  posted: "bg-purple-100 text-purple-700",
  paid: "bg-green-100 text-green-700",
  refused: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-500",
};

const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ────────────────────────────────────────────────────────────────────────
   تفاصيل تقرير مصروفات
   ──────────────────────────────────────────────────────────────────── */
function ReportDetail({ reportId, onBack, onChanged }) {
  const { toast } = useToast();
  const confirmDialog = useConfirm();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRefuse, setShowRefuse] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  const load = () => {
    setLoading(true);
    getExpenseReport(reportId)
      .then((res) => setReport(res?.report || res?.data || res))
      .catch((err) => {
        console.error("تعذّر تحميل التقرير:", err);
        toast({ title: "تعذّر تحميل التقرير", description: extractApiErrorMessage(err), variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [reportId]);

  const run = async (fn, successMsg, errorTitle) => {
    try {
      setBusy(true);
      await fn();
      if (successMsg) toast({ title: successMsg });
      load();
      onChanged();
    } catch (err) {
      console.error(`${errorTitle}:`, err);
      toast({ title: errorTitle, description: extractApiErrorMessage(err), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    const ok = await confirmDialog({ title: "اعتماد التقرير", message: "هل أنت متأكد من اعتماد تقرير المصروفات ده؟", confirmText: "اعتماد" });
    if (!ok) return;
    run(() => approveExpenseReport(reportId), "تم اعتماد التقرير بنجاح ✅", "تعذّر اعتماد التقرير");
  };

  const handlePost = async () => {
    const ok = await confirmDialog({ title: "ترحيل للمحاسب", message: "هل تريد ترحيل هذا التقرير للمحاسب؟", confirmText: "ترحيل" });
    if (!ok) return;
    run(() => postExpenseReportToAccountant(reportId), "تم الترحيل للمحاسب بنجاح ✅", "تعذّر الترحيل للمحاسب");
  };

  if (loading || !report) {
    return (
      <div className="p-6 text-center text-muted-foreground" dir="rtl">جاري التحميل...</div>
    );
  }

  const state = report.state || report.status || "draft";
  const expenseLines = report.expenses || report.expense_lines || report.lines || [];

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" /> تقارير المصروفات
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">{report.name}</span>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={handleApprove} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
            <CheckCircle className="w-4 h-4" /> اعتماد
          </button>
          <button onClick={() => setShowRefuse(true)} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50">
            <XCircle className="w-4 h-4" /> رفض
          </button>
          <button onClick={handlePost} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <FileCheck className="w-4 h-4" /> ترحيل للمحاسب
          </button>
          <button onClick={() => setShowPayment(true)} disabled={busy} className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
            <CreditCard className="w-4 h-4" /> تسجيل دفعة
          </button>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${REPORT_STATE_COLORS[state] || "bg-muted text-muted-foreground"}`}>
          {REPORT_STATE_LABELS[state] || state}
        </span>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <p className="text-sm text-muted-foreground mb-1">تقرير مصروفات</p>
        <h2 className="text-2xl font-bold text-foreground mb-6">{report.name}</h2>

        <div className="flex flex-wrap justify-between gap-6 mb-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground mb-1">الموظف</p>
            <p className="font-medium text-foreground">{report.employee_name || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">الإجمالي</p>
            <p className="font-bold text-primary">{fmt(report.total_amount)} ر.س</p>
          </div>
        </div>

        {expenseLines.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  {["الوصف", "التاريخ", "المبلغ"].map((h) => (
                    <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenseLines.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-medium text-foreground">{l.name}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.date}</td>
                    <td className="px-4 py-2.5 font-semibold">{fmt(l.total_amount)} ر.س</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showRefuse && (
        <RefuseReportModal report={report} onClose={() => setShowRefuse(false)}
          onDone={() => { setShowRefuse(false); load(); onChanged(); }} />
      )}
      {showPayment && (
        <RegisterPaymentModal report={report} onClose={() => setShowPayment(false)}
          onDone={() => { setShowPayment(false); load(); onChanged(); }} />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────
   الصفحة الرئيسية
   ──────────────────────────────────────────────────────────────────── */
export default function EmployeeExpenses() {
  const { toast } = useToast();
  const confirmDialog = useConfirm();

  const [activeTab, setActiveTab] = useState("expenses");
  const [expenses, setExpenses] = useState([]);
  const [reports, setReports] = useState([]);
  const [products, setProducts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [receiptExpense, setReceiptExpense] = useState(null);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [filterEmployee, setFilterEmployee] = useState(null);
  const [reportExpense, setReportExpense] = useState(null);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [expRes, repRes, prods, emps] = await Promise.all([
        getExpenses(),
        getExpenseReports(),
        getProducts("expense").catch(() => []),
        getEmployees().catch(() => ({ data: [] })),
      ]);
      setExpenses(expRes?.expenses || []);
      setReports(repRes?.reports || []);
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

  useEffect(() => { load(); }, []);

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

  const displayedExpenses = filterEmployee
    ? expenses.filter((e) => String(e.employee_id) === String(filterEmployee.id) || e.employee_name === filterEmployee.name)
    : expenses;

  const expensesPagination = usePagination(displayedExpenses, 20);
  const reportsPagination = usePagination(reports, 20);

  if (selectedReportId) {
    return (
      <ReportDetail
        reportId={selectedReportId}
        onBack={() => setSelectedReportId(null)}
        onChanged={load}
      />
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="w-6 h-6 text-primary" /> مصروفات الموظفين
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">تسجيل مصروفات الموظفين وتقديمها للاعتماد والسداد</p>
        </div>
        {activeTab === "expenses" && (
          <button onClick={() => setShowEmployeePicker(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
            <UserPlus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          { id: "expenses", label: `المصروفات (${expenses.length})` },
          { id: "reports", label: `تقارير المصروفات (${reports.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "expenses" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {filterEmployee && (
            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border">
              <span className="text-sm text-foreground">
                مصروفات: <span className="font-semibold">{filterEmployee.name}</span>
              </span>
              <button onClick={() => setFilterEmployee(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" /> عرض الكل
              </button>
            </div>
          )}
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
              ) : displayedExpenses.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد مصروفات بعد</td></tr>
              ) : expensesPagination.pageItems.map((exp) => (
                <tr key={exp.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{exp.name}</td>
                  <td className="px-4 py-3 text-xs">
                    {exp.employee_name ? (
                      <button onClick={() => setFilterEmployee({ id: exp.employee_id, name: exp.employee_name })}
                        className="text-primary hover:underline">
                        {exp.employee_name}
                      </button>
                    ) : "—"}
                  </td>
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
                      <button onClick={() => setReceiptExpense(exp)} title="رفع إيصال" className="p-1.5 hover:bg-muted rounded text-muted-foreground">
                        <Paperclip className="w-3.5 h-3.5" />
                      </button>
                      {!exp.sheet_id && (
                        <>
                          <button onClick={() => setReportExpense(exp)} title="تحويل لتقرير" className="p-1.5 hover:bg-primary/10 rounded text-primary">
                            <Send className="w-3.5 h-3.5" />
                          </button>
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
      )}

      {activeTab === "reports" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["اسم التقرير", "الموظف", "الإجمالي", "الحالة", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد تقارير مصروفات بعد</td></tr>
              ) : reportsPagination.pageItems.map((r) => {
                const state = r.state || r.status || "draft";
                return (
                  <tr key={r.id} onClick={() => setSelectedReportId(r.id)} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                    <td className="px-4 py-3 font-medium text-foreground">{r.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.employee_name || "—"}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(r.total_amount)} ر.س</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${REPORT_STATE_COLORS[state] || "bg-muted text-muted-foreground"}`}>
                        {REPORT_STATE_LABELS[state] || state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <TablePagination
            page={reportsPagination.page}
            totalPages={reportsPagination.totalPages}
            totalItems={reportsPagination.totalItems}
            pageSize={reportsPagination.pageSize}
            onPageChange={reportsPagination.setPage}
          />
        </div>
      )}

      {showExpenseForm && (
        <ExpenseForm expense={editExpense} products={products} employees={employees} showEmployeeField
          onSave={() => { closeForm(); load(); }} onClose={closeForm} />
      )}
      {receiptExpense && (
        <AttachReceiptModal expense={receiptExpense} onClose={() => setReceiptExpense(null)}
          onDone={() => { setReceiptExpense(null); load(); }} />
      )}
      {reportExpense && (
        <SubmitReportModal selectedExpenses={[reportExpense]}
          onClose={() => setReportExpense(null)}
          onDone={() => { setReportExpense(null); load(); }} />
      )}
      {showEmployeePicker && (
        <NewEmployeeReportModal employees={employees} expenses={expenses}
          onClose={() => setShowEmployeePicker(false)}
          onDone={() => { setShowEmployeePicker(false); load(); }} />
      )}
    </div>
  );
}
