import { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, FileWarning, CalendarDays, CheckCircle, UserX, CreditCard, Gift, MinusCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { getExpiryStatus } from "../lib/hrUtils";

async function buildNotifications(role, userEmail) {
  const notifs = [];
  const isHR = role === "admin" || role === "hr";
  const isManager = ["admin", "hr", "dept_manager", "general_manager", "ceo"].includes(role);
  const isFinance = role === "admin" || role === "accountant";
  const isIT = role === "admin" || role === "it";
  const isEmployee = role === "employee" || role === "user";

  // ─── HR & Admin: وثائق منتهية + إجازات معلقة ───────────────────────
  if (isHR) {
    const [emps, leaves, terminations, loanApps, bonuses, deductions] = await Promise.all([
      base44.entities.Employee.list(),
      base44.entities.LeaveRequest.filter({ status: "قيد الانتظار" }),
      base44.entities.TerminationRequest.list(),
      base44.entities.LoanApplication.list(),
      base44.entities.Bonus.filter({ status: "قيد الاعتماد" }),
      base44.entities.Deduction.filter({ status: "قيد الاعتماد" }),
    ]);

    emps.forEach(emp => {
      const idStatus = getExpiryStatus(emp.id_expiry);
      if (idStatus && idStatus.days <= 90) {
        notifs.push({ id: `id_${emp.id}`, type: idStatus.days <= 30 ? "danger" : "warning", icon: FileWarning, title: emp.is_saudi ? "هوية وطنية تستحق التجديد" : "إقامة تستحق التجديد", message: `${emp.full_name_ar} — ${idStatus.label}` });
      }
      const passStatus = getExpiryStatus(emp.passport_expiry);
      if (passStatus && passStatus.days <= 90) {
        notifs.push({ id: `pass_${emp.id}`, type: passStatus.days <= 30 ? "danger" : "warning", icon: FileWarning, title: "جواز سفر يستحق التجديد", message: `${emp.full_name_ar} — ${passStatus.label}` });
      }
      if (emp.contract_type === "محدد المدة" && emp.contract_end_date) {
        const cStatus = getExpiryStatus(emp.contract_end_date);
        if (cStatus && cStatus.days <= 60) {
          notifs.push({ id: `contract_${emp.id}`, type: cStatus.days <= 30 ? "danger" : "warning", icon: AlertTriangle, title: "عقد عمل يقترب من الانتهاء", message: `${emp.full_name_ar} — ${cStatus.label}` });
        }
      }
    });

    if (leaves.length > 0) notifs.push({ id: "pending_leaves", type: "info", icon: CalendarDays, title: "طلبات إجازة بانتظار الموافقة", message: `${leaves.length} طلب في قائمة الانتظار` });

    const pendingTerminations = terminations.filter(t => ["Pending HR Review", "Final Approval"].includes(t.status));
    if (pendingTerminations.length > 0) notifs.push({ id: "terminations_hr", type: "warning", icon: UserX, title: "طلبات إنهاء خدمة تنتظر HR", message: `${pendingTerminations.length} طلب يحتاج مراجعتك` });

    const pendingLoans = loanApps.filter(a => a.status === "انتظار موافقة HR");
    if (pendingLoans.length > 0) notifs.push({ id: "loans_hr", type: "info", icon: CreditCard, title: "طلبات سلفة تنتظر موافقة HR", message: `${pendingLoans.length} طلب` });

    if (bonuses.length > 0) notifs.push({ id: "bonuses_pending", type: "info", icon: Gift, title: "مكافآت قيد الاعتماد", message: `${bonuses.length} مكافأة تحتاج موافقة` });
    if (deductions.length > 0) notifs.push({ id: "deductions_pending", type: "warning", icon: MinusCircle, title: "خصومات قيد الاعتماد", message: `${deductions.length} خصم يحتاج مراجعة` });
  }

  // ─── Manager: إجازات + سلف + إنهاء خدمة بانتظار الموافقة ─────────────
  if (isManager && !isHR) {
    const [leaves, loanApps, terminations] = await Promise.all([
      base44.entities.LeaveRequest.filter({ status: "قيد الانتظار" }),
      base44.entities.LoanApplication.filter({ status: "انتظار موافقة المدير" }),
      base44.entities.TerminationRequest.filter({ status: "Pending Manager" }),
    ]);
    if (leaves.length > 0) notifs.push({ id: "leaves_mgr", type: "info", icon: CalendarDays, title: "طلبات إجازة بانتظار موافقتك", message: `${leaves.length} طلب` });
    if (loanApps.length > 0) notifs.push({ id: "loans_mgr", type: "warning", icon: CreditCard, title: "طلبات سلفة بانتظار موافقتك", message: `${loanApps.length} طلب` });
    if (terminations.length > 0) notifs.push({ id: "term_mgr", type: "danger", icon: UserX, title: "طلبات إنهاء خدمة تنتظر تأكيدك", message: `${terminations.length} طلب` });
  }

  // ─── Finance: سلف + إنهاء خدمة + مكافآت للصرف ──────────────────────
  if (isFinance && !isHR) {
    const [loanApps, terminations, bonuses] = await Promise.all([
      base44.entities.LoanApplication.filter({ status: "انتظار موافقة المالية" }),
      base44.entities.TerminationRequest.filter({ status: "Pending Finance" }),
      base44.entities.Bonus.filter({ status: "معتمدة" }),
    ]);
    const disburse = await base44.entities.LoanApplication.filter({ status: "معتمدة" }).catch(() => []);
    if (loanApps.length > 0) notifs.push({ id: "loans_fin", type: "warning", icon: CreditCard, title: "سلف تنتظر موافقة المالية", message: `${loanApps.length} طلب` });
    if (disburse.length > 0) notifs.push({ id: "disburse_fin", type: "danger", icon: CreditCard, title: "سلف معتمدة جاهزة للصرف", message: `${disburse.length} سلفة` });
    if (terminations.length > 0) notifs.push({ id: "term_fin", type: "danger", icon: UserX, title: "إنهاء خدمة يحتاج تخليص مالي", message: `${terminations.length} طلب` });
    if (bonuses.length > 0) notifs.push({ id: "bonus_pay", type: "info", icon: Gift, title: "مكافآت معتمدة للصرف", message: `${bonuses.length} مكافأة` });
  }

  // ─── IT: إنهاء خدمة يحتاج تخليص IT ──────────────────────────────────
  if (isIT && !isHR) {
    const terminations = await base44.entities.TerminationRequest.filter({ status: "Pending IT/Assets" });
    if (terminations.length > 0) notifs.push({ id: "term_it", type: "danger", icon: UserX, title: "إنهاء خدمة يحتاج تخليص IT", message: `${terminations.length} طلب` });
  }

  // ─── Employee: إشعاراته الشخصية فقط ──────────────────────────────────
  if (isEmployee && userEmail) {
    const [emps, myLeaves, myLoanApps] = await Promise.all([
      base44.entities.Employee.list(),
      base44.entities.LeaveRequest.list(),
      base44.entities.LoanApplication.list(),
    ]);
    const myEmp = emps.find(e => e.email?.toLowerCase() === userEmail?.toLowerCase());
    if (myEmp) {
      const myPendingLeaves = myLeaves.filter(l => l.employee_id === myEmp.id && l.status === "قيد الانتظار");
      const myApprovedLeaves = myLeaves.filter(l => l.employee_id === myEmp.id && l.status === "موافق عليها");
      const myLoans = myLoanApps.filter(a => a.employee_id === myEmp.id);
      const approvedLoan = myLoans.find(a => a.status === "معتمدة" || a.status === "مصروفة");
      if (myPendingLeaves.length > 0) notifs.push({ id: "my_leave_pending", type: "info", icon: CalendarDays, title: "طلبات إجازتك قيد المراجعة", message: `${myPendingLeaves.length} طلب` });
      if (myApprovedLeaves.length > 0) notifs.push({ id: "my_leave_approved", type: "success", icon: CheckCircle, title: "تمت الموافقة على إجازتك", message: `${myApprovedLeaves.length} طلب موافق عليه` });
      if (approvedLoan) notifs.push({ id: "my_loan", type: "success", icon: CreditCard, title: "تم اعتماد طلب السلفة", message: `${approvedLoan.amount?.toLocaleString("ar-SA")} ر.س` });
    }
  }

  return notifs;
}

const TYPE_STYLES = {
  danger: { bg: "bg-red-50 border-red-100", icon: "text-red-500", dot: "bg-red-500" },
  warning: { bg: "bg-amber-50 border-amber-100", icon: "text-amber-500", dot: "bg-amber-400" },
  info: { bg: "bg-blue-50 border-blue-100", icon: "text-blue-500", dot: "bg-blue-400" },
  success: { bg: "bg-green-50 border-green-100", icon: "text-green-500", dot: "bg-green-400" },
};

export default function NotificationPanel({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    base44.auth.me().then(user => {
      buildNotifications(user?.role, user?.email).then(setNotifications);
    });
  }, [isOpen]);

  const visible = notifications.filter(n => !dismissed.includes(n.id));

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed top-14 left-4 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">الإشعارات</h3>
            {visible.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{visible.length}</span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
              <p className="text-sm">لا توجد إشعارات جديدة</p>
            </div>
          ) : visible.map(notif => {
            const styles = TYPE_STYLES[notif.type];
            const Icon = notif.icon;
            return (
              <div key={notif.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${styles.bg}`}>
                <div className={`mt-0.5 p-1.5 rounded-lg bg-white/80 ${styles.icon}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground">{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.message}</p>
                </div>
                <button onClick={() => setDismissed(d => [...d, notif.id])}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-white/60">
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>

        {visible.length > 0 && (
          <div className="px-4 py-2 border-t border-border">
            <button onClick={() => setDismissed(notifications.map(n => n.id))}
              className="text-xs text-muted-foreground hover:text-foreground">تجاهل الكل</button>
          </div>
        )}
      </div>
    </>
  );
}