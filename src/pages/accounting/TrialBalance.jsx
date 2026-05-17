import { useState, useEffect } from "react";
import { BarChart2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TrialBalance() {
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [hideZero, setHideZero] = useState(false);

  const load = async () => {
    const [accs, es] = await Promise.all([
      base44.entities.AccountChart.list("account_code"),
      base44.entities.JournalEntry.filter({ status: "مرحل" }),
    ]);
    setAccounts(accs); setEntries(es); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filteredEntries = entries.filter(e => {
    const d = e.entry_date;
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  });

  const buildBalances = () => {
    const balances = {};
    accounts.filter(a => !a.is_parent).forEach(acc => {
      balances[acc.id] = {
        account: acc,
        totalDebit: acc.opening_balance_type === "مدين" ? (acc.opening_balance || 0) : 0,
        totalCredit: acc.opening_balance_type === "دائن" ? (acc.opening_balance || 0) : 0,
      };
    });
    filteredEntries.forEach(entry => {
      (entry.lines || []).forEach(line => {
        if (balances[line.account_id]) {
          balances[line.account_id].totalDebit += (line.debit || 0);
          balances[line.account_id].totalCredit += (line.credit || 0);
        }
      });
    });
    return Object.values(balances).map(b => {
      const diff = b.totalDebit - b.totalCredit;
      return {
        ...b,
        balanceDebit: diff > 0 ? diff : 0,
        balanceCredit: diff < 0 ? Math.abs(diff) : 0,
      };
    }).filter(b => !hideZero || (b.totalDebit > 0 || b.totalCredit > 0));
  };

  const rows = buildBalances();
  const totals = rows.reduce((acc, r) => ({
    debit: acc.debit + r.totalDebit,
    credit: acc.credit + r.totalCredit,
    balDebit: acc.balDebit + r.balanceDebit,
    balCredit: acc.balCredit + r.balanceCredit,
  }), { debit: 0, credit: 0, balDebit: 0, balCredit: 0 });

  const isBalanced = Math.abs(totals.balDebit - totals.balCredit) < 0.01;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart2 className="w-6 h-6 text-primary" />ميزان المراجعة</h1>
          <p className="text-sm text-muted-foreground mt-0.5">يعتمد على القيود المرحلة فقط</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
          <RefreshCw className="w-4 h-4" />تحديث
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground font-medium">من:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground font-medium">إلى:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mr-auto">
          <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e.target.checked)} className="w-4 h-4 accent-primary" />
          <span>إخفاء الحسابات بدون حركة</span>
        </label>
        <div className={`text-xs px-3 py-1.5 rounded-full font-medium ${isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {isBalanced ? "✓ الميزان متوازن" : "⚠ الميزان غير متوازن"}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">رقم الحساب</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">اسم الحساب</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">نوع الحساب</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-blue-600">إجمالي مدين</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-red-600">إجمالي دائن</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-blue-600">رصيد مدين</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-red-600">رصيد دائن</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">جاري التحميل...</td></tr>
              : rows.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">لا توجد بيانات</td></tr>
              : rows.map(r => (
                <tr key={r.account.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.account.account_code}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{r.account.account_name}</td>
                  <td className="px-4 py-2.5"><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{r.account.account_type}</span></td>
                  <td className="px-4 py-2.5 text-blue-700 font-medium">{r.totalDebit > 0 ? r.totalDebit?.toLocaleString("ar-SA") : "—"}</td>
                  <td className="px-4 py-2.5 text-red-600 font-medium">{r.totalCredit > 0 ? r.totalCredit?.toLocaleString("ar-SA") : "—"}</td>
                  <td className="px-4 py-2.5 text-blue-700 font-bold">{r.balanceDebit > 0 ? r.balanceDebit?.toLocaleString("ar-SA") : "—"}</td>
                  <td className="px-4 py-2.5 text-red-600 font-bold">{r.balanceCredit > 0 ? r.balanceCredit?.toLocaleString("ar-SA") : "—"}</td>
                </tr>
              ))}
          </tbody>
          <tfoot>
            <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold">
              <td colSpan={3} className="px-4 py-3 text-sm font-bold text-foreground">الإجمالي</td>
              <td className="px-4 py-3 text-blue-700">{totals.debit?.toLocaleString("ar-SA")}</td>
              <td className="px-4 py-3 text-red-600">{totals.credit?.toLocaleString("ar-SA")}</td>
              <td className="px-4 py-3 text-blue-700">{totals.balDebit?.toLocaleString("ar-SA")}</td>
              <td className="px-4 py-3 text-red-600">{totals.balCredit?.toLocaleString("ar-SA")}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}