import { useState, useEffect } from "react";
import { X, Clock, RotateCcw, DollarSign } from "lucide-react";
import { formatMonth } from "@/lib/loanUtils";
import { formatCurrency } from "@/lib/hrUtils";
import LoanWorkflowBadge from "./LoanWorkflowBadge";
import {
  payInstallment,
  delayInstallment,
  earlyPayInstallment,
  getSalaryAdvanceInstallments,
    getSalaryAdvanceHistory,
} from "@/api/salaryAdvancesApi";
import { useConfirm } from "@/components/ui/confirm-dialog";
export default function LoanDetailModal({ loan, repayments: initialRepayments, onClose, onUpdate }) {
  const confirmDialog = useConfirm();
  const [repayments, setRepayments] = useState(initialRepayments || []);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule");
  const [saving, setSaving] = useState(false);
  const [deferModal, setDeferModal] = useState(null); // repayment to defer
  const [deferMonth, setDeferMonth] = useState("");

useEffect(() => {
  const loadHistory = async () => {
    try {
      const response = await getSalaryAdvanceHistory(
        loan.id
      );

      setAuditLog(response.data || []);
    } catch (error) {
      console.error(
        "History load error:",
        error
      );
    }
  };

  loadHistory();
}, [loan.id]);

 const activeRepayments = repayments.filter(
  (r) => r.state !== "postponed"
);

const paidCount = activeRepayments.filter(
  (r) => r.state === "paid"
).length;

const remaining = activeRepayments.filter(
  (r) => r.state !== "paid"
).length;

const paidAmount = activeRepayments
  .filter((r) => r.state === "paid")
  .reduce((s, r) => s + Number(r.amount), 0);

const remainingAmount = activeRepayments
  .filter((r) => r.state !== "paid")
  .reduce((s, r) => s + Number(r.amount), 0);
  const loadInstallments = async () => {
  const response =
    await getSalaryAdvanceInstallments(loan.id);

  setRepayments([...response.data]);
};
useEffect(() => {
  loadInstallments();
}, [loan.id]);

const markPaid = async (repayment) => {
  try {
    setSaving(repayment.id);

    await payInstallment(
      repayment.loan_id,
      repayment.id
    );

    await loadInstallments();
  } catch (error) {
    console.error("Pay error:", error);
  } finally {
    setSaving(null);
  }
};

const confirmDefer = async () => {
  if (!deferMonth || !deferModal) return;

  try {
    setSaving(deferModal.id);

    await delayInstallment(
      deferModal.loan_id,
      deferModal.id,
      `${deferMonth}-01`
    );

    await loadInstallments();

    setDeferModal(null);
    setDeferMonth("");
  } catch (error) {
    console.error("Delay error:", error);
  } finally {
    setSaving(null);
  }
};

 const earlySettle = async () => {
  const ok = await confirmDialog({
    title: "السداد المبكر",
    message: `هل تريد السداد المبكر الكامل للمبلغ المتبقي (${remainingAmount.toLocaleString("ar-SA")} ر.س)؟ لا يمكن التراجع عن هذا الإجراء.`,
    confirmText: "سداد",
    variant: "destructive",
  });
  if (!ok) {
    return;
  }

  try {
    setSaving(true);

    const unpaidInstallments =
      repayments.filter(
        (r) => r.state === "unpaid"
      );

    for (const installment of unpaidInstallments) {
      await earlyPayInstallment(
        loan.id,
        installment.id,
        installment.due_date
      );
    }

    await loadInstallments();

    if (onUpdate) {
      onUpdate();
    }
  } catch (error) {
    console.error(
      "Early settle error:",
      error
    );
  } finally {
    setSaving(false);
  }
};

const statusColors = {
  paid: "text-green-600 bg-green-50",
  unpaid: "text-amber-600 bg-amber-50",
  postponed: "text-blue-600 bg-blue-50",
};
const activeInstallments = repayments.filter(
  (r) => r.state !== "postponed"
);
  return (
    <>
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-teal-600" />
              متابعة السلفة — {loan.employee_name}
            </h3>
            <LoanWorkflowBadge status={loan.status} showSteps={true} />
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

    {/* Stats */}
<div className="grid grid-cols-4 gap-px bg-border border-b border-border">
  {[
    {
      label: "المبلغ الكلي",
      value: formatCurrency(loan.amount),
      color: "text-foreground",
    },
    {
      label: "المسدَّد",
      value: formatCurrency(paidAmount),
      color: "text-green-600",
    },
    {
      label: "المتبقي",
      value: formatCurrency(remainingAmount),
      color: "text-red-600",
    },
    {
      label: `${paidCount} / ${activeInstallments.length} قسط`,
      value: `${Math.round(
        (paidCount / (activeInstallments.length || 1)) * 100
      )}%`,
      color: "text-primary",
    },
  ].map((s) => (
    <div
      key={s.label}
      className="bg-card px-4 py-3 text-center"
    >
      <p
        className={`text-lg font-bold ${s.color}`}
      >
        {s.value}
      </p>
      <p className="text-xs text-muted-foreground">
        {s.label}
      </p>
    </div>
  ))}
</div>

{/* Progress Bar */}
<div className="px-6 py-3 border-b border-border">
  <div className="w-full bg-muted rounded-full h-2.5">
    <div
      className="bg-green-500 h-2.5 rounded-full transition-all"
      style={{
        width: `${Math.min(
          100,
          (paidCount /
            (activeInstallments.length || 1)) *
            100
        )}%`,
      }}
    />
  </div>
</div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-2 border-b border-border">
          {[{ id: "schedule", label: "جدول السداد" }, { id: "audit", label: "سجل العمليات" }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${activeTab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "schedule" && (
            <div className="space-y-2">
              {repayments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">لم يتم إنشاء جدول السداد بعد</p>
              ) : repayments.map(r => (
                <div key={r.id} className="flex items-center justify-between border border-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.state === "paid" ? "bg-green-100 text-green-700" : r.status === "مؤجل" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                      {r.installment_number}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground"><p className="text-sm font-medium text-foreground">
  {formatMonth(r.due_date)}
</p></p>
                      {r.paid_at && <p className="text-xs text-muted-foreground">سُدِّد: {new Date(r.paid_at).toLocaleDateString("ar-SA")}</p>}
                      {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                    </div>
                  </div>
                 <div className="flex items-center gap-3">
  <span className="font-bold text-foreground">
    {Number(r.amount).toLocaleString("ar-SA")} ر.س
  </span>

 <span
  className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.state]}`}
>
  {r.state === "paid"
    ? "مدفوع"
    : r.state === "postponed"
    ? "تم تأجيله"
    : "غير مدفوع"}
</span>

  {r.state === "unpaid" && (
    <div className="flex gap-1">
      <button
        onClick={() => markPaid(r)}
        disabled={saving}
        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
      >
        ✓ سداد
      </button>

      <button
        onClick={() => {
          setDeferModal(r);
          setDeferMonth("");
        }}
        className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
      >
        تأجيل
      </button>
    </div>
  )}
</div>
                </div>
              ))}
            </div>
          )}

       {activeTab === "audit" && (
  <div className="space-y-2">
    {auditLog.length === 0 ? (
      <p className="text-center text-sm text-muted-foreground py-8">
        لا توجد سجلات
      </p>
    ) : (
      auditLog.map((log) => {
        const actionColors = {
          submit: "bg-blue-500",
          manager_approve: "bg-purple-500",
          hr_approve: "bg-teal-500",
          finance_approve: "bg-orange-500",
          pay: "bg-green-500",
          installment_paid: "bg-green-400",
          early_pay: "bg-emerald-600",
          postpone: "bg-amber-500",
          reject: "bg-red-500",
        };

        const dotColor =
          actionColors[log.action_type] || "bg-primary";

        return (
          <div
            key={log.id}
            className="flex gap-3 border border-border rounded-xl px-4 py-3"
          >
            <div
              className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`}
            />

            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {log.action_title}
                </span>

                {log.date && (
                  <span className="text-xs text-muted-foreground">
                    {log.date}
                  </span>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-0.5">
                بواسطة:
                <span className="font-medium text-foreground">
                  {" "}
                  {log.user_name}
                </span>
              </p>

              {log.details && (
                <p className="text-xs text-foreground bg-muted/30 rounded px-2 py-1 mt-1">
                  {log.details}
                </p>
              )}
            </div>
          </div>
        );
      })
    )}
  </div>
)}
        </div>

        {remainingAmount > 0 && remaining > 1 && (
          <div className="px-6 py-4 border-t border-border">
            <button onClick={earlySettle} disabled={saving}
              className="flex items-center gap-2 text-sm text-teal-700 hover:bg-teal-50 px-4 py-2 rounded-lg border border-teal-200 transition-colors">
              <RotateCcw className="w-4 h-4" />السداد المبكر الكامل ({formatCurrency(remainingAmount)})
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Defer Modal */}
    {deferModal && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60" dir="rtl">
        <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6 space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />تأجيل القسط
          </h3>
          <p className="text-sm text-muted-foreground">
            قسط رقم <span className="font-semibold text-foreground">{deferModal.installment_number}</span> بمبلغ <span className="font-semibold text-foreground">{formatCurrency(deferModal.amount)}</span>
            <br />المستحق في: <span className="font-semibold text-foreground">{formatMonth(deferModal.due_month)}</span>
          </p>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">شهر التأجيل الجديد *</label>
            <input type="month" value={deferMonth} onChange={e => setDeferMonth(e.target.value)}
          min={deferModal.due_date}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
            <p className="text-xs text-muted-foreground">سيتم إنشاء قسط جديد بنفس المبلغ في الشهر المحدد</p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setDeferModal(null); setDeferMonth(""); }}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted">إلغاء</button>
            <button onClick={confirmDefer} disabled={!deferMonth || saving}
              className="px-4 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 font-medium">
              {saving ? "جاري التأجيل..." : "تأكيد التأجيل"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}