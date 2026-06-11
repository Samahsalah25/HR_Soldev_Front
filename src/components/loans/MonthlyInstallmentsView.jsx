import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { formatCurrency } from "@/lib/hrUtils";
import { formatMonth, logLoanAction } from "@/lib/loanUtils";
import { getAllInstallments } from "@/api/salaryAdvancesApi";
import {
  payInstallment,
  delayInstallment,

} from "@/api/salaryAdvancesApi";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

export default function MonthlyInstallmentsView({ loans  }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(null); // id of installment being saved
  const [deferModal, setDeferModal] = useState(null);
  const [deferMonth, setDeferMonth] = useState("");

  const selectedMonthStr = `${year}-${String(month).padStart(2, "0")}`;

  useEffect(() => {
    loadInstallments();
  }, [selectedMonthStr]);

const loadInstallments = async () => {
  setLoading(true);

  const res = await getAllInstallments();

  const reps = res?.data || [];

  const filtered = reps
    .filter(r => {
      if (!r.due_date) return false;

      const date = new Date(r.due_date);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      const currentMonth = `${year}-${month}`;

      return currentMonth === selectedMonthStr;
    })
    .sort((a, b) =>
      (a.employee_name || "").localeCompare(b.employee_name || "")
    );

  setInstallments(filtered);
  setLoading(false);
};
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

 const markPaid = async (rep) => {
  try {
    if (!rep?.id) return;

    // IMPORTANT: استخدم advance_id مش loan_id
    const advanceId = rep.advance_id;

    if (!advanceId) {
      console.error("Missing advance_id:", rep);
      return;
    }

    setSaving(rep.id);

    await payInstallment(advanceId, rep.id);

    await loadInstallments();
  } catch (error) {
    console.error("Pay error:", error);
  } finally {
    setSaving(null);
  }
};

const confirmDefer = async () => {
  if (!deferMonth || !deferModal) return;

  setSaving(deferModal.id);

  try {
    const user = await base44.auth.me();

    await delayInstallment(deferModal.id, deferMonth);

    await logLoanAction({
      loan_id: deferModal.loan_id,
      employee_name: deferModal.employee_name,
      action: "تأجيل قسط",
      performed_by: user.full_name || user.email,
      performed_by_role: user.role,
      new_value: `من ${selectedMonthStr} إلى ${deferMonth}`,
    });

    setDeferModal(null);
    setDeferMonth("");

    await loadInstallments();
  } finally {
    setSaving(null);
  }
};

 
const pending = installments.filter(r => r.state === "unpaid");
const paid = installments.filter(r => r.state === "paid");
const deferred = installments.filter(r => r.state === "postponed");

const totalPending = pending.reduce((s, r) => s + Number(r.amount || 0), 0);
const totalPaid = paid.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Month Navigator */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{MONTHS_AR[month - 1]} {year}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{installments.length} قسط في هذا الشهر</p>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-amber-700">{pending.length}</p>
          <p className="text-xs text-amber-600">مجدول</p>
          <p className="text-xs font-semibold text-amber-700 mt-0.5">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-700">{paid.length}</p>
          <p className="text-xs text-green-600">مدفوع</p>
          <p className="text-xs font-semibold text-green-700 mt-0.5">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-red-700">{deferred.length}</p>
          <p className="text-xs text-red-600">مؤجل</p>
          <p className="text-xs font-semibold text-red-700 mt-0.5">—</p>
        </div>
      </div>

      {/* Installments List */}
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : installments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="text-sm">لا توجد أقساط في {MONTHS_AR[month - 1]} {year}</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الموظف", "رقم القسط", "المبلغ", "الحالة", "إجراء"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {installments.map(rep => (
                <tr key={rep.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{rep.employee_name}</p>
                    {rep.notes && <p className="text-xs text-muted-foreground">{rep.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto">
                      {rep.installment_number}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-foreground">{formatCurrency(rep.amount)}</td>
                  <td className="px-4 py-3">
                    {rep.state === "paid" ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />مدفوع
                        {rep.paid_at && <span className="text-muted-foreground">({new Date(rep.paid_at).toLocaleDateString("ar-SA")})</span>}
                      </span>
                    ) : rep.state === "postponed" ? (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />مؤجل
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />مجدول
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {rep.state === "unpaid" && (
                      <div className="flex gap-1">
                      <button
  onClick={() => {
    console.log("rep clicked:", rep);
    if (!rep?.id) {
      console.error("Missing installment id", rep);
      return;
    }
    markPaid(rep);
  }}
  disabled={saving === rep.id || !rep?.id}
  className="text-xs px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium disabled:opacity-50"
>
  {saving === rep.id ? "..." : "✓ سداد"}
</button>
                        <button
                          onClick={() => { setDeferModal(rep); setDeferMonth(""); }}
                          className="text-xs px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium">
                          تأجيل
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Defer Modal */}
      {deferModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60" dir="rtl">
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />تأجيل القسط
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{deferModal.employee_name}</span>
              <br />قسط رقم <span className="font-semibold text-foreground">{deferModal.installment_number}</span> بمبلغ <span className="font-semibold text-foreground">{formatCurrency(deferModal.amount)}</span>
              <br />المستحق في: <span className="font-semibold text-foreground">{MONTHS_AR[month - 1]} {year}</span>
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">شهر التأجيل الجديد *</label>
              <input type="month" value={deferMonth} onChange={e => setDeferMonth(e.target.value)}
                min={selectedMonthStr}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
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
    </div>
  );
}