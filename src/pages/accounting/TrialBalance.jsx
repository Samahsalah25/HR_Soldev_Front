import { useState, useEffect, useCallback } from "react";
import { BarChart2, RefreshCw, Loader2 } from "lucide-react";
import { getTrialBalance } from "@/api/accountingApi";

export default function TrialBalance() {
  const [rows, setRows] = useState([]);
  const [grandTotals, setGrandTotals] = useState({
    total_debit: 0,
    total_credit: 0,
    debit_balance: 0,
    credit_balance: 0,
  });
  const [isBalanced, setIsBalanced] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [hideInactive, setHideInactive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrialBalance({
        date_from: dateFrom,
        date_to: dateTo,
        hide_inactive_accounts: hideInactive,
      });

      const totals = data?.grand_totals || {
        total_debit: 0,
        total_credit: 0,
        debit_balance: 0,
        credit_balance: 0,
      };

      setRows(data?.trial_balance || []);
      setGrandTotals(totals);
      // الباك إند مش بيرجع is_balanced، فبنحسبها من مجاميع المدين/الدائن
      setIsBalanced(Math.abs((totals.total_debit || 0) - (totals.total_credit || 0)) < 0.01);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل ميزان المراجعة");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, hideInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n) => (n && n > 0 ? n.toLocaleString("ar-SA") : "—");

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            ميزان المراجعة
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            يعتمد على القيود المرحلة فقط
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          تحديث
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground font-medium">من:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground font-medium">إلى:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mr-auto">
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span>إخفاء الحسابات غير النشطة</span>
        </label>
        <div
          className={`text-xs px-3 py-1.5 rounded-full font-medium ${
            isBalanced
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isBalanced ? "✓ الميزان متوازن" : "⚠ الميزان غير متوازن"}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">رقم الحساب</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">اسم الحساب</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-blue-600">إجمالي مدين</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-red-600">إجمالي دائن</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-blue-600">رصيد مدين</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-red-600">رصيد دائن</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  جاري التحميل...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground">
                  لا توجد بيانات
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.account_id}
                  className="border-b border-border last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                    {r.account_code}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">
                    {r.account_name}
                  </td>
                  <td className="px-4 py-2.5 text-blue-700 font-medium">
                    {fmt(r.total_debit)}
                  </td>
                  <td className="px-4 py-2.5 text-red-600 font-medium">
                    {fmt(r.total_credit)}
                  </td>
                  <td className="px-4 py-2.5 text-blue-700 font-bold">
                    {fmt(r.debit_balance)}
                  </td>
                  <td className="px-4 py-2.5 text-red-600 font-bold">
                    {fmt(r.credit_balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold">
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-foreground">
                الإجمالي
              </td>
              <td className="px-4 py-3 text-blue-700">
                {(grandTotals.total_debit || 0).toLocaleString("ar-SA")}
              </td>
              <td className="px-4 py-3 text-red-600">
                {(grandTotals.total_credit || 0).toLocaleString("ar-SA")}
              </td>
              <td className="px-4 py-3 text-blue-700">
                {(grandTotals.debit_balance || 0).toLocaleString("ar-SA")}
              </td>
              <td className="px-4 py-3 text-red-600">
                {(grandTotals.credit_balance || 0).toLocaleString("ar-SA")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}