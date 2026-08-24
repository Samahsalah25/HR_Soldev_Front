import { useState, useEffect } from "react";
import { Download, CheckCircle, FileText, Info } from "lucide-react";
import { useRole } from "../lib/useRole";
import { calcPayslip, formatCurrency, EXPAT_LEVY } from "../lib/hrUtils";
import {
  getInsuranceKPIs,
  getInsuranceDashboard,
  getGosiInsurance,
  getCostSummary,
    postSalaryEntry,
  downloadWPS,
} from "@/api/financeApi";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";



export default function Payroll() {
   const { toast } = useToast();

  const confirmDialog = useConfirm();
  const { user, canDo } = useRole();
  const canApprove = canDo("payroll", "approve");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
 
const [kpis, setKpis] = useState({});
const [payslips, setPayslips] = useState([]);
const [gosiInsurance, setGosiInsurance] = useState({});
const [costSummary, setCostSummary] = useState({});

  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("payroll");

const loadPayroll = async () => {
  try {
    setLoading(true);
    const [kpisData, dashboardData, gosiData, costData] = await Promise.all([
      getInsuranceKPIs(month),
      getInsuranceDashboard(month),
      getGosiInsurance(month),
      getCostSummary(month),
    ]);
    setKpis(kpisData);
    setPayslips(dashboardData);
    setGosiInsurance(gosiData);
    setCostSummary(costData);
  } catch (err) {
    console.error("Load payroll error:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { loadPayroll(); }, [month]);

  const generatePayslips = (emps, activeLoans = [], deductions = [], bonuses = []) => {
    const slips = emps.map(emp => {
      const empLoan = activeLoans.find(l => l.employee_id === emp.id);
      const loanDeduction = empLoan ? (empLoan.monthly_deduction || 0) : 0;
      const empDeductions = deductions.filter(d => d.employee_id === emp.id && d.status === "معتمد");
      const extraDeduction = empDeductions.reduce((s, d) => s + (d.amount || 0), 0);
      const empBonuses = bonuses.filter(b => b.employee_id === emp.id && b.status === "معتمدة");
      const bonusTotal = empBonuses.reduce((s, b) => s + (b.amount || 0), 0);
      return { emp, loanDeduction, empLoan, extraDeduction, bonusTotal, empDeductions, empBonuses, ...calcPayslip(emp, 0, 0, 0, loanDeduction + extraDeduction) };
    });
    setPayslips(slips);
  };

  const totals = payslips.reduce((acc, p) => ({
    earnings: acc.earnings + p.totalEarnings,
    gosiEmp: acc.gosiEmp + p.gosiEmployee,
    gosiEmployer: acc.gosiEmployer + p.gosiEmployer,
    net: acc.net + p.netSalary,
  }), { earnings: 0, gosiEmp: 0, gosiEmployer: 0, net: 0 });

  const saudis = employees.filter(e => e.is_saudi);
  const nonSaudis = employees.filter(e => !e.is_saudi);
  const totalExpatLevy = nonSaudis.length * EXPAT_LEVY;
  const payslipsPagination = usePagination(payslips, 20);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الرواتب والتأمينات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">محاسبة وفق نظام GOSI ونظام العمل السعودي</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
        <button
  onClick={async () => {
    try {
      const blob = await downloadWPS(month);

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `WPS-${month}.csv`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast({
        title: "خطأ",
        description: "فشل تحميل ملف WPS",
        variant: "destructive",
      });
    }
  }}
  className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 text-sm font-medium"
>
  <Download className="w-4 h-4" />
  WPS
</button>
{canApprove && (
  <button
    onClick={async () => {
      const ok = await confirmDialog({
        title: "ترحيل قيد الرواتب",
        message: `هل أنت متأكد من ترحيل قيد رواتب شهر ${month}؟ لا يمكن التراجع عن هذا الإجراء بعد الترحيل.`,
        confirmText: "ترحيل",
        variant: "destructive",
      });
      if (!ok) return;

      try {
        const res = await postSalaryEntry(month);

       toast({
  title: "تم ترحيل القيد بنجاح ✅",
  description: `رقم القيد: ${res.data.name} — إجمالي القيد: ${res.data.total_debit.toLocaleString("ar-SA")} ريال`,
});
        // إعادة تحميل البيانات بعد الترحيل
        loadPayroll();
      } catch (err) {
        console.error(err);

        const error =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          "حدث خطأ أثناء ترحيل قيد الرواتب.";

        if (error.includes("already been posted")) {
          toast({
            title: "خطأ",
            description: "ℹ️ تم ترحيل رواتب هذا الشهر مسبقًا.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "خطأ",
          description: error,
          variant: "destructive",
        });
      }
    }}
    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
  >
    <CheckCircle className="w-4 h-4" />
    ترحيل قيد الرواتب
  </button>
)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { id: "payroll", label: "كشف الرواتب" },
          { id: "gosi", label: "التأمينات GOSI" },
          { id: "summary", label: "ملخص التكاليف" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
  {/* Summary Cards */}
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {[
    {
      label: "إجمالي الاستحقاقات",
      value: formatCurrency(kpis?.total_entitlements || 0),
      color: "text-primary",
    },
    {
      label: "خصومات GOSI (موظفون)",
      value: formatCurrency(kpis?.gosi_employee_deductions || 0),
      color: "text-amber-600",
    },
    {
      label: "اشتراك GOSI (صاحب العمل)",
      value: formatCurrency(kpis?.gosi_employer_subscriptions || 0),
      color: "text-orange-600",
    },
    {
      label: "صافي الرواتب",
      value: formatCurrency(kpis?.total_net_salaries || 0),
      color: "text-secondary",
    },
  ].map((card) => (
    <div key={card.label} className="bg-card rounded-xl border border-border p-4">
      <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
      <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
    </div>
  ))}
</div>

     {activeTab === "payroll" && (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/20">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <FileText className="w-4 h-4 text-primary" />
        كشف رواتب شهر {month}
      </h3>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {[
              "الموظف",
              "الجنسية",
              "الأساسي",
              "البدلات",
              "الإجمالي",
              "GOSI موظف",
              "الخصومات",
              "الصافي",
              "مخصص ن.خدمة",
            ].map((h) => (
              <th
                key={h}
                className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9} className="text-center py-10 text-muted-foreground">
                جاري التحميل...
              </td>
            </tr>
          ) : (
            payslipsPagination.pageItems.map((item) => (
              <tr
                key={item.employee.id}
                className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
                onClick={() => setSelected(item)}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {item.employee.name_ar || item.employee.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.employee.job_title}
                    </p>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.category === "مواطن"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.category}
                  </span>
                </td>

                <td className="px-4 py-3 font-medium">
                  {formatCurrency(item.wage)}
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {formatCurrency(item.total_allowances)}
                </td>

                <td className="px-4 py-3 font-semibold text-foreground">
                  {formatCurrency(item.total)}
                </td>

                <td className="px-4 py-3 text-amber-600">
                  ({formatCurrency(item.gosi_employee)})
                </td>

                <td className="px-4 py-3 text-red-600">
                  {item.deduction_amount > 0 ? (
                    <>
                      ({formatCurrency(item.deduction_amount)})
                      <p className="text-xs text-orange-500">
                        {item.deduction}
                      </p>
                    </>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-4 py-3 font-bold text-secondary">
                  {formatCurrency(item.net)}
                </td>

                <td className="px-4 py-3 text-purple-600">
                  {formatCurrency(item.eos_provision)}
                </td>
              </tr>
            ))
          )}
        </tbody>

        <tfoot>
          <tr className="bg-primary/5 border-t-2 border-primary/20">
            <td colSpan={4} className="px-4 py-3 font-bold text-foreground">
              الإجمالي
            </td>

            <td className="px-4 py-3 font-bold text-foreground">
              {formatCurrency(kpis?.total_entitlements || 0)}
            </td>

            <td className="px-4 py-3 font-bold text-amber-600">
              ({formatCurrency(kpis?.gosi_employee_deductions || 0)})
            </td>

            <td className="px-4 py-3 font-bold text-red-600">
              —
            </td>

            <td className="px-4 py-3 font-bold text-secondary">
              {formatCurrency(kpis?.total_net_salaries || 0)}
            </td>

            <td />
          </tr>
        </tfoot>
      </table>
    </div>
    <TablePagination
      page={payslipsPagination.page}
      totalPages={payslipsPagination.totalPages}
      totalItems={payslipsPagination.totalItems}
      pageSize={payslipsPagination.pageSize}
      onPageChange={payslipsPagination.setPage}
    />
  </div>
)}

     {activeTab === "gosi" && (
  <div className="space-y-4">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* السعوديين */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
          🇸🇦 الموظفون السعوديون ({gosiInsurance?.saudi?.count || 0})
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>الموظف (GOSI)</span>
            <span className="font-medium text-foreground">
              {formatCurrency(gosiInsurance?.saudi?.employee_gosi || 0)}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>صاحب العمل (GOSI)</span>
            <span className="font-medium text-foreground">
              {formatCurrency(gosiInsurance?.saudi?.employer_gosi || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* المقيمين */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
          🌍 الموظفون المقيمون ({gosiInsurance?.resident?.count || 0})
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>الموظف (أخطار مهنية)</span>
            <span className="font-medium text-foreground">
              {formatCurrency(gosiInsurance?.resident?.employee_ohs || 0)}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span>صاحب العمل (أخطار مهنية)</span>
            <span className="font-medium text-foreground">
              {formatCurrency(gosiInsurance?.resident?.employer_ohs || 0)}
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground border-t border-border pt-2 mt-2">
            <span>رسوم العمالة الوافدة</span>
            <span className="font-bold text-orange-600">
              {formatCurrency(gosiInsurance?.resident?.expatriate_fees || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
      <p className="font-semibold mb-1 flex items-center gap-2">
        <Info className="w-4 h-4" />
        ملاحظة نظامية
      </p>
      <p>
        البيانات المعروضة تم احتسابها تلقائياً بواسطة نظام الرواتب وفق
        قواعد التأمينات الاجتماعية (GOSI).
      </p>
    </div>
  </div>
)}

     {activeTab === "summary" && (
  <div className="bg-card rounded-xl border border-border p-5 space-y-4">
    <h3 className="font-semibold text-foreground">
      ملخص التكاليف الشاملة للشهر
    </h3>

    <div className="space-y-3">
      {[
        {
          label: "إجمالي الرواتب",
          value: costSummary?.total_salaries || 0,
          color: "text-foreground",
        },
        {
          label: "اشتراكات GOSI على صاحب العمل",
          value: costSummary?.employer_gosi || 0,
          color: "text-orange-600",
        },
        {
          label: "رسوم العمالة الوافدة",
          value: costSummary?.expatriate_fees || 0,
          color: "text-red-600",
        },
        {
          label: "إجمالي التكلفة الفعلية",
          value: costSummary?.total_actual_cost || 0,
          color: "text-primary font-bold",
        },
      ].map((item) => (
        <div
          key={item.label}
          className="flex justify-between items-center py-2 border-b border-border last:border-0"
        >
          <span className="text-sm text-muted-foreground">
            {item.label}
          </span>

          <span className={`text-sm ${item.color}`}>
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  </div>
)}

      {/* Payslip Modal */}
    {selected && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
    <div className="bg-card rounded-2xl border border-border w-full max-w-md shadow-2xl">

      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h3 className="font-bold text-foreground">
          قسيمة راتب — {selected.employee.name_ar || selected.employee.name}
        </h3>

        <button
          onClick={() => setSelected(null)}
          className="p-2 rounded-lg hover:bg-muted"
        >
          ✕
        </button>
      </div>

      <div className="p-6 space-y-2">

        <p className="text-xs text-muted-foreground mb-3">
          شهر: {month} | {selected.employee.job_title}
        </p>

        <Row
          label="الراتب الأساسي"
          val={formatCurrency(selected.wage)}
        />

        <Row
          label="إجمالي البدلات"
          val={formatCurrency(selected.total_allowances)}
        />

        <Row
          label="إجمالي الاستحقاقات"
          val={formatCurrency(selected.total)}
          bold
        />

        <Row
          label="GOSI الموظف"
          val={formatCurrency(selected.gosi_employee)}
          red
        />

        <Row
          label="GOSI صاحب العمل"
          val={formatCurrency(selected.gosi_employer)}
        />

        <Row
          label="الخصومات"
          val={selected.deduction || "—"}
          red
        />

        <Row
          label="قيمة الخصومات"
          val={formatCurrency(selected.deduction_amount)}
          red
        />

        <div className="border-t-2 border-primary/30 pt-3 mt-3 bg-primary/5 rounded-lg px-3 py-2">
          <Row
            label="صافي الراتب"
            val={formatCurrency(selected.net)}
            bold
            green
          />
        </div>

        <p className="text-xs text-muted-foreground pt-2">
          مخصص نهاية الخدمة: {formatCurrency(selected.eos_provision)}
        </p>

      </div>

    </div>
  </div>
)}
    </div>
  );
}

function Row({ label, val, bold, red, green }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${bold ? "font-bold" : "font-medium"} ${red ? "text-red-600" : green ? "text-secondary" : "text-foreground"}`}>{val}</span>
    </div>
  );
}