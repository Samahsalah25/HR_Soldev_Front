import { useState, useEffect } from "react";
import { X, Calendar, CheckCircle, Clock, AlertTriangle, RotateCcw, DollarSign } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatMonth, logLoanAction } from "@/lib/loanUtils";
import { formatCurrency } from "@/lib/hrUtils";
import LoanWorkflowBadge from "./LoanWorkflowBadge";

export default function LoanDetailModal({ loan, repayments: initialRepayments, onClose, onUpdate }) {
  const [repayments, setRepayments] = useState(initialRepayments || []);
  const [auditLog, setAuditLog] = useState([]);
  const [activeTab, setActiveTab] = useState("schedule");
  const [saving, setSaving] = useState(false);
  const [deferModal, setDeferModal] = useState(null); // repayment to defer
  const [deferMonth, setDeferMonth] = useState("");

  useEffect(() => {
    // جلب سجل العمليات بـ loan_id أو loan_application_id
    Promise.all([
      base44.entities.LoanAuditLog.filter({ loan_id: loan.id }),
      loan.request_id ? base44.entities.LoanAuditLog.filter({ loan_application_id: loan.request_id }) : Promise.resolve([]),
    ]).then(([byLoan, byApp]) => {
      const combined = [...byLoan];
      byApp.forEach(l => { if (!combined.find(x => x.id === l.id)) combined.push(l); });
      setAuditLog(combined.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    });
    if (!initialRepayments) {
      base44.entities.LoanRepayment.filter({ loan_id: loan.id }).then(r => setRepayments(r.sort((a, b) => a.installment_number - b.installment_number)));
    }
  }, [loan.id]);

  const paidCount = repayments.filter(r => r.status === "مدفوع").length;
  const remaining = repayments.filter(r => r.status !== "مدفوع").length;
  const paidAmount = repayments.filter(r => r.status === "مدفوع").reduce((s, r) => s + r.amount, 0);
  const remainingAmount = repayments.filter(r => r.status !== "مدفوع").reduce((s, r) => s + r.amount, 0);

  const markPaid = async (repayment) => {
    setSaving(true);
    const user = await base44.auth.me();
    await base44.entities.LoanRepayment.update(repayment.id, {
      status: "مدفوع",
      paid_at: new Date().toISOString().slice(0, 10),
      paid_by: user.full_name || user.email,
    });
    // تحديث سجل السلفة الرئيسي
    const newPaid = paidAmount + repayment.amount;
    const newRemaining = loan.amount - newPaid;
    await base44.entities.Loan.update(loan.loan_id || loan.id, {
      paid_amount: newPaid,
      remaining_amount: newRemaining,
      status: newRemaining <= 0 ? "مسددة بالكامل" : "نشطة",
    });
    await logLoanAction({
      loan_id: loan.id,
      employee_name: loan.employee_name,
      action: "سداد قسط",
      performed_by: user.full_name || user.email,
      performed_by_role: user.role,
      new_value: `قسط ${repayment.installment_number} — ${repayment.amount} ر.س`,
    });
    const updated = await base44.entities.LoanRepayment.filter({ loan_id: loan.id });
    setRepayments(updated.sort((a, b) => a.installment_number - b.installment_number));
    setSaving(false);
    if (onUpdate) onUpdate();
  };

  const confirmDefer = async () => {
    if (!deferMonth) return;
    const repayment = deferModal;
    setSaving(true);
    const user = await base44.auth.me();
    // mark current installment as deferred
    await base44.entities.LoanRepayment.update(repayment.id, {
      status: "مؤجل",
      notes: `مؤجل إلى ${deferMonth}`,
    });
    // create new installment for the deferred month
    await base44.entities.LoanRepayment.create({
      loan_id: loan.id,
      employee_id: loan.employee_id,
      employee_name: loan.employee_name,
      installment_number: repayment.installment_number,
      due_month: deferMonth,
      amount: repayment.amount,
      status: "مجدول",
      notes: `مُرحَّل من قسط ${repayment.installment_number} الأصلي`,
    });
    await logLoanAction({
      loan_id: loan.id,
      employee_name: loan.employee_name,
      action: "تعديل جدول",
      performed_by: user.full_name || user.email,
      performed_by_role: user.role,
      new_value: `تأجيل قسط ${repayment.installment_number} إلى ${deferMonth}`,
    });
    const updated = await base44.entities.LoanRepayment.filter({ loan_id: loan.id });
    setRepayments(updated.sort((a, b) => a.installment_number - b.installment_number || a.due_month?.localeCompare(b.due_month)));
    setSaving(false);
    setDeferModal(null);
    setDeferMonth("");
    if (onUpdate) onUpdate();
  };

  const earlySettle = async () => {
    if (!window.confirm(`هل تريد السداد المبكر الكامل للمبلغ المتبقي (${remainingAmount.toLocaleString("ar-SA")} ر.س)؟`)) return;
    setSaving(true);
    const user = await base44.auth.me();
    for (const r of repayments.filter(r => r.status !== "مدفوع")) {
      await base44.entities.LoanRepayment.update(r.id, {
        status: "مدفوع", paid_at: new Date().toISOString().slice(0, 10), paid_by: user.full_name || user.email,
        notes: "سداد مبكر",
      });
    }
    await base44.entities.Loan.update(loan.loan_id || loan.id, {
      paid_amount: loan.amount, remaining_amount: 0, status: "مسددة بالكامل",
    });
    await logLoanAction({
      loan_id: loan.id, employee_name: loan.employee_name,
      action: "سداد مبكر", performed_by: user.full_name || user.email,
      new_value: `${remainingAmount} ر.س`,
    });
    setSaving(false);
    if (onUpdate) onUpdate();
    onClose();
  };

  const statusColors = { "مجدول": "text-amber-600 bg-amber-50", "مدفوع": "text-green-600 bg-green-50", "مؤجل": "text-red-600 bg-red-50", "إجازة بدون راتب": "text-gray-500 bg-gray-50" };

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
            { label: "المبلغ الكلي", value: formatCurrency(loan.amount), color: "text-foreground" },
            { label: "المسدَّد", value: formatCurrency(paidAmount), color: "text-green-600" },
            { label: "المتبقي", value: formatCurrency(remainingAmount), color: "text-red-600" },
            { label: `${paidCount} / ${repayments.length} قسط`, value: `${Math.round((paidCount / (repayments.length || 1)) * 100)}%`, color: "text-primary" },
          ].map(s => (
            <div key={s.label} className="bg-card px-4 py-3 text-center">
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 border-b border-border">
          <div className="w-full bg-muted rounded-full h-2.5">
            <div className="bg-green-500 h-2.5 rounded-full transition-all"
              style={{ width: `${Math.min(100, (paidCount / (repayments.length || 1)) * 100)}%` }} />
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${r.status === "مدفوع" ? "bg-green-100 text-green-700" : r.status === "مؤجل" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                      {r.installment_number}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatMonth(r.due_month)}</p>
                      {r.paid_at && <p className="text-xs text-muted-foreground">سُدِّد: {new Date(r.paid_at).toLocaleDateString("ar-SA")}</p>}
                      {r.notes && <p className="text-xs text-muted-foreground">{r.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{r.amount.toLocaleString("ar-SA")} ر.س</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status]}`}>{r.status}</span>
                    {r.status === "مجدول" && (
                      <div className="flex gap-1">
                        <button onClick={() => markPaid(r)} disabled={saving}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">✓ سداد</button>
                        <button onClick={() => { setDeferModal(r); setDeferMonth(""); }}
                          className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200">تأجيل</button>
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
                <p className="text-center text-sm text-muted-foreground py-8">لا توجد سجلات</p>
              ) : auditLog.map(log => {
                const actionColors = {
                  "إنشاء": "bg-blue-500", "موافقة مدير": "bg-purple-500", "موافقة HR": "bg-teal-500",
                  "موافقة مالية": "bg-orange-500", "صرف": "bg-green-500", "سداد قسط": "bg-green-400",
                  "سداد مبكر": "bg-emerald-600", "تعديل جدول": "bg-amber-500", "رفض": "bg-red-500",
                };
                const dotColor = actionColors[log.action] || "bg-primary";
                return (
                  <div key={log.id} className="flex gap-3 border border-border rounded-xl px-4 py-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-sm font-semibold text-foreground">{log.action}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {log.created_date && (
                            <span>{new Date(log.created_date).toLocaleDateString("ar-SA")} — {new Date(log.created_date).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        بواسطة: <span className="font-medium text-foreground">{log.performed_by}</span>
                        {log.performed_by_role && <span className="text-muted-foreground"> ({log.performed_by_role})</span>}
                      </p>
                      {log.new_value && <p className="text-xs text-foreground bg-muted/30 rounded px-2 py-1 mt-1">{log.new_value}</p>}
                      {log.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{log.notes}</p>}
                    </div>
                  </div>
                );
              })}
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
              min={deferModal.due_month}
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