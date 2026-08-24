import { useState, useEffect } from "react";
import { Bell, X, AlertTriangle, FileWarning, CalendarDays, CheckCircle, CreditCard, Gift, MinusCircle } from "lucide-react";
import { useRole } from "../lib/useRole";
import { getExpiryStatus } from "../lib/hrUtils";
import { getEmployeesList, normalizeEmployee } from "@/api/employeesApi";
import { getAllVacationRequests } from "@/api/requestsApi";
import { getUnderApprovalAdditions } from "@/api/additionsApi";
import { getUnderApprovalDeductions } from "@/api/deductionsApi";
import { getSalaryAdvances } from "@/api/salaryAdvancesApi";

// كل قسم بينفّذ لوحده جوّه try/catch — عشان فشل قسم واحد (زي endpoint لسه
// مش متأكدين من شكله) ميوقفش باقي الإشعارات من الظهور
async function buildNotifications(role, employeeId) {
  const notifs = [];
  const isHR = role === "admin" || role === "hr";
  const isManager = ["admin", "hr", "dept_manager", "general_manager", "ceo"].includes(role);
  const isEmployee = role === "employee" || role === "user";

  // ─── وثائق منتهية (إقامة/هوية، جواز، عقود محددة المدة) — لكل الأدوار
  // الإدارية (HR ومديرين) عشان محدش يفوّته ───────────────────────────
  if (isManager) {
    try {
      const emps = (await getEmployeesList()).map(normalizeEmployee);
      emps.forEach((emp) => {
        const idStatus = getExpiryStatus(emp.id_expiry);
        if (idStatus && idStatus.days <= 90) {
          notifs.push({
            id: `id_${emp.id}`,
            type: idStatus.days <= 7 ? "danger" : idStatus.days <= 30 ? "danger" : "warning",
            icon: FileWarning,
            title: emp.is_saudi ? "هوية وطنية تستحق التجديد" : "إقامة تستحق التجديد",
            message: `${emp.full_name_ar || emp.name} — ${idStatus.label}`,
          });
        }
        const passStatus = getExpiryStatus(emp.passport_expiry);
        if (passStatus && passStatus.days <= 90) {
          notifs.push({
            id: `pass_${emp.id}`,
            type: passStatus.days <= 30 ? "danger" : "warning",
            icon: FileWarning,
            title: "جواز سفر يستحق التجديد",
            message: `${emp.full_name_ar || emp.name} — ${passStatus.label}`,
          });
        }
        if (emp.contract_type === "محدد المدة" && emp.contract_end_date) {
          const cStatus = getExpiryStatus(emp.contract_end_date);
          if (cStatus && cStatus.days <= 60) {
            notifs.push({
              id: `contract_${emp.id}`,
              type: cStatus.days <= 30 ? "danger" : "warning",
              icon: AlertTriangle,
              title: "عقد عمل يقترب من الانتهاء",
              message: `${emp.full_name_ar || emp.name} — ${cStatus.label}`,
            });
          }
        }
      });
    } catch (err) {
      console.error("تعذّر تحميل تنبيهات انتهاء الوثائق:", err);
    }
  }

  // ─── HR & Admin: إجازات + بدلات/مكافآت + خصومات قيد الاعتماد ────────
  if (isHR) {
    try {
      const leavesRes = await getAllVacationRequests();
      const pending = (leavesRes?.data || []).filter((l) => l.state === "waiting_manager_approval");
      if (pending.length > 0) notifs.push({ id: "pending_leaves", type: "info", icon: CalendarDays, title: "طلبات إجازة بانتظار الموافقة", message: `${pending.length} طلب في قائمة الانتظار` });
    } catch (err) {
      console.error("تعذّر تحميل تنبيهات الإجازات:", err);
    }

    try {
      const additionsRes = await getUnderApprovalAdditions();
      const list = additionsRes?.data || [];
      if (list.length > 0) notifs.push({ id: "bonuses_pending", type: "info", icon: Gift, title: "مكافآت/بدلات قيد الاعتماد", message: `${list.length} طلب يحتاج موافقة` });
    } catch (err) {
      console.error("تعذّر تحميل تنبيهات المكافآت:", err);
    }

    try {
      const deductionsRes = await getUnderApprovalDeductions();
      const list = deductionsRes?.data || [];
      if (list.length > 0) notifs.push({ id: "deductions_pending", type: "warning", icon: MinusCircle, title: "خصومات قيد الاعتماد", message: `${list.length} خصم يحتاج مراجعة` });
    } catch (err) {
      console.error("تعذّر تحميل تنبيهات الخصومات:", err);
    }
  }

  // ─── Manager (غير HR): إجازات + سلف بانتظار موافقته ─────────────────
  if (isManager && !isHR) {
    try {
      const leavesRes = await getAllVacationRequests();
      const pending = (leavesRes?.data || []).filter((l) => l.state === "waiting_manager_approval");
      if (pending.length > 0) notifs.push({ id: "leaves_mgr", type: "info", icon: CalendarDays, title: "طلبات إجازة بانتظار موافقتك", message: `${pending.length} طلب` });
    } catch (err) {
      console.error("تعذّر تحميل تنبيهات الإجازات:", err);
    }

    try {
      const loansRes = await getSalaryAdvances();
      const pending = (loansRes?.data || []).filter((l) => l.state === "waiting_manager");
      if (pending.length > 0) notifs.push({ id: "loans_mgr", type: "warning", icon: CreditCard, title: "طلبات سلفة بانتظار موافقتك", message: `${pending.length} طلب` });
    } catch (err) {
      console.error("تعذّر تحميل تنبيهات السلف:", err);
    }
  }

  // ─── Employee: إشعاراته الشخصية فقط ──────────────────────────────────
  if (isEmployee && employeeId) {
    try {
      const leavesRes = await getAllVacationRequests();
      const myLeaves = (leavesRes?.data || []).filter((l) => l.employee?.id === employeeId);
      const myPending = myLeaves.filter((l) => l.state === "waiting_manager_approval" || l.state === "confirm");
      const myApproved = myLeaves.filter((l) => l.state === "validate");
      if (myPending.length > 0) notifs.push({ id: "my_leave_pending", type: "info", icon: CalendarDays, title: "طلبات إجازتك قيد المراجعة", message: `${myPending.length} طلب` });
      if (myApproved.length > 0) notifs.push({ id: "my_leave_approved", type: "success", icon: CheckCircle, title: "تمت الموافقة على إجازتك", message: `${myApproved.length} طلب موافق عليه` });
    } catch (err) {
      console.error("تعذّر تحميل إشعارات الموظف:", err);
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
  const { role, user } = useRole();
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    if (!isOpen || !role) return;
    buildNotifications(role, user?.employee_id).then(setNotifications);
  }, [isOpen, role, user]);

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
