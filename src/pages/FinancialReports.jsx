import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { BarChart2, RefreshCw, TrendingDown, DollarSign, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const COLORS = ["#f97316","#8b5cf6","#06b6d4","#10b981","#f43f5e","#eab308","#3b82f6","#ec4899"];

export default function FinancialReports() {
  const [accounts, setAccounts] = useState([]);
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [hideZero, setHideZero] = useState(true);

  const load = async () => {
    setLoading(true);
    const [accs, es, emps, brs] = await Promise.all([
      base44.entities.AccountChart.list("account_code"),
      base44.entities.JournalEntry.filter({ status: "مرحل" }),
      base44.entities.Employee.filter({ status: "نشط" }),
      base44.entities.Branch.list(),
    ]);
    setAccounts(accs); setEntries(es); setEmployees(emps); setBranches(brs); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filteredEntries = entries.filter(e => {
    const d = e.entry_date;
    return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
  });

  // Build trial balance
  const buildTrialBalance = () => {
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
      return { ...b, balanceDebit: diff > 0 ? diff : 0, balanceCredit: diff < 0 ? Math.abs(diff) : 0 };
    }).filter(b => !hideZero || (b.totalDebit > 0 || b.totalCredit > 0));
  };

  const trialRows = buildTrialBalance();
  const totals = trialRows.reduce((acc, r) => ({
    debit: acc.debit + r.totalDebit, credit: acc.credit + r.totalCredit,
    balDebit: acc.balDebit + r.balanceDebit, balCredit: acc.balCredit + r.balanceCredit,
  }), { debit: 0, credit: 0, balDebit: 0, balCredit: 0 });

  const isBalanced = Math.abs(totals.balDebit - totals.balCredit) < 0.01;

  // Expenses by account (for pie chart)
  const expenseAccounts = accounts.filter(a => a.account_type === "مصروفات" && !a.is_parent);
  const expensePieData = expenseAccounts.map(acc => {
    const total = trialRows.find(r => r.account.id === acc.id)?.balanceDebit || 0;
    return { name: acc.account_name, value: total };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  // Salary cost per branch (from employees)
  const branchSalaryData = (branches.length > 0 ? branches : [...new Set(employees.map(e => e.branch).filter(Boolean))].map(b => ({ name: b }))).map(br => {
    const brName = br.name || br;
    const brEmps = employees.filter(e => e.branch === brName);
    const salaries = brEmps.reduce((s, e) => s + ((e.basic_salary || 0) + (e.housing_allowance || 0) + (e.transport_allowance || 0) + (e.food_allowance || 0)), 0);
    // Operational expenses from journal entries tagged to this branch
    const opExpenses = filteredEntries
      .filter(e => e.description?.includes(brName) || e.source?.includes(brName))
      .reduce((s, e) => s + (e.total_debit || 0), 0);
    return { name: brName, رواتب: Math.round(salaries), مصروفات: Math.round(opExpenses), employees: brEmps.length };
  }).filter(d => d.رواتب > 0 || d.مصروفات > 0);

  // KPI summary
  const totalRevenue = trialRows.filter(r => r.account.account_type === "إيرادات").reduce((s, r) => s + r.balanceCredit, 0);
  const totalExpenses = trialRows.filter(r => r.account.account_type === "مصروفات").reduce((s, r) => s + r.balanceDebit, 0);
  const totalAssets = trialRows.filter(r => r.account.account_type === "أصول").reduce((s, r) => s + r.balanceDebit, 0);
  const totalSalaries = employees.reduce((s, e) => s + ((e.basic_salary || 0) + (e.housing_allowance || 0) + (e.transport_allowance || 0) + (e.food_allowance || 0)), 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart2 className="w-6 h-6 text-primary" />التقارير المالية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">ميزان المراجعة الحي + توزيع المصروفات والرواتب</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
          <RefreshCw className="w-4 h-4" />تحديث
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="font-medium text-muted-foreground">من:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="font-medium text-muted-foreground">إلى:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer mr-auto">
          <input type="checkbox" checked={hideZero} onChange={e => setHideZero(e.target.checked)} className="w-4 h-4 accent-primary" />
          <span>إخفاء الحسابات بدون حركة</span>
        </label>
        <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${isBalanced ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {isBalanced ? "✓ الميزان متوازن" : "⚠ الميزان غير متوازن"}
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإيرادات", value: totalRevenue, color: "text-green-600", icon: TrendingDown },
          { label: "إجمالي المصروفات", value: totalExpenses, color: "text-red-600", icon: TrendingDown },
          { label: "إجمالي الأصول", value: totalAssets, color: "text-blue-600", icon: DollarSign },
          { label: "إجمالي الرواتب الشهرية", value: totalSalaries, color: "text-purple-600", icon: DollarSign },
        ].map(k => (
          <div key={k.label} className="bg-card rounded-xl border border-border p-4">
            <p className={`text-xl font-bold ${k.color}`}>{k.value?.toLocaleString("ar-SA")} ر.س</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Salary & Expenses by Branch */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />الرواتب والمصروفات لكل فرع
          </h3>
          {branchSalaryData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">لا توجد بيانات فروع</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={branchSalaryData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v, n) => [`${v?.toLocaleString("ar-SA")} ر.س`, n]} />
                <Legend />
                <Bar dataKey="رواتب" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="مصروفات" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expenses Distribution Pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-4">توزيع المصروفات التشغيلية</h3>
          {expensePieData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">لا توجد مصروفات مسجلة</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={expensePieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {expensePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={v => `${v?.toLocaleString("ar-SA")} ر.س`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Live Trial Balance */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2"><BarChart2 className="w-4 h-4 text-primary" />ميزان المراجعة الحي</h3>
          <span className="text-xs text-muted-foreground">{trialRows.length} حساب</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/20 border-b border-border">
                {["رقم الحساب","اسم الحساب","النوع","مجموع مدين","مجموع دائن","رصيد مدين","رصيد دائن"].map(h => (
                  <th key={h} className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></td></tr>
              ) : trialRows.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-muted-foreground text-sm">لا توجد قيود مرحلة في هذه الفترة</td></tr>
              ) : trialRows.map(r => (
                <tr key={r.account.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{r.account.account_code}</td>
                  <td className="px-4 py-2.5 font-medium text-foreground text-xs">{r.account.account_name}</td>
                  <td className="px-4 py-2.5"><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{r.account.account_type}</span></td>
                  <td className="px-4 py-2.5 text-blue-600 text-xs">{r.totalDebit > 0 ? r.totalDebit.toLocaleString("ar-SA") : "—"}</td>
                  <td className="px-4 py-2.5 text-red-500 text-xs">{r.totalCredit > 0 ? r.totalCredit.toLocaleString("ar-SA") : "—"}</td>
                  <td className="px-4 py-2.5 text-blue-700 font-semibold text-xs">{r.balanceDebit > 0 ? r.balanceDebit.toLocaleString("ar-SA") : "—"}</td>
                  <td className="px-4 py-2.5 text-red-600 font-semibold text-xs">{r.balanceCredit > 0 ? r.balanceCredit.toLocaleString("ar-SA") : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold">
                <td colSpan={3} className="px-4 py-3 text-sm font-bold">الإجمالي</td>
                <td className="px-4 py-3 text-blue-700 text-sm">{totals.debit.toLocaleString("ar-SA")}</td>
                <td className="px-4 py-3 text-red-600 text-sm">{totals.credit.toLocaleString("ar-SA")}</td>
                <td className="px-4 py-3 text-blue-700 text-sm">{totals.balDebit.toLocaleString("ar-SA")}</td>
                <td className="px-4 py-3 text-red-600 text-sm">{totals.balCredit.toLocaleString("ar-SA")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}