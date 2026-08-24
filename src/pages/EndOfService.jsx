import { useState, useEffect } from "react";
import { Calculator, TrendingDown, CheckCircle, Info } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { calcEndOfService, calcLeaveEncashment, calcServiceYears, formatCurrency } from "../lib/hrUtils";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

const TERMINATION_TYPES = [
  "إنهاء من صاحب العمل",
  "استقالة",
  "عدم تجديد بقرار العامل",
  "انتهاء بالاتفاق",
];

export default function EndOfService() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [terminationType, setTerminationType] = useState("إنهاء من صاحب العمل");
  const [lastMonthDays, setLastMonthDays] = useState(30);
  const [result, setResult] = useState(null);

  useEffect(() => {
    base44.entities.Employee.list().then(emps => { setEmployees(emps); setLoading(false); });
  }, []);

  const calculate = () => {
    if (!selected) return;
    const years = calcServiceYears(selected.join_date);
    const eos = calcEndOfService(selected.basic_salary || 0, years, terminationType, selected.contract_type);
    const leaveBalance = selected.annual_leave_balance || 0;
    const leaveEncash = calcLeaveEncashment(selected.basic_salary || 0, selected.housing_allowance || 0, leaveBalance);
    const lastMonthSalary = ((selected.basic_salary || 0) + (selected.housing_allowance || 0) +
      (selected.transport_allowance || 0) + (selected.food_allowance || 0)) / 30 * lastMonthDays;

    const total = eos.finalReward + leaveEncash + lastMonthSalary;

    setResult({
      emp: selected,
      years,
      eos,
      leaveBalance,
      leaveEncash,
      lastMonthSalary,
      total,
    });
  };

  const activeEmployees = employees.filter(e => e.status !== "مُنهي الخدمة");
  const eosPagination = usePagination(activeEmployees, 20);

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">نهاية الخدمة</h1>
        <p className="text-sm text-muted-foreground mt-0.5">احتساب المستحقات وفق المادة 84 من نظام العمل السعودي</p>
      </div>

      {/* Reference Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2 flex items-center gap-2"><Info className="w-4 h-4" />المرجع القانوني — المادة 84 من نظام العمل</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-semibold mb-1">إنهاء من صاحب العمل (غير محدد):</p>
            <p>• أقل من سنتين: لا يستحق</p>
            <p>• 2-5 سنوات: نصف الأجر / سنة</p>
            <p>• 5 سنوات فأكثر: أجر شهر كامل / سنة</p>
          </div>
          <div>
            <p className="font-semibold mb-1">استقالة (غير محدد):</p>
            <p>• أقل من سنتين: لا يستحق</p>
            <p>• 2-5 سنوات: ثلث المكافأة</p>
            <p>• 5-10 سنوات: ثلثا المكافأة</p>
            <p>• 10 سنوات فأكثر: المكافأة كاملة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4 text-primary" />حاسبة نهاية الخدمة
          </h3>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">الموظف</label>
            <select value={selected?.id || ""} onChange={e => { setSelected(employees.find(emp => emp.id === e.target.value) || null); setResult(null); }}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              <option value="">اختر الموظف...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name_ar} — {e.department}</option>)}
            </select>
          </div>

          {selected && (
            <div className="bg-muted/40 rounded-lg p-3 text-xs space-y-1 text-muted-foreground">
              <p>الراتب الأساسي: <span className="font-semibold text-foreground">{formatCurrency(selected.basic_salary)}</span></p>
              <p>تاريخ المباشرة: <span className="font-semibold text-foreground">{selected.join_date ? new Date(selected.join_date).toLocaleDateString("ar-SA") : "—"}</span></p>
              <p>سنوات الخدمة: <span className="font-semibold text-foreground">{calcServiceYears(selected.join_date || "").toFixed(2)}</span></p>
              <p>نوع العقد: <span className="font-semibold text-foreground">{selected.contract_type}</span></p>
              <p>رصيد الإجازات: <span className="font-semibold text-foreground">{selected.annual_leave_balance || 0} يوم</span></p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">سبب إنهاء الخدمة</label>
            <select value={terminationType} onChange={e => { setTerminationType(e.target.value); setResult(null); }}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
              {TERMINATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">أيام العمل في الشهر الأخير</label>
            <input type="number" min={1} max={31} value={lastMonthDays} onChange={e => setLastMonthDays(+e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <button onClick={calculate} disabled={!selected}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2">
            <Calculator className="w-4 h-4" />احتساب المستحقات
          </button>
        </div>

        {/* Result */}
        {result ? (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-secondary" />التسوية النهائية — {result.emp.full_name_ar}
            </h3>

            <div className="space-y-2">
              {[
                { label: "مكافأة نهاية الخدمة", value: result.eos.finalReward, note: `${result.years.toFixed(2)} سنة` },
                { label: "تصفية رصيد الإجازات", value: result.leaveEncash, note: `${result.leaveBalance} يوم` },
                { label: `راتب ${result.lastMonthDays > 0 ? result.lastMonthDays : 0} يوم آخر شهر`, value: result.lastMonthSalary, note: null },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2 border-b border-border">
                  <div>
                    <p className="text-sm text-foreground">{item.label}</p>
                    {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                  </div>
                  <span className="font-semibold text-foreground">{formatCurrency(item.value)}</span>
                </div>
              ))}
              <div className="bg-secondary/10 rounded-lg p-3 flex justify-between items-center">
                <span className="font-bold text-foreground">إجمالي المستحقات</span>
                <span className="text-xl font-bold text-secondary">{formatCurrency(result.total)}</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
              <p>المكافأة الكاملة المحتسبة: {formatCurrency(result.eos.fullReward)}</p>
              <p>المكافأة المستحقة بعد التعديل ({terminationType}): {formatCurrency(result.eos.finalReward)}</p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">اختر موظفاً واضغط "احتساب المستحقات"</p>
            </div>
          </div>
        )}
      </div>

      {/* All Employees EOS Summary */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <h3 className="font-semibold text-foreground">ملخص مخصصات نهاية الخدمة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                {["الموظف", "تاريخ المباشرة", "سنوات الخدمة", "الراتب الأساسي", "المكافأة التراكمية", "المخصص الشهري"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              ) : eosPagination.pageItems.map(emp => {
                const years = emp.join_date ? calcServiceYears(emp.join_date) : 0;
                const totalEOS = (emp.basic_salary || 0) * years;
                const monthlyProv = (emp.basic_salary || 0) / 12;
                return (
                  <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{emp.full_name_ar}</p>
                      <p className="text-xs text-muted-foreground">{emp.department}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{emp.join_date ? new Date(emp.join_date).toLocaleDateString("ar-SA") : "—"}</td>
                    <td className="px-4 py-3 font-medium">{years.toFixed(2)} سنة</td>
                    <td className="px-4 py-3">{formatCurrency(emp.basic_salary)}</td>
                    <td className="px-4 py-3 font-bold text-primary">{formatCurrency(totalEOS)}</td>
                    <td className="px-4 py-3 text-purple-600">{formatCurrency(monthlyProv)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={eosPagination.page}
          totalPages={eosPagination.totalPages}
          totalItems={eosPagination.totalItems}
          pageSize={eosPagination.pageSize}
          onPageChange={eosPagination.setPage}
        />
      </div>
    </div>
  );
}