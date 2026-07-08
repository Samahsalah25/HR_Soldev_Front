// import { useState, useEffect } from "react";
// import { TrendingUp, Scale, RefreshCw } from "lucide-react";
// import { base44 } from "@/api/base44Client";

// export default function FinancialStatements() {
//   const [accounts, setAccounts] = useState([]);
//   const [entries, setEntries] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState("income");
//   const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
//   const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

//   const load = async () => {
//     const [accs, es] = await Promise.all([
//       base44.entities.AccountChart.list("account_code"),
//       base44.entities.JournalEntry.filter({ status: "مرحل" }),
//     ]);
//     setAccounts(accs); setEntries(es); setLoading(false);
//   };
//   useEffect(() => { load(); }, []);

//   const filteredEntries = entries.filter(e => {
//     const d = e.entry_date;
//     return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
//   });

//   const getAccountBalance = (accId, opening = 0, openingType = "مدين") => {
//     let debit = openingType === "مدين" ? opening : 0;
//     let credit = openingType === "دائن" ? opening : 0;
//     filteredEntries.forEach(entry => {
//       (entry.lines || []).forEach(line => {
//         if (line.account_id === accId) {
//           debit += (line.debit || 0);
//           credit += (line.credit || 0);
//         }
//       });
//     });
//     return { debit, credit, net: debit - credit };
//   };

//   const getTypeAccounts = (type) => accounts.filter(a => a.account_type === type && !a.is_parent);

//   const sumType = (type) => {
//     return getTypeAccounts(type).reduce((sum, acc) => {
//       const bal = getAccountBalance(acc.id, acc.opening_balance || 0, acc.opening_balance_type || "مدين");
//       const normal = acc.normal_balance || "مدين";
//       return sum + (normal === "مدين" ? Math.max(0, bal.net) : Math.max(0, -bal.net));
//     }, 0);
//   };

//   const revenues = sumType("إيرادات");
//   const expenses = sumType("مصروفات");
//   const netIncome = revenues - expenses;

//   const assets = sumType("أصول");
//   const liabilities = sumType("التزامات");
//   const equity = sumType("حقوق الملكية") + netIncome;

//   const SectionRow = ({ label, value, bold, indent, positive }) => (
//     <div className={`flex justify-between items-center py-2 ${indent ? "pr-6" : ""} ${bold ? "border-t border-border mt-2 pt-3" : "border-b border-border/30"}`}>
//       <span className={`text-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{label}</span>
//       <span className={`text-sm font-medium ${bold ? "font-bold" : ""} ${positive === false ? "text-red-600" : positive === true ? "text-green-600" : "text-foreground"}`}>
//         {value?.toLocaleString("ar-SA")} ر.س
//       </span>
//     </div>
//   );

//   return (
//     <div className="p-6 space-y-5 max-w-4xl mx-auto" dir="rtl">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-foreground">القوائم المالية</h1>
//           <p className="text-sm text-muted-foreground mt-0.5">تعتمد على القيود المرحلة وتصنيف شجرة الحسابات</p>
//         </div>
//         <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
//           <RefreshCw className="w-4 h-4" />تحديث
//         </button>
//       </div>

//       {/* Date Filter */}
//       <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl px-4 py-3">
//         <div className="flex items-center gap-2 text-sm">
//           <label className="text-muted-foreground font-medium">من:</label>
//           <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
//             className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
//         </div>
//         <div className="flex items-center gap-2 text-sm">
//           <label className="text-muted-foreground font-medium">إلى:</label>
//           <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
//             className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none" />
//         </div>
//       </div>

//       {/* Tabs */}
//       <div className="flex gap-1 border-b border-border">
//         {[
//           { id: "income", label: "قائمة الدخل", icon: TrendingUp },
//           { id: "balance", label: "الميزانية العمومية", icon: Scale },
//         ].map(t => (
//           <button key={t.id} onClick={() => setActiveTab(t.id)}
//             className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
//             <t.icon className="w-4 h-4" />{t.label}
//           </button>
//         ))}
//       </div>

//       {loading ? (
//         <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
//       ) : activeTab === "income" ? (
//         <div className="bg-card rounded-xl border border-border p-6 space-y-1">
//           <h2 className="text-lg font-bold text-foreground text-center mb-6">قائمة الدخل</h2>
//           <div className="mb-4">
//             <p className="text-xs font-bold text-muted-foreground uppercase mb-2">الإيرادات</p>
//             {getTypeAccounts("إيرادات").map(acc => {
//               const bal = getAccountBalance(acc.id, acc.opening_balance || 0, acc.opening_balance_type || "دائن");
//               const val = Math.max(0, -bal.net);
//               return val > 0 ? <SectionRow key={acc.id} label={acc.account_name} value={val} indent positive={true} /> : null;
//             })}
//             <SectionRow label="إجمالي الإيرادات" value={revenues} bold positive={true} />
//           </div>
//           <div className="mb-4 mt-4">
//             <p className="text-xs font-bold text-muted-foreground uppercase mb-2">المصروفات</p>
//             {getTypeAccounts("مصروفات").map(acc => {
//               const bal = getAccountBalance(acc.id, acc.opening_balance || 0, acc.opening_balance_type || "مدين");
//               const val = Math.max(0, bal.net);
//               return val > 0 ? <SectionRow key={acc.id} label={acc.account_name} value={val} indent positive={false} /> : null;
//             })}
//             <SectionRow label="إجمالي المصروفات" value={expenses} bold positive={false} />
//           </div>
//           <div className={`mt-6 p-4 rounded-xl ${netIncome >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
//             <div className="flex justify-between items-center">
//               <span className="font-bold text-foreground text-lg">{netIncome >= 0 ? "صافي الربح" : "صافي الخسارة"}</span>
//               <span className={`font-bold text-2xl ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>{Math.abs(netIncome)?.toLocaleString("ar-SA")} ر.س</span>
//             </div>
//           </div>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//           {/* Assets */}
//           <div className="bg-card rounded-xl border border-border p-5">
//             <h3 className="font-bold text-foreground mb-4 text-center border-b border-border pb-2">الأصول</h3>
//             {["أصول متداولة","أصول ثابتة"].map(cat => {
//               const catAccs = getTypeAccounts("أصول").filter(a => a.account_category === cat);
//               if (catAccs.length === 0) return null;
//               const catTotal = catAccs.reduce((s, acc) => {
//                 const bal = getAccountBalance(acc.id, acc.opening_balance || 0, acc.opening_balance_type || "مدين");
//                 return s + Math.max(0, bal.net);
//               }, 0);
//               return (
//                 <div key={cat} className="mb-3">
//                   <p className="text-xs font-semibold text-muted-foreground mb-1">{cat}</p>
//                   {catAccs.map(acc => {
//                     const bal = getAccountBalance(acc.id, acc.opening_balance || 0, acc.opening_balance_type || "مدين");
//                     const val = Math.max(0, bal.net);
//                     return val > 0 ? <SectionRow key={acc.id} label={acc.account_name} value={val} indent /> : null;
//                   })}
//                   <SectionRow label={`إجمالي ${cat}`} value={catTotal} bold />
//                 </div>
//               );
//             })}
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-center">
//               <p className="text-xs text-muted-foreground">إجمالي الأصول</p>
//               <p className="text-xl font-bold text-blue-700">{assets?.toLocaleString("ar-SA")} ر.س</p>
//             </div>
//           </div>
//           {/* Liabilities + Equity */}
//           <div className="bg-card rounded-xl border border-border p-5">
//             <h3 className="font-bold text-foreground mb-4 text-center border-b border-border pb-2">الالتزامات وحقوق الملكية</h3>
//             <p className="text-xs font-semibold text-muted-foreground mb-1">الالتزامات</p>
//             {getTypeAccounts("التزامات").map(acc => {
//               const bal = getAccountBalance(acc.id, acc.opening_balance || 0, acc.opening_balance_type || "دائن");
//               const val = Math.max(0, -bal.net);
//               return val > 0 ? <SectionRow key={acc.id} label={acc.account_name} value={val} indent /> : null;
//             })}
//             <SectionRow label="إجمالي الالتزامات" value={liabilities} bold />
//             <p className="text-xs font-semibold text-muted-foreground mb-1 mt-4">حقوق الملكية</p>
//             {getTypeAccounts("حقوق الملكية").map(acc => {
//               const bal = getAccountBalance(acc.id, acc.opening_balance || 0, acc.opening_balance_type || "دائن");
//               const val = Math.max(0, -bal.net);
//               return val > 0 ? <SectionRow key={acc.id} label={acc.account_name} value={val} indent /> : null;
//             })}
//             {netIncome !== 0 && <SectionRow label={netIncome >= 0 ? "الأرباح المرحلة" : "الخسارة المرحلة"} value={Math.abs(netIncome)} indent positive={netIncome >= 0} />}
//             <SectionRow label="إجمالي حقوق الملكية" value={equity} bold />
//             <div className={`rounded-lg p-3 mt-4 text-center ${Math.abs(assets - (liabilities + equity)) < 1 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
//               <p className="text-xs text-muted-foreground">الالتزامات + حقوق الملكية</p>
//               <p className="text-xl font-bold text-foreground">{(liabilities + equity)?.toLocaleString("ar-SA")} ر.س</p>
//               {Math.abs(assets - (liabilities + equity)) < 1 && <p className="text-xs text-green-600 mt-1">✓ الميزانية متوازنة</p>}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Scale, RefreshCw, Loader2 } from "lucide-react";
import { getIncomeStatement, getBalanceSheet } from "@/api/accountingApi";

export default function FinancialStatements() {
  const [activeTab, setActiveTab] = useState("income");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  const [incomeData, setIncomeData] = useState({
    total_revenues: 0,
    total_expenses: 0,
    net_profit: 0,
    revenues: [],
    expenses: [],
  });

  const [balanceData, setBalanceData] = useState({
    assets_card: { assets_grouped: [], total_assets: 0 },
    commitments_property_rights_card: {
      commitments: [],
      total_commitments: 0,
      property_rights: [],
      total_property_rights: 0,
      total_commitments_and_property_rights: 0,
    },
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [income, balance] = await Promise.all([
        getIncomeStatement({ date_from: dateFrom, date_to: dateTo }),
        getBalanceSheet({ date_from: dateFrom, date_to: dateTo }),
      ]);
      setIncomeData(income || {});
      setBalanceData(balance || {});
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء تحميل القوائم المالية");
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n) => (n || 0).toLocaleString("ar-SA");

  const SectionRow = ({ label, value, bold, indent, positive }) => (
    <div
      className={`flex justify-between items-center py-2 ${indent ? "pr-6" : ""} ${
        bold ? "border-t border-border mt-2 pt-3" : "border-b border-border/30"
      }`}
    >
      <span className={`text-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span
        className={`text-sm font-medium ${bold ? "font-bold" : ""} ${
          positive === false ? "text-red-600" : positive === true ? "text-green-600" : "text-foreground"
        }`}
      >
        {fmt(value)} ر.س
      </span>
    </div>
  );

  const netIncome = incomeData?.net_profit || 0;

  const assetsGrouped = balanceData?.assets_card?.assets_grouped || [];
  const totalAssets = balanceData?.assets_card?.total_assets || 0;

  const commitments = balanceData?.commitments_property_rights_card?.commitments || [];
  const totalCommitments = balanceData?.commitments_property_rights_card?.total_commitments || 0;

  const propertyRights = balanceData?.commitments_property_rights_card?.property_rights || [];
  const totalPropertyRights = balanceData?.commitments_property_rights_card?.total_property_rights || 0;

  const totalLiabEquity =
    balanceData?.commitments_property_rights_card?.total_commitments_and_property_rights || 0;

  const isBalanced = Math.abs(totalAssets - Math.abs(totalLiabEquity)) < 1;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">القوائم المالية</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            تعتمد على القيود المرحلة وتصنيف شجرة الحسابات
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          تحديث
        </button>
      </div>

      {/* Date Filter */}
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "income", label: "قائمة الدخل", icon: TrendingUp },
          { id: "balance", label: "الميزانية العمومية", icon: Scale },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : activeTab === "income" ? (
        <div className="bg-card rounded-xl border border-border p-6 space-y-1">
          <h2 className="text-lg font-bold text-foreground text-center mb-6">قائمة الدخل</h2>

          <div className="mb-4">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">الإيرادات</p>
            {(incomeData.revenues || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">لا توجد إيرادات</p>
            ) : (
              incomeData.revenues.map((acc) => (
                <SectionRow
                  key={acc.account_id}
                  label={acc.account_name_ar || acc.account_name_en}
                  value={acc.balance}
                  indent
                  positive={true}
                />
              ))
            )}
            <SectionRow label="إجمالي الإيرادات" value={incomeData.total_revenues} bold positive={true} />
          </div>

          <div className="mb-4 mt-4">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-2">المصروفات</p>
            {(incomeData.expenses || []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">لا توجد مصروفات</p>
            ) : (
              incomeData.expenses.map((acc) => (
                <SectionRow
                  key={acc.account_id}
                  label={acc.account_name_ar || acc.account_name_en}
                  value={acc.balance}
                  indent
                  positive={false}
                />
              ))
            )}
            <SectionRow label="إجمالي المصروفات" value={incomeData.total_expenses} bold positive={false} />
          </div>

          <div
            className={`mt-6 p-4 rounded-xl ${
              netIncome >= 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-foreground text-lg">
                {netIncome >= 0 ? "صافي الربح" : "صافي الخسارة"}
              </span>
              <span className={`font-bold text-2xl ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                {fmt(Math.abs(netIncome))} ر.س
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Assets */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-4 text-center border-b border-border pb-2">
              الأصول
            </h3>
            {assetsGrouped.map((group) => {
              if (!group.accounts || group.accounts.length === 0) return null;
              return (
                <div key={group.subcategory} className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    {group.subcategory_label}
                  </p>
                  {group.accounts.map((acc) => (
                    <SectionRow
                      key={acc.account_id}
                      label={acc.account_name_ar || acc.account_name_en}
                      value={acc.balance}
                      indent
                    />
                  ))}
                  <SectionRow label={`إجمالي ${group.subcategory_label}`} value={group.total} bold />
                </div>
              );
            })}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4 text-center">
              <p className="text-xs text-muted-foreground">إجمالي الأصول</p>
              <p className="text-xl font-bold text-blue-700">{fmt(totalAssets)} ر.س</p>
            </div>
          </div>

          {/* Liabilities + Equity */}
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="font-bold text-foreground mb-4 text-center border-b border-border pb-2">
              الالتزامات وحقوق الملكية
            </h3>

            <p className="text-xs font-semibold text-muted-foreground mb-1">الالتزامات</p>
            {commitments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">لا توجد التزامات</p>
            ) : (
              commitments.map((acc) => (
                <SectionRow
                  key={acc.account_id}
                  label={acc.account_name_ar || acc.account_name_en}
                  value={Math.abs(acc.balance)}
                  indent
                />
              ))
            )}
            <SectionRow label="إجمالي الالتزامات" value={Math.abs(totalCommitments)} bold />

            <p className="text-xs font-semibold text-muted-foreground mb-1 mt-4">حقوق الملكية</p>
            {propertyRights.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">لا توجد حقوق ملكية</p>
            ) : (
              propertyRights.map((acc) => (
                <SectionRow
                  key={acc.account_id}
                  label={acc.account_name_ar || acc.account_name_en}
                  value={Math.abs(acc.balance)}
                  indent
                />
              ))
            )}
            <SectionRow label="إجمالي حقوق الملكية" value={Math.abs(totalPropertyRights)} bold />

            <div
              className={`rounded-lg p-3 mt-4 text-center ${
                isBalanced ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="text-xs text-muted-foreground">الالتزامات + حقوق الملكية</p>
              <p className="text-xl font-bold text-foreground">{fmt(Math.abs(totalLiabEquity))} ر.س</p>
              {isBalanced ? (
                <p className="text-xs text-green-600 mt-1">✓ الميزانية متوازنة</p>
              ) : (
                <p className="text-xs text-red-600 mt-1">⚠ الميزانية غير متوازنة</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}