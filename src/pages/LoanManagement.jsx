import { useState, useEffect } from "react";
import { CreditCard, Settings, Plus, Search, Eye, XCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/lib/useRole";
import { formatCurrency } from "@/lib/hrUtils";
import { generateRepaymentSchedule, nextMonth, logLoanAction } from "@/lib/loanUtils";
import LoanTypeManager from "@/components/loans/LoanTypeManager";
import LoanApplicationModal from "@/components/loans/LoanApplicationModal";
import LoanDetailModal from "@/components/loans/LoanDetailModal";
import LoanWorkflowBadge from "@/components/loans/LoanWorkflowBadge";
import MonthlyInstallmentsView from "@/components/loans/MonthlyInstallmentsView";
import { updateSalaryAdvance ,getAllInstallments } from "@/api/salaryAdvancesApi";
import { useConfirm } from "@/components/ui/confirm-dialog";

import {
  getActiveSalaryAdvances ,
  getSalaryAdvances,  getSalaryAdvanceById,
  getSalaryAdvanceInstallments,
} from "@/api/salaryAdvancesApi";
import {
  getSalaryAdvanceTypes,
} from "@/api/salaryAdvanceTypesApi";

import {
  getEmployees,
} from "@/api/departmentsApi";

// ─── Employee View ───────────────────────────────────────────────────
function EmployeeView({ employee, loans, applications }) {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedRepayments, setSelectedRepayments] = useState([]);

  const myApps = applications.filter(a => a.employee_id === employee?.id);
  const myLoans = loans.filter(l => l.employee_id === employee?.id);
  const activeLoans = myLoans.filter(l => l.status === "نشطة");
  const totalRemaining = activeLoans.reduce((s, l) => s + (l.remaining_amount || 0), 0);

  const openDetail = async (loan) => {
    const reps = await base44.entities.LoanRepayment.filter({ loan_id: loan.id });
    setSelectedRepayments(reps.sort((a, b) => a.installment_number - b.installment_number));
    setSelectedLoan(loan);
  };

  if (!employee) return (
    <div className="text-center py-16 text-muted-foreground">
      <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20" />
      <p className="text-sm">لم يتم ربط حسابك بسجل موظف</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* My Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "طلباتي", value: myApps.length, color: "text-amber-600" },
          { label: "سلف نشطة", value: activeLoans.length, color: "text-teal-600" },
          { label: "إجمالي المتبقي", value: formatCurrency(totalRemaining), color: "text-red-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Active Loans */}
      {activeLoans.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">سلفي النشطة</h3>
          <div className="space-y-3">
            {activeLoans.map(l => {
              const progress = l.amount > 0 ? Math.round(((l.paid_amount || 0) / l.amount) * 100) : 0;
              return (
                <div key={l.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-foreground">{formatCurrency(l.amount)}</p>
                      <p className="text-xs text-muted-foreground">{l.reason}</p>
                    </div>
                    <button onClick={() => openDetail(l)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20">
                      <Eye className="w-3.5 h-3.5" />جدول السداد
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs mb-3">
                    <div><p className="font-bold text-green-600">{formatCurrency(l.paid_amount)}</p><p className="text-muted-foreground">مسدَّد</p></div>
                    <div><p className="font-bold text-red-600">{formatCurrency(l.remaining_amount)}</p><p className="text-muted-foreground">متبقي</p></div>
                    <div><p className="font-bold text-amber-600">{formatCurrency(l.monthly_deduction)}</p><p className="text-muted-foreground">قسط/شهر</p></div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">{progress}% مكتمل</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Applications */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">طلباتي</h3>
        {myApps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-card rounded-xl border border-border">
            <p className="text-sm">لا توجد طلبات سلفة</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["المبلغ", "الأقساط", "السبب", "الحالة", "تاريخ الطلب"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {myApps.map(a => (
                  <tr key={a.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-bold text-foreground">{formatCurrency(a.amount)}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{a.installments}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-32 truncate">{a.reason}</td>
                    <td className="px-4 py-3"><LoanWorkflowBadge status={a.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.created_date ? new Date(a.created_date).toLocaleDateString("ar-SA") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLoan && (
        <LoanDetailModal loan={selectedLoan} repayments={selectedRepayments}
          onClose={() => setSelectedLoan(null)} onUpdate={() => {}} />
      )}
    </div>
  );
}

// ─── Manager View ────────────────────────────────────────────────────
function ManagerView({ applications, employees, user, role, onAction }) {
  // Manager sees only their department's pending applications
  const pending = applications.filter(a =>
    a.status === "انتظار موافقة المدير" ||
    (a.status === "قيد المراجعة")
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
        تظهر هنا طلبات السلفة التي تحتاج موافقتك قبل إحالتها لـ HR.
      </div>
      {pending.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">لا توجد طلبات تنتظر موافقتك</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["الموظف", "المبلغ", "الأقساط", "السبب", "الحالة", "إجراء"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {pending.map(app => (
                <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{app.employee_name}</p>
                    <p className="text-xs text-muted-foreground">{app.department}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">{formatCurrency(app.amount)}</td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{app.installments}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-32 truncate">{app.reason}</td>
                  <td className="px-4 py-3"><LoanWorkflowBadge status={app.status} /></td>
                  <td className="px-4 py-3">
                    {app.status === "انتظار موافقة المدير" && (
                      <div className="flex gap-1">
                        <button onClick={() => onAction(app, "انتظار موافقة HR", "manager_approved_by")}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium">✓ موافقة</button>
                        <button onClick={() => onAction(app, "reject")}
                          className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 font-medium">رفض</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Finance View ────────────────────────────────────────────────────
function FinanceView({ applications, loans, onAction, onDisbUrse }) {
  const approved = applications.filter(a => a.status === "معتمدة");
  const waitingFinance = applications.filter(a => a.status === "انتظار موافقة المالية");
  const disbursed = applications.filter(a => a.status === "مصروفة");
  const activeLoans = loans.filter(l => l.status === "نشطة");
  const totalRemaining = activeLoans.reduce((s, l) => s + (l.remaining_amount || 0), 0);
  const totalMonthly = activeLoans.reduce((s, l) => s + (l.monthly_deduction || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "تنتظر موافقة المالية", value: waitingFinance.length, color: "text-orange-600" },
          { label: "جاهزة للصرف", value: approved.length, color: "text-teal-600" },
          { label: "إجمالي الالتزامات", value: formatCurrency(totalRemaining), color: "text-red-600" },
          { label: "خصومات/شهر", value: formatCurrency(totalMonthly), color: "text-amber-600" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Finance Approval */}
      {waitingFinance.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">تنتظر موافقة المالية</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["الموظف", "المبلغ", "الأقساط", "القسط/شهر", "إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {waitingFinance.map(app => (
                  <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3"><p className="font-medium">{app.employee_name}</p><p className="text-xs text-muted-foreground">{app.department}</p></td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(app.amount)}</td>
                    <td className="px-4 py-3 text-center">{app.installments}</td>
                    <td className="px-4 py-3 text-amber-600">{formatCurrency(app.monthly_deduction)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => onAction(app, "معتمدة", "finance_approved_by")}
                          className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 font-medium">✓ موافقة مالية</button>
                        <button onClick={() => onAction(app, "reject")}
                          className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 font-medium">رفض</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ready to Disburse */}
      {approved.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">جاهزة للصرف</h3>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/30 border-b border-border">
                {["الموظف", "المبلغ", "القسط/شهر", "إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {approved.map(app => (
                  <tr key={app.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3"><p className="font-medium">{app.employee_name}</p></td>
                    <td className="px-4 py-3 font-bold text-teal-600">{formatCurrency(app.amount)}</td>
                    <td className="px-4 py-3 text-amber-600">{formatCurrency(app.monthly_deduction)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => onDisbUrse(app)}
                        className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium">💸 صرف الآن</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Active Loans Summary */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-2">الالتزامات الشهرية النشطة ({activeLoans.length})</h3>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["الموظف", "المبلغ الكلي", "المسدَّد", "المتبقي", "قسط/شهر"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {activeLoans.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد سلف نشطة</td></tr>
              ) : activeLoans.map(l => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3"><p className="font-medium">{l.employee_name}</p><p className="text-xs text-muted-foreground">{l.department}</p></td>
                  <td className="px-4 py-3 font-bold">{formatCurrency(l.amount)}</td>
                  <td className="px-4 py-3 text-green-600">{formatCurrency(l.paid_amount)}</td>
                  <td className="px-4 py-3 text-red-600 font-semibold">{formatCurrency(l.remaining_amount)}</td>
                  <td className="px-4 py-3 text-amber-600">{formatCurrency(l.monthly_deduction)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── HR / Admin View (Full) ──────────────────────────────────────────
function FullView({ applications, loans, employees, user, role, onAction, onDisbUrse, onReject, onOpenLoanDetail, search, setSearch, filterStatus, setFilterStatus, showNewApp, setShowNewApp, showTypeManager, setShowTypeManager, isAdmin, load }) {
  const confirmDialog = useConfirm();
  const filteredApps = applications
    .filter(a => !filterStatus || a.status === filterStatus)
    .filter(a => !search || a.employee_name?.includes(search) || a.loan_type_name?.includes(search));
  const activeLoans = loans.filter(l => l.status === "نشطة");

  const [activeTab, setActiveTab] = useState("applications");

  const COLOR_MAP = {
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    orange: "bg-orange-100 text-orange-700 hover:bg-orange-200",
    green: "bg-green-100 text-green-700 hover:bg-green-200",
    red: "bg-red-100 text-red-600 hover:bg-red-200"
  };

// const getActions = (app) => {
//   const actions = [];

//   const type = app.loan_type || {};
//   const isHR = role === "admin" || role === "hr";
//   const isManager = ["admin", "hr", "dept_manager", "general_manager", "ceo"].includes(role);
//   const isFinance = role === "admin" || role === "accountant";

//   // 1) قيد المراجعة
//   if (app.status === "قيد المراجعة") {

//     // 👇 مدير لو النوع يسمح
//     if (type.direct_manager_approval) {
//       actions.push({
//         label: "موافقة المدير",
//         color: "purple",
//         fn: () => onAction(app, "انتظار موافقة HR", "manager_approved_by")
//       });
//     }

//     // 👇 HR لو النوع يسمح
//     if (type.hr_approval) {
//       actions.push({
//         label: "موافقة HR",
//         color: "blue",
//         fn: () => onAction(app, "انتظار موافقة المالية", "hr_approved_by")
//       });
//     }
//   }

//   // 2) انتظار المدير
//   if (app.status === "انتظار موافقة المدير") {
//     if (type.direct_manager_approval && isManager) {
//       actions.push({
//         label: "✓ موافقة المدير",
//         color: "purple",
//         fn: () => onAction(app, "انتظار موافقة HR", "manager_approved_by")
//       });
//     }
//   }

//   // 3) انتظار HR
//   if (app.status === "انتظار موافقة HR") {
//     if (type.hr_approval && isHR) {
//       actions.push({
//         label: "✓ موافقة HR",
//         color: "blue",
//         fn: () => onAction(app, "انتظار موافقة المالية", "hr_approved_by")
//       });
//     }
//   }

//   // 4) المالية
//   if (app.status === "انتظار موافقة المالية") {
//     if (type.finance_approval && isFinance) {
//       actions.push({
//         label: "✓ موافقة المالية",
//         color: "orange",
//         fn: () => onAction(app, "معتمدة", "finance_approved_by")
//       });
//     }
//   }

//   // 5) الصرف
//   if (app.status === "معتمدة") {
//     if (isFinance || role === "admin") {
//       actions.push({
//         label: "💸 صرف",
//         color: "green",
//         fn: () => onDisbUrse(app)
//       });
//     }
//   }

//   // 6) رفض (يبقى عام)
//   if (!["مرفوضة", "ملغاة", "مصروفة"].includes(app.status)) {
//     if (isHR || role === "admin") {
//       actions.push({
//         label: "رفض",
//         color: "red",
//         fn: () => onReject(app)
//       });
//     }
//   }

//   return actions;
// };

const getActions = (app) => {
  const actions = [];

  const type = app.loan_type || {};

  const isHR = role === "admin" || role === "hr";
  const isManager = ["admin", "hr", "dept_manager", "general_manager", "ceo"].includes(role);
  const isFinance = role === "admin" || role === "accountant";

  // =========================
  // 1) Draft → Submit
  // =========================
if (app.apiState === "draft") {

    actions.push({
      label: "إحالة للمدير",
      color: "purple",
      fn: async () => {
        const ok = await confirmDialog({
          title: "إحالة الطلب للمدير",
          message: "هل أنت متأكد من إحالة طلب السلفة للمدير المباشر للموافقة؟",
          confirmText: "إحالة",
        });
        if (!ok) return;
        await updateSalaryAdvance(app.id, "submit_to_manager");
        load();
      }
    });

    actions.push({
      label: "إرسال مباشر HR",
      color: "blue",
      fn: async () => {
        const ok = await confirmDialog({
          title: "إرسال مباشر لـ HR",
          message: "هل أنت متأكد من إرسال الطلب مباشرة لموافقة HR (تخطي المدير)؟",
          confirmText: "إرسال",
        });
        if (!ok) return;
        await updateSalaryAdvance(app.id, "direct_hr");
        load();
      }
    });
}

  // =========================
  // 2) Manager approval
  // =========================
  if (app.apiState === "waiting_manager") {

    if (type.direct_manager_approval && isManager) {

      actions.push({
        label: "✓ موافقة المدير",
        color: "purple",
        fn: async () => {
          const ok = await confirmDialog({
            title: "موافقة المدير",
            message: "هل أنت متأكد من الموافقة على طلب السلفة؟",
            confirmText: "موافقة",
          });
          if (!ok) return;
          await updateSalaryAdvance(app.id, "manager_approve");
          load();
        }
      });
    }
  }

  // =========================
  // 3) HR approval
  // =========================
  if (app.apiState === "waiting_hr") {

    if (type.hr_approval && isHR) {

      actions.push({
        label: "✓ موافقة HR",
        color: "blue",
        fn: async () => {
          const ok = await confirmDialog({
            title: "موافقة HR",
            message: "هل أنت متأكد من الموافقة على طلب السلفة؟",
            confirmText: "موافقة",
          });
          if (!ok) return;
          await updateSalaryAdvance(app.id, "hr_approve");
          load();
        }
      });
    }
  }

  // =========================
  // 4) Finance approval
  // =========================
  if (app.apiState === "waiting_financial") {

    if (type.finance_approval && isFinance) {

      actions.push({
        label: "✓ موافقة المالية",
        color: "orange",
        fn: async () => {
          const ok = await confirmDialog({
            title: "موافقة المالية",
            message: "هل أنت متأكد من الموافقة على طلب السلفة؟",
            confirmText: "موافقة",
          });
          if (!ok) return;
          await updateSalaryAdvance(app.id, "financial_approve");
          load();
        }
      });
    }
  }

  // =========================
  // 5) Pay
  // =========================
  if (app.apiState === "approved") {

    if (isFinance || role === "admin") {

      actions.push({
        label: "💸 صرف",
        color: "green",
        fn: async () => {
          const ok = await confirmDialog({
            title: "صرف السلفة",
            message: "هل أنت متأكد من صرف هذه السلفة؟ لا يمكن التراجع عن هذا الإجراء.",
            confirmText: "صرف",
            variant: "destructive",
          });
          if (!ok) return;
          await updateSalaryAdvance(app.id, "pay");
          load();
        }
      });
    }
  }

  // =========================
  // 6) Reject (في كل الحالات غير النهائية)
  // =========================
  if (!["rejected", "certified"].includes(app.apiState)) {

    actions.push({
      label: "رفض",
      color: "red",
      fn: () => onReject(app) // modal فقط
    });
  }

  return actions;
};
  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "applications", label: `الطلبات (${applications.length})` },
          { id: "active", label: `السلف النشطة (${activeLoans.length})` },
          { id: "installments", label: "الأقساط" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو نوع السلفة..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        {activeTab === "applications" && (
          <div className="flex flex-wrap gap-1">
            {[["", "الكل"], ["قيد المراجعة", "جديدة"], ["انتظار موافقة المدير", "المدير"], ["انتظار موافقة HR", "HR"], ["انتظار موافقة المالية", "المالية"], ["معتمدة", "معتمدة"], ["مصروفة", "مصروفة"], ["مكتملة", "مكتملة"], ["مرفوضة", "مرفوضة"]].map(([val, label]) => (
              <button key={val} onClick={() => setFilterStatus(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === val ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-muted"}`}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === "applications" && (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["الموظف", "نوع السلفة", "المبلغ", "الأقساط", "القسط/شهر", "الحالة", "تاريخ الطلب", "الإجراءات"].map(h => (
                <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد طلبات</td></tr>
              ) : filteredApps.map(app => {
                
                const actions = getActions(app);
                return (
                  <tr key={app.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-3"><p className="font-medium text-foreground">{app.employee_name}</p><p className="text-xs text-muted-foreground">{app.department}</p></td>
                    <td className="px-3 py-3"><span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{app.loan_type_name || "عام"}</span></td>
                    <td className="px-3 py-3 font-bold text-foreground">{formatCurrency(app.amount)}</td>
                    <td className="px-3 py-3 text-center text-muted-foreground">{app.installments}</td>
                    <td className="px-3 py-3 text-amber-600 font-medium">{formatCurrency(app.monthly_deduction)}</td>
                    <td className="px-3 py-3"><LoanWorkflowBadge status={app.status} /></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{app.created_date ? new Date(app.created_date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {actions.map((a, i) => (
                          <button key={i} onClick={a.fn}
                            className={`text-xs px-2 py-1 rounded font-medium ${COLOR_MAP[a.color]}`}>{a.label}</button>
                        ))}
                        {app.rejection_reason && (
                          <span className="text-xs text-red-500 truncate max-w-24" title={app.rejection_reason}>{app.rejection_reason}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "installments" && (
        <MonthlyInstallmentsView loans={loans}  />
      )}

      {activeTab === "active" && (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["الموظف", "المبلغ الكلي", "المسدَّد", "المتبقي", "القسط/شهر", "تاريخ الصرف", "الحالة", "متابعة"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {activeLoans.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">لا توجد سلف نشطة</td></tr>
              ) : activeLoans.map(l => {
                const progress = l.amount > 0 ? Math.round(((l.paid_amount || 0) / l.amount) * 100) : 0;
                return (
                  <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3"><p className="font-medium text-foreground">{l.employee_name}</p><p className="text-xs text-muted-foreground">{l.department}</p></td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(l.amount)}</td>
                    <td className="px-4 py-3 text-green-600">{formatCurrency(l.paid_amount)}</td>
                    <td className="px-4 py-3">
                      <p className="text-red-600 font-semibold">{formatCurrency(l.remaining_amount)}</p>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-amber-600">{formatCurrency(l.monthly_deduction)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.issue_date ? new Date(l.issue_date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">{l.status}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => onOpenLoanDetail(l)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs hover:bg-primary/20">
                        <Eye className="w-3.5 h-3.5" />جدول السداد
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export default function LoanManagement() {
  const confirmDialog = useConfirm();
  const { user, role } = useRole();
  const isAdmin = role === "admin";
  const isHR = role === "admin" || role === "hr";
  const isManager = ["admin", "hr", "dept_manager", "general_manager", "ceo"].includes(role);
  const isFinance = role === "admin" || role === "accountant";
  const isEmployee = role === "employee" || role === "user";

  const [applications, setApplications] = useState([]);
  const [loans, setLoans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [myEmployee, setMyEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [showNewApp, setShowNewApp] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedLoanRepayments, setSelectedLoanRepayments] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
const [installments, setInstallments] = useState([]);

const mapStatus = (state) => {
  switch (state) {
    case "draft":
      return "قيد المراجعة";

    case "waiting_manager":
      return "انتظار موافقة المدير";

    case "waiting_hr":
      return "انتظار موافقة HR";

    case "waiting_financial":
      return "انتظار موافقة المالية";

    case "approved":
      return "معتمدة";

    case "certified":
      return "مصروفة";

    case "completed":
      return "مكتملة";

    case "rejected":
      return "مرفوضة";

    default:
      return state;
  }
};

const load = async () => {
  try {
    setLoading(true);

    const [advancesRes, empsRes, typesRes, activeRes, installmentsRes] =
      await Promise.all([
        getSalaryAdvances(),
        getEmployees(),
        getSalaryAdvanceTypes(),
        getActiveSalaryAdvances(),
        getAllInstallments(),
      ]);

    const types = typesRes.data || [];

    const applications = (advancesRes.data || []).map(item => {
      const type = types.find(t => t.id === item.advance_type_id);

      return {
        ...item,
        loan_type: type || null,
        status: mapStatus(item.state),
        apiState: item.state,
        installments: item.installments_count,
        monthly_deduction: item.installment_amount,
        loan_type_name: item.advance_type_name,
        created_date: item.start_date,
        employee_name: item.employee_name,
      };
    });

    setApplications(applications);

    const loans = (activeRes.data || []).map(l => ({
      id: l.id,
      employee_name: l.employee_name,
      amount: l.advance_amount,
      paid_amount: l.paid_amount,
      remaining_amount: l.amount_left,
      status: "نشطة",
      monthly_deduction: l.installment_amount,
      issue_date: l.date_of_advance,
      apiState: l.state,
    }));

    setLoans(loans);

    const installments = installmentsRes.data || [];

   const loansMap = Object.fromEntries(
  loans.map(l => [l.id, l])
);

const installmentsView = installments.map(ins => ({
  ...ins,
  employee_name: loansMap[ins.loan_id]?.employee_name || "",
  loan_amount: loansMap[ins.loan_id]?.amount || 0,
}));
    setInstallments(installmentsView);

    const employees = empsRes.data || [];
    setEmployees(employees);

    if (user) {
      const emp = employees.find(
        e => e.email?.toLowerCase() === user.email?.toLowerCase()
      );
      setMyEmployee(emp || null);
    }

  } finally {
    setLoading(false);
  }
};
  useEffect(() => { if (user !== null) load(); }, [user]);

 const openLoanDetail = async (loan) => {
  try {
    // 1. جيبي التفاصيل الكاملة (GET ONE)
    const detailsRes = await getSalaryAdvanceById(loan.id);
    const details = detailsRes.data;

    // 2. جيبي جدول السداد
    const installmentsRes = await getSalaryAdvanceInstallments(loan.id);
    const installments = installmentsRes.data || [];

    // 3. رتّبي الأقساط
    const sorted = installments.sort(
      (a, b) => a.installment_number - b.installment_number
    );

    setSelectedLoan(details);
    setSelectedLoanRepayments(sorted);

  } catch (error) {
    console.error("Loan detail error:", error);
  }
};

  const advanceWorkflow = async (app, newStatus, approvalField) => {
    const update = { status: newStatus };
    if (approvalField) {
      update[approvalField] = user?.full_name || user?.email;
      update[`${approvalField}_at`.replace("_by_at", "_at")] = new Date().toISOString().slice(0, 10);
    }
    await base44.entities.LoanApplication.update(app.id, update);
    await logLoanAction({
      loan_application_id: app.id, employee_name: app.employee_name,
      action: approvalField?.includes("manager") ? "موافقة مدير" : approvalField?.includes("hr") ? "موافقة HR" : approvalField?.includes("finance") ? "موافقة مالية" : "تحديث حالة",
      performed_by: user?.full_name || user?.email,
      performed_by_role: role, new_value: newStatus,
    });
    load();
  };

  const disburseLoan = async (app) => {
    const ok = await confirmDialog({
      title: "صرف السلفة",
      message: "هل أنت متأكد من صرف هذه السلفة؟ لا يمكن التراجع عن هذا الإجراء.",
      confirmText: "صرف",
      variant: "destructive",
    });
    if (!ok) return;
    const disbursedAt = new Date().toISOString().slice(0, 10);
    const startMonth = nextMonth();
    const installmentAmount = Math.ceil(app.amount / app.installments);
    const newLoan = await base44.entities.Loan.create({
      employee_id: app.employee_id, employee_name: app.employee_name,
      department: app.department || "", amount: app.amount,
      reason: app.reason, installments: app.installments,
      monthly_deduction: installmentAmount, paid_amount: 0,
      remaining_amount: app.amount, issue_date: disbursedAt,
      status: "نشطة", request_id: app.id,
    });
    await base44.entities.LoanApplication.update(app.id, {
      status: "مصروفة", disbursed_by: user?.full_name || user?.email,
      disbursed_at: disbursedAt, loan_id: newLoan.id, start_deduction_month: startMonth,
    });
    const schedule = generateRepaymentSchedule(newLoan.id, app.employee_id, app.employee_name, app.amount, app.installments, startMonth);
    await base44.entities.LoanRepayment.bulkCreate(schedule);
    await logLoanAction({
      loan_application_id: app.id, loan_id: newLoan.id,
      employee_name: app.employee_name, action: "صرف",
      performed_by: user?.full_name || user?.email, performed_by_role: role,
      new_value: `${app.amount} ر.س | بدء الخصم: ${startMonth}`,
    });
    load();
  };

 const rejectApplication = async () => {
  if (!rejectModal?.id) return;

  try {
    await updateSalaryAdvance(
      rejectModal.id,
      "reject",
      rejectReason
    );

    setRejectModal(null);
    setRejectReason("");
    load();

  } catch (err) {
    console.error("Reject error:", err);
  }
};

  const handleAction = async (app, newStatus, approvalField) => {
    if (newStatus === "reject") { setRejectModal({ id: app.id, employee_name: app.employee_name }); return; }
    const ok = await confirmDialog({
      title: "الموافقة على الطلب",
      message: "هل أنت متأكد من الموافقة على طلب السلفة؟",
      confirmText: "موافقة",
    });
    if (!ok) return;
    advanceWorkflow(app, newStatus, approvalField);
  };

  // Stats for header
  const activeLoans = loans.filter(l => l.status === "نشطة");
  const pendingCount = applications.filter(a => !["مرفوضة", "ملغاة", "مصروفة"].includes(a.status)).length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-600" />إدارة السلف والقروض
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEmployee ? "سلفي وطلباتي" : isFinance && !isHR ? "الصرف ومتابعة الالتزامات المالية" : isManager && !isHR ? "طلبات الموافقة" : "إدارة شاملة للسلف والقروض"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => setShowTypeManager(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted text-sm text-foreground">
              <Settings className="w-4 h-4" />أنواع السلف
            </button>
          )}
          {(isHR || isAdmin) && (
            <button onClick={() => setShowNewApp(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />طلب سلفة جديد
            </button>
          )}
        </div>
      </div>

      {/* Stats — shown for non-employee roles */}
      {!isEmployee && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "طلبات قيد المراجعة", value: pendingCount, color: "text-amber-600" },
            { label: "سلف نشطة", value: activeLoans.length, color: "text-teal-600" },
            { label: "إجمالي المتبقي", value: formatCurrency(activeLoans.reduce((s, l) => s + (l.remaining_amount || 0), 0)), color: "text-red-600" },
            { label: "مسددة بالكامل", value: loans.filter(l => l.status === "مسددة بالكامل").length, color: "text-green-600" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Role-based View */}
      {isEmployee && (
        <EmployeeView employee={myEmployee} loans={loans} applications={applications} />
      )}

      {isManager && !isHR && !isFinance && (
        <ManagerView applications={applications} employees={employees} user={user} role={role} onAction={handleAction} />
      )}

      {isFinance && !isHR && (
        <FinanceView applications={applications} loans={loans} onAction={handleAction} onDisbUrse={disburseLoan} />
      )}

      {(isHR || isAdmin) && (
        <FullView
          applications={applications} loans={loans} employees={employees}
          user={user} role={role} isAdmin={isAdmin}
          onAction={handleAction} onDisbUrse={disburseLoan}
          onReject={(app) => setRejectModal({ id: app.id, employee_name: app.employee_name })}
          onOpenLoanDetail={openLoanDetail}
          search={search} setSearch={setSearch}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          showNewApp={showNewApp} setShowNewApp={setShowNewApp}
          showTypeManager={showTypeManager} setShowTypeManager={setShowTypeManager}
          load={load}
        />
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" dir="rtl">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />رفض الطلب
            </h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">سبب الرفض *</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none resize-none" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setRejectModal(null); setRejectReason(""); }}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
              <button onClick={rejectApplication} disabled={!rejectReason}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg disabled:opacity-50">تأكيد الرفض</button>
            </div>
          </div>
        </div>
      )}

      {showTypeManager && <LoanTypeManager onClose={() => { setShowTypeManager(false); load(); }} />}
      {showNewApp && <LoanApplicationModal employees={employees} onSave={() => { setShowNewApp(false); load(); }} onClose={() => setShowNewApp(false)} />}
      {selectedLoan && (
        <LoanDetailModal loan={selectedLoan} repayments={selectedLoanRepayments}
          onClose={() => setSelectedLoan(null)} onUpdate={load} />
      )}
    </div>
  );
}