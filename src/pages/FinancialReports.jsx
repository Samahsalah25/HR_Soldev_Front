// import { useState, useEffect } from "react";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
// import { BarChart2, RefreshCw, TrendingDown, DollarSign, Building2 } from "lucide-react";

// import {getFinancialReports} from "@/api/financeApi";
// const COLORS = ["#f97316","#8b5cf6","#06b6d4","#10b981","#f43f5e","#eab308","#3b82f6","#ec4899"];

// export default function FinancialReports() {
 
//   const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
//   const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
//   const [hideZero, setHideZero] = useState(true);

//   const [report, setReport] = useState(null);
// const [loading, setLoading] = useState(true);
//  const load = async () => {
//   setLoading(true);

//   try {
//     const data = await getFinancialReports({
//       dateFrom,
//       dateTo,
//       includeNoTransactions: true,
//     });

//     setReport(data);
//   } finally {
//     setLoading(false);
//   }
// };
//  useEffect(() => {
//   load();
// }, [dateFrom, dateTo]);;

//   const filteredEntries = entries.filter(e => {
//     const d = e.entry_date;
//     return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
//   });
// const kpis = report?.kpis || {};

// const trialRows = report?.live_balance_review || [];

// const totals = trialRows.reduce(
//   (acc, r) => ({
//     debit: acc.debit + (r.total_debit || 0),
//     credit: acc.credit + (r.total_credit || 0),
//     balDebit: acc.balDebit + (r.balance_debit || 0),
//     balCredit: acc.balCredit + (r.balance_credit || 0),
//   }),
//   { debit: 0, credit: 0, balDebit: 0, balCredit: 0 }
// );

// const isBalanced =
//   Math.abs(totals.balDebit - totals.balCredit) < 0.01;

// const expensePieData =
//   report?.allocation_operating_expenses || []
//     .map((acc) => ({
//       name: acc.account_name,
//       value: acc.amount,
//     }))
//     .slice(0, 8);

// const branchSalaryData =
//   report?.branch_salaries || [];
  
// return (
//   <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">

//     {/* Header */}
//     <div className="flex items-center justify-between">
//       <div>
//         <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
//           <BarChart2 className="w-6 h-6 text-primary" />
//           التقارير المالية
//         </h1>
//         <p className="text-sm text-muted-foreground mt-0.5">
//           تقرير مالي مباشر من API
//         </p>
//       </div>

//       <button
//         onClick={load}
//         className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"
//       >
//         <RefreshCw className="w-4 h-4" />
//         تحديث
//       </button>
//     </div>

//     {/* Date Filter */}
//     <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl px-4 py-3">

//       <div className="flex items-center gap-2 text-sm">
//         <label className="font-medium text-muted-foreground">من:</label>
//         <input
//           type="date"
//           value={dateFrom}
//           onChange={(e) => setDateFrom(e.target.value)}
//           className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background"
//         />
//       </div>

//       <div className="flex items-center gap-2 text-sm">
//         <label className="font-medium text-muted-foreground">إلى:</label>
//         <input
//           type="date"
//           value={dateTo}
//           onChange={(e) => setDateTo(e.target.value)}
//           className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background"
//         />
//       </div>

//       <span className="mr-auto text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
//         ✓ API Live Data
//       </span>

//     </div>

//     {/* KPI Cards */}
//     <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//       {[
//         {
//           label: "إجمالي الإيرادات",
//           value: kpis?.total_revenue || 0,
//           color: "text-green-600",
//         },
//         {
//           label: "إجمالي المصروفات",
//           value: kpis?.total_expenses || 0,
//           color: "text-red-600",
//         },
//         {
//           label: "إجمالي الأصول",
//           value: kpis?.total_assets || 0,
//           color: "text-blue-600",
//         },
//         {
//           label: "إجمالي الرواتب",
//           value: kpis?.total_monthly_salaries || 0,
//           color: "text-purple-600",
//         },
//       ].map((k) => (
//         <div key={k.label} className="bg-card rounded-xl border border-border p-4">
//           <p className={`text-xl font-bold ${k.color}`}>
//             {Number(k.value || 0).toLocaleString("ar-SA")} ر.س
//           </p>
//           <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
//         </div>
//       ))}
//     </div>

//     {/* Branch Salaries Chart */}
//     <div className="bg-card rounded-xl border border-border p-5">
//       <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
//         <Building2 className="w-4 h-4 text-primary" />
//         الرواتب حسب الفروع
//       </h3>

//       <ResponsiveContainer width="100%" height={240}>
//         <BarChart data={branch_salaries || []}>
//           <CartesianGrid strokeDasharray="3 3" />
//           <XAxis dataKey="name_ar" />
//           <YAxis />
//           <Tooltip />
//           <Bar dataKey="total_salaries" fill="#8b5cf6" />
//         </BarChart>
//       </ResponsiveContainer>
//     </div>

//     {/* Live Balance (FIXED TABLE) */}
//     <div className="bg-card rounded-xl border border-border overflow-hidden">
//       <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
//         <h3 className="font-semibold text-foreground flex items-center gap-2">
//           <BarChart2 className="w-4 h-4 text-primary" />
//           ميزان المراجعة (Live API)
//         </h3>

//         <span className="text-xs text-muted-foreground">
//           {live_balance_review?.length || 0} حساب
//         </span>
//       </div>

//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">

//           <thead>
//             <tr className="bg-muted/20 border-b border-border">
//               <th className="text-right px-4 py-2">رقم الحساب</th>
//               <th className="text-right px-4 py-2">اسم الحساب</th>
//               <th className="text-right px-4 py-2">النوع</th>
//               <th className="text-right px-4 py-2">مجموع مدين</th>
//               <th className="text-right px-4 py-2">مجموع دائن</th>
//               <th className="text-right px-4 py-2">رصيد مدين</th>
//               <th className="text-right px-4 py-2">رصيد دائن</th>
//             </tr>
//           </thead>

//           <tbody>
//             {live_balance_review?.length ? (
//               live_balance_review.map((r, i) => (
//                 <tr key={i} className="border-b border-border hover:bg-muted/20">

//                   <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
//                     {r.code}
//                   </td>

//                   <td className="px-4 py-2 font-medium">
//                     {r.name}
//                   </td>

//                   <td className="px-4 py-2">
//                     <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
//                       {r.type}
//                     </span>
//                   </td>

//                   <td className="px-4 py-2 text-blue-600">
//                     {Number(r.total_debit || 0).toLocaleString("ar-SA")}
//                   </td>

//                   <td className="px-4 py-2 text-red-500">
//                     {Number(r.total_credit || 0).toLocaleString("ar-SA")}
//                   </td>

//                   <td className="px-4 py-2 text-blue-700 font-semibold">
//                     {Number(r.debit_balance || 0).toLocaleString("ar-SA")}
//                   </td>

//                   <td className="px-4 py-2 text-red-600 font-semibold">
//                     {Number(r.credit_balance || 0).toLocaleString("ar-SA")}
//                   </td>

//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="7" className="text-center py-6 text-muted-foreground">
//                   لا توجد بيانات
//                 </td>
//               </tr>
//             )}
//           </tbody>

//         </table>
//       </div>
//     </div>

//   </div>
// );
// }

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { BarChart2, RefreshCw, Building2 } from "lucide-react";
import { getFinancialReports } from "@/api/financeApi";

const COLORS = [
  "#f97316",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f43f5e",
  "#eab308",
  "#3b82f6",
  "#ec4899",
];

export default function FinancialReports() {
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10)
  );

  const [dateTo, setDateTo] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFinancialReports({
        dateFrom,
        dateTo,
        includeNoTransactions: true,
      });
      setReport(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [dateFrom, dateTo]);

  const kpis = report?.kpis || {};
  const branch_salaries = report?.branch_salaries || [];
  const live_balance_review = report?.live_balance_review || [];
  const allocation = report?.allocation_operating_expenses || [];

  // 🔥 مهم: إصلاح مشكلة الفاضي
  const expensePieData = allocation
    .filter((x) => Number(x.amount) > 0) // لو كله صفر هيتصفى
    .map((acc) => ({
      name: acc.name,
      value: acc.amount,
    }));

  const hasExpenses = expensePieData.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-primary" />
            التقارير المالية
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            تقرير مالي مباشر من API
          </p>
        </div>

        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"
        >
          <RefreshCw className="w-4 h-4" />
          تحديث
        </button>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap gap-3 items-center bg-card border border-border rounded-xl px-4 py-3">

        <div className="flex items-center gap-2 text-sm">
          <label className="font-medium text-muted-foreground">من:</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <label className="font-medium text-muted-foreground">إلى:</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1.5 text-sm border border-border rounded-lg bg-background"
          />
        </div>

        <span className="mr-auto text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
          ✓ API Live Data
        </span>

      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "إجمالي الإيرادات",
            value: kpis?.total_revenue || 0,
            color: "text-green-600",
          },
          {
            label: "إجمالي المصروفات",
            value: kpis?.total_expenses || 0,
            color: "text-red-600",
          },
          {
            label: "إجمالي الأصول",
            value: kpis?.total_assets || 0,
            color: "text-blue-600",
          },
          {
            label: "إجمالي الرواتب",
            value: kpis?.total_monthly_salaries || 0,
            color: "text-purple-600",
          },
        ].map((k) => (
          <div key={k.label} className="bg-card rounded-xl border border-border p-4">
            <p className={`text-xl font-bold ${k.color}`}>
              {Number(k.value || 0).toLocaleString("ar-SA")} ر.س
            </p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Branch Salaries */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          الرواتب حسب الفروع
        </h3>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={branch_salaries}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name_ar" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total_salaries" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Expenses Pie */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-4">
          توزيع المصروفات التشغيلية
        </h3>

        {hasExpenses ? (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={expensePieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {expensePieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-10">
            لا توجد مصروفات فعلية (كل القيم = 0)
          </div>
        )}
      </div>

      {/* Live Balance */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">

        <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            ميزان المراجعة (Live API)
          </h3>

          <span className="text-xs text-muted-foreground">
            {live_balance_review.length} حساب
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr className="bg-muted/20 border-b border-border">
                <th className="text-right px-4 py-2">رقم الحساب</th>
                <th className="text-right px-4 py-2">اسم الحساب</th>
                <th className="text-right px-4 py-2">النوع</th>
                <th className="text-right px-4 py-2">مجموع مدين</th>
                <th className="text-right px-4 py-2">مجموع دائن</th>
                <th className="text-right px-4 py-2">رصيد مدين</th>
                <th className="text-right px-4 py-2">رصيد دائن</th>
              </tr>
            </thead>

            <tbody>
              {live_balance_review.length ? (
                live_balance_review.map((r, i) => (
                  <tr key={i} className="border-b border-border hover:bg-muted/20">

                    <td className="px-4 py-2">{r.code}</td>
                    <td className="px-4 py-2">{r.name}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-blue-600">
                      {Number(r.total_debit || 0).toLocaleString("ar-SA")}
                    </td>
                    <td className="px-4 py-2 text-red-500">
                      {Number(r.total_credit || 0).toLocaleString("ar-SA")}
                    </td>
                    <td className="px-4 py-2 text-blue-700 font-semibold">
                      {Number(r.debit_balance || 0).toLocaleString("ar-SA")}
                    </td>
                    <td className="px-4 py-2 text-red-600 font-semibold">
                      {Number(r.credit_balance || 0).toLocaleString("ar-SA")}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-muted-foreground">
                    لا توجد بيانات
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}