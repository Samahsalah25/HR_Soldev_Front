import { useState, useEffect } from "react";
import { Download, CheckCircle, FileText, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useRole } from "../lib/useRole";
import { canDo } from "../lib/crudPermissions";
import { calcPayslip, calcGOSI_Saudi, calcGOSI_NonSaudi, formatCurrency, EXPAT_LEVY } from "../lib/hrUtils";

export default function Payroll() {
  const { user } = useRole();
  const canApprove = canDo(user, "payroll", "approve");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payslips, setPayslips] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("payroll");

  const loadPayroll = async () => {
    setLoading(true);
    const [emps, lns, deductions, bonuses] = await Promise.all([
      base44.entities.Employee.filter({ status: "نشط" }),
      base44.entities.Loan.filter({ status: "نشطة" }),
      base44.entities.Deduction.filter({ month }),
      base44.entities.Bonus.filter({ period: month }),
    ]);
    setEmployees(emps);
    generatePayslips(emps, lns, deductions, bonuses);
    setLoading(false);
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
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 text-sm font-medium">
            <Download className="w-4 h-4" />WPS
          </button>
          {canApprove && <button onClick={async () => {
            const accounts = await base44.entities.AccountChart.list();
            const salaryAcc = accounts.find(a => (a.account_name?.includes("رواتب") || a.account_name?.includes("أجور")) && !a.is_parent);
            const bankAcc = accounts.find(a => (a.account_name?.includes("بنك") || a.account_name?.includes("صندوق")) && !a.is_parent);
            if (!salaryAcc || !bankAcc) { alert("يرجى إنشاء حسابات الرواتب والبنك في دليل الحسابات أولاً"); return; }
            const user = await base44.auth.me();
            const netTotal = payslips.reduce((s, p) => s + p.netSalary, 0);
            await base44.entities.JournalEntry.create({
              entry_number: `JE-SAL-${month.replace("-","")}`,
              entry_date: new Date().toISOString().slice(0,10),
              description: `قيد رواتب شهر ${month} — ${employees.length} موظف`,
              lines: [
                { account_id: salaryAcc.id, account_code: salaryAcc.account_code, account_name: salaryAcc.account_name, debit: netTotal, credit: 0, description: `رواتب ${month}` },
                { account_id: bankAcc.id, account_code: bankAcc.account_code, account_name: bankAcc.account_name, debit: 0, credit: netTotal, description: `صرف رواتب ${month}` },
              ],
              total_debit: netTotal, total_credit: netTotal,
              status: "مرحل", source: "رواتب",
              posted_by: user.full_name || user.email,
              posted_date: new Date().toISOString().slice(0,10),
            });
            alert(`✅ تم ترحيل قيد الرواتب بمبلغ ${netTotal.toLocaleString("ar-SA")} ريال`);
          }} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />ترحيل قيد الرواتب
          </button>}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الاستحقاقات", value: formatCurrency(totals.earnings), color: "text-primary" },
          { label: "خصومات GOSI (موظفون)", value: formatCurrency(totals.gosiEmp), color: "text-amber-600" },
          { label: "اشتراك GOSI (صاحب العمل)", value: formatCurrency(totals.gosiEmployer), color: "text-orange-600" },
          { label: "صافي الرواتب", value: formatCurrency(totals.net), color: "text-secondary" },
        ].map(card => (
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
                  {["الموظف", "الجنسية", "الأساسي", "البدلات", "الإجمالي", "GOSI موظف", "الخصومات", "الصافي", "مخصص ن.خدمة"].map(h => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                ) : payslips.map(({ emp, loanDeduction, extraDeduction, bonusTotal, empDeductions, empBonuses, totalEarnings, gosiEmployee, gosiEmployer, absenceDeduction, lateDeduction, totalDeductions, netSalary, eosMonthlyProvision }) => {
                  const allowances = totalEarnings - (emp.basic_salary || 0);
                  return (
                    <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer"
                      onClick={() => setSelected({ emp, loanDeduction, extraDeduction, bonusTotal, empDeductions, empBonuses, totalEarnings, gosiEmployee, gosiEmployer, absenceDeduction, lateDeduction, totalDeductions, netSalary, eosMonthlyProvision })}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{emp.full_name_ar}</p>
                          <p className="text-xs text-muted-foreground">{emp.job_title}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emp.is_saudi ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                          {emp.is_saudi ? "سعودي" : "مقيم"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(emp.basic_salary)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatCurrency(allowances)}</td>
                      <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(totalEarnings)}</td>
                      <td className="px-4 py-3 text-amber-600">({formatCurrency(gosiEmployee)})</td>
                      <td className="px-4 py-3 text-red-600">
                        ({formatCurrency(totalDeductions)})
                        {loanDeduction > 0 && <p className="text-xs text-orange-500">سلفة: {formatCurrency(loanDeduction)}</p>}
                        {extraDeduction > 0 && <p className="text-xs text-red-400">خصومات: {formatCurrency(extraDeduction)}</p>}
                        {bonusTotal > 0 && <p className="text-xs text-green-500">+ مكافأة: {formatCurrency(bonusTotal)}</p>}
                      </td>
                      <td className="px-4 py-3 font-bold text-secondary">{formatCurrency(netSalary)}</td>
                      <td className="px-4 py-3 text-purple-600">{formatCurrency(eosMonthlyProvision)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-primary/5 border-t-2 border-primary/20">
                  <td colSpan={4} className="px-4 py-3 font-bold text-foreground">الإجمالي</td>
                  <td className="px-4 py-3 font-bold text-foreground">{formatCurrency(totals.earnings)}</td>
                  <td className="px-4 py-3 font-bold text-amber-600">({formatCurrency(totals.gosiEmp)})</td>
                  <td className="px-4 py-3 font-bold text-red-600">—</td>
                  <td className="px-4 py-3 font-bold text-secondary">{formatCurrency(totals.net)}</td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {activeTab === "gosi" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                🇸🇦 الموظفون السعوديون ({saudis.length})
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>الموظف (9% أساسي + سكن)</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(saudis.reduce((s, e) => s + calcGOSI_Saudi(e.basic_salary || 0, e.housing_allowance || 0).employeeDeduction, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>صاحب العمل (11.75%)</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(saudis.reduce((s, e) => s + calcGOSI_Saudi(e.basic_salary || 0, e.housing_allowance || 0).employerContribution, 0))}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
                🌍 الموظفون المقيمون ({nonSaudis.length})
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>الموظف (2% أخطار مهنية)</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(nonSaudis.reduce((s, e) => s + calcGOSI_NonSaudi(e.basic_salary || 0).employeeDeduction, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>صاحب العمل (2%)</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(nonSaudis.reduce((s, e) => s + calcGOSI_NonSaudi(e.basic_salary || 0).employerContribution, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground border-t border-border pt-2 mt-2">
                  <span>رسوم العمالة الوافدة (400×{nonSaudis.length})</span>
                  <span className="font-bold text-orange-600">{formatCurrency(totalExpatLevy)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1 flex items-center gap-2"><Info className="w-4 h-4" />ملاحظة نظامية</p>
            <p>وعاء اشتراك GOSI للسعودي: الراتب الأساسي + بدل السكن. للمقيم: الراتب الأساسي فقط. المرجع: لوائح GOSI المحدّثة 2024.</p>
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground">ملخص التكاليف الشاملة للشهر</h3>
          <div className="space-y-3">
            {[
              { label: "إجمالي الرواتب", value: totals.earnings, color: "text-foreground" },
              { label: "اشتراكات GOSI على صاحب العمل", value: totals.gosiEmployer, color: "text-orange-600" },
              { label: "رسوم العمالة الوافدة", value: totalExpatLevy, color: "text-red-600" },
              { label: "إجمالي التكلفة الفعلية", value: totals.earnings + totals.gosiEmployer + totalExpatLevy, color: "text-primary font-bold" },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm ${item.color}`}>{formatCurrency(item.value)}</span>
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
              <h3 className="font-bold text-foreground">قسيمة راتب — {selected.emp.full_name_ar}</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-muted">✕</button>
            </div>
            <div className="p-6 space-y-1">
              <p className="text-xs text-muted-foreground mb-3">شهر: {month} | {selected.emp.job_title}</p>
              <Row label="الراتب الأساسي" val={formatCurrency(selected.emp.basic_salary)} />
              <Row label="بدل السكن" val={formatCurrency(selected.emp.housing_allowance)} />
              <Row label="بدل النقل" val={formatCurrency(selected.emp.transport_allowance)} />
              <Row label="بدل الغذاء" val={formatCurrency(selected.emp.food_allowance)} />
              <Row label="بدل الاتصالات" val={formatCurrency(selected.emp.communication_allowance)} />
              <Row label="بدلات أخرى" val={formatCurrency(selected.emp.other_allowances)} />
              {selected.bonusTotal > 0 && <Row label="مكافآت الشهر" val={`+${formatCurrency(selected.bonusTotal)}`} green />}
              <div className="border-t border-border pt-2 mt-2">
                <Row label="إجمالي الاستحقاقات" val={formatCurrency(selected.totalEarnings + (selected.bonusTotal || 0))} bold />
              </div>
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between py-1.5 text-xs text-green-700 bg-green-50 rounded px-2 mb-1">
                  <span>GOSI — تتحملها الشركة كاملاً</span>
                  <span className="font-medium">{formatCurrency(selected.gosiEmployer)}</span>
                </div>
                <Row label="خصم الغياب" val={`(${formatCurrency(selected.absenceDeduction)})`} red />
                <Row label="خصم التأخير" val={`(${formatCurrency(selected.lateDeduction)})`} red />
                {selected.loanDeduction > 0 && <Row label="خصم قسط السلفة" val={`(${formatCurrency(selected.loanDeduction)})`} red />}
                {selected.empDeductions?.map(d => (
                  <Row key={d.id} label={`${d.deduction_type} — ${d.reason?.slice(0, 20) || ""}`} val={`(${formatCurrency(d.amount)})`} red />
                ))}
                <Row label="إجمالي الخصومات" val={`(${formatCurrency(selected.totalDeductions)})`} bold red />
              </div>
              <div className="border-t-2 border-primary/30 pt-3 mt-3 bg-primary/5 rounded-lg px-3 py-2">
                <Row label="صافي الراتب" val={formatCurrency(selected.netSalary + (selected.bonusTotal || 0))} bold green />
              </div>
              <p className="text-xs text-muted-foreground pt-2">مخصص نهاية الخدمة: {formatCurrency(selected.eosMonthlyProvision)} / شهر</p>
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