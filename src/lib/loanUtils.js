// import { base44 } from "@/api/base44Client";

// /**
//  * توليد جدول السداد تلقائياً
//  */
// export function generateRepaymentSchedule(loanId, employeeId, employeeName, amount, installments, startMonth) {
//   const schedule = [];
//   const installmentAmount = Math.ceil(amount / installments);
//   const [year, month] = startMonth.split("-").map(Number);

//   for (let i = 0; i < installments; i++) {
//     const d = new Date(year, month - 1 + i, 1);
//     const dueMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
//     // آخر قسط يأخذ الباقي لتجنب فروق التقريب
//     const isLast = i === installments - 1;
//     const paid = installmentAmount * i;
//     const lastAmount = amount - paid;
//     schedule.push({
//       loan_id: loanId,
//       employee_id: employeeId,
//       employee_name: employeeName,
//       installment_number: i + 1,
//       due_month: dueMonth,
//       amount: isLast ? lastAmount : installmentAmount,
//       status: "مجدول",
//     });
//   }
//   return schedule;
// }

// /**
//  * حفظ سجل Audit Log
//  */
// export async function logLoanAction({ loan_application_id, loan_id, employee_name, action, performed_by, performed_by_role, old_value, new_value, notes }) {
//   await base44.entities.LoanAuditLog.create({
//     loan_application_id, loan_id, employee_name,
//     action, performed_by, performed_by_role,
//     old_value, new_value, notes,
//   });
// }

// /**
//  * حساب الشهر القادم من اليوم
//  */
// export function nextMonth() {
//   const d = new Date();
//   d.setMonth(d.getMonth() + 1);
//   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
// }

// export function formatMonth(m) {
//   if (!m) return "—";
//   const [y, mo] = m.split("-");
//   return new Date(+y, +mo - 1, 1).toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
// }

// export const WORKFLOW_STATUS_COLORS = {
//   "قيد المراجعة": "bg-amber-100 text-amber-700",
//   "انتظار موافقة المدير": "bg-purple-100 text-purple-700",
//   "انتظار موافقة HR": "bg-blue-100 text-blue-700",
//   "انتظار موافقة المالية": "bg-orange-100 text-orange-700",
//   "معتمدة": "bg-teal-100 text-teal-700",
//   "مصروفة": "bg-green-100 text-green-700",
//   "مكتملة": "bg-emerald-100 text-emerald-700",
//   "مرفوضة": "bg-red-100 text-red-600",
//   "ملغاة": "bg-gray-100 text-gray-500",
// };

// export const WORKFLOW_STEPS = [
//   { key: "قيد المراجعة", label: "مقدَّم" },
//   { key: "انتظار موافقة المدير", label: "المدير" },
//   { key: "انتظار موافقة HR", label: "HR" },
//   { key: "انتظار موافقة المالية", label: "المالية" },
//   { key: "معتمدة", label: "معتمد" },
//   { key: "مصروفة", label: "مصروف" },
// ];

import api from "../api/axios";

/**
 * توليد جدول السداد تلقائياً
 */
export function generateRepaymentSchedule(loanId, employeeId, employeeName, amount, installments, startMonth) {
  const schedule = [];
  const installmentAmount = Math.ceil(amount / installments);
  const [year, month] = startMonth.split("-").map(Number);

  for (let i = 0; i < installments; i++) {
    const d = new Date(year, month - 1 + i, 1);
    const dueMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    // آخر قسط يأخذ الباقي لتجنب فروق التقريب
    const isLast = i === installments - 1;
    const paid = installmentAmount * i;
    const lastAmount = amount - paid;
    schedule.push({
      loan_id: loanId,
      employee_id: employeeId,
      employee_name: employeeName,
      installment_number: i + 1,
      due_month: dueMonth,
      amount: isLast ? lastAmount : installmentAmount,
      status: "مجدول",
    });
  }
  return schedule;
}

/**
 * حفظ سجل Audit Log
 * TODO: تأكد إن المسار "/loan-audit-logs" مطابق للـ endpoint الحقيقي في Odoo عندكم
 */
export async function logLoanAction({ loan_application_id, loan_id, employee_name, action, performed_by, performed_by_role, old_value, new_value, notes }) {
  await api.post("/loan-audit-logs", {
    loan_application_id, loan_id, employee_name,
    action, performed_by, performed_by_role,
    old_value, new_value, notes,
  });
}

/**
 * حساب الشهر القادم من اليوم
 */
export function nextMonth() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(m) {
  if (!m) return "—";
  const [y, mo] = m.split("-");
  return new Date(+y, +mo - 1, 1).toLocaleDateString("ar-SA", { year: "numeric", month: "long" });
}

export const WORKFLOW_STATUS_COLORS = {
  "قيد المراجعة": "bg-amber-100 text-amber-700",
  "انتظار موافقة المدير": "bg-purple-100 text-purple-700",
  "انتظار موافقة HR": "bg-blue-100 text-blue-700",
  "انتظار موافقة المالية": "bg-orange-100 text-orange-700",
  "معتمدة": "bg-teal-100 text-teal-700",
  "مصروفة": "bg-green-100 text-green-700",
  "مكتملة": "bg-emerald-100 text-emerald-700",
  "مرفوضة": "bg-red-100 text-red-600",
  "ملغاة": "bg-gray-100 text-gray-500",
};

export const WORKFLOW_STEPS = [
  { key: "قيد المراجعة", label: "مقدَّم" },
  { key: "انتظار موافقة المدير", label: "المدير" },
  { key: "انتظار موافقة HR", label: "HR" },
  { key: "انتظار موافقة المالية", label: "المالية" },
  { key: "معتمدة", label: "معتمد" },
  { key: "مصروفة", label: "مصروف" },
];