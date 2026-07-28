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
    assets_card: { accounts: [], total_assets: 0 },
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

  const assets = balanceData?.assets_card?.accounts || [];
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
                  label={acc.account_name}
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
                  label={acc.account_name}
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
            {assets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">لا توجد أصول</p>
            ) : (
              assets.map((acc) => (
                <SectionRow
                  key={acc.account_id}
                  label={acc.account_name}
                  value={acc.balance}
                  indent
                />
              ))
            )}
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
                  label={acc.account_name}
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
                  label={acc.account_name}
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