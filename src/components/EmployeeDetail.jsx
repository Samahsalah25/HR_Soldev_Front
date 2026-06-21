import { X, Edit, User, Briefcase, DollarSign, AlertCircle, Plane } from "lucide-react";
import { formatCurrency, calcServiceYears, calcGOSI_Saudi, calcGOSI_NonSaudi, getExpiryStatus } from "../lib/hrUtils";

const Row = ({ label, value, highlight }) => (
  <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium ${highlight ? "text-primary" : "text-foreground"}`}>{value || "—"}</span>
  </div>
);

export default function EmployeeDetail({ employee: emp, onClose, onEdit }) {
  const years = emp.join_date ? calcServiceYears(emp.join_date) : 0;
  const gosi = emp.is_saudi
    ? calcGOSI_Saudi(emp.basic_salary || 0, emp.housing_allowance || 0)
    : calcGOSI_NonSaudi(emp.basic_salary || 0);

  const totalSalary = (emp.basic_salary || 0) + (emp.housing_allowance || 0) +
    (emp.transport_allowance || 0) + (emp.food_allowance || 0) +
    (emp.communication_allowance || 0) + (emp.other_allowances || 0);

  const idStatus = getExpiryStatus(emp.id_expiry);
  const passStatus = getExpiryStatus(emp.passport_expiry);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">{emp.full_name_ar?.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{emp.full_name_ar}</h2>
              <p className="text-sm text-muted-foreground">{emp.job_title} — {emp.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(emp)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              <Edit className="w-3.5 h-3.5" />تعديل
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Alerts */}
          {idStatus && idStatus.days <= 90 && (
            <div className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${idStatus.days <= 30 ? "bg-red-50 border-red-200 text-red-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              <AlertCircle className="w-4 h-4" />
              {emp.is_saudi ? "الهوية الوطنية" : "الإقامة"}: {idStatus.label}
            </div>
          )}

          {/* Personal */}
          <Section title="البيانات الشخصية" icon={User}>
            <Row label="رقم الملف" value={emp.employee_number} />
            <Row label="الجنسية" value={emp.nationality} />
            <Row label="رقم الهوية/الإقامة" value={emp.id_number} />
            <Row label="انتهاء الهوية/الإقامة" value={emp.id_expiry ? new Date(emp.id_expiry).toLocaleDateString("ar-SA") : null} highlight={idStatus?.color === "red"} />
            <Row label="رقم الجواز" value={emp.passport_number} />
            <Row label="انتهاء الجواز" value={emp.passport_expiry ? new Date(emp.passport_expiry).toLocaleDateString("ar-SA") : null} highlight={passStatus?.color === "red"} />
            <Row label="الجنس" value={emp.gender} />
            <Row label="الحالة الاجتماعية" value={emp.marital_status} />
            <Row label="عدد المعالين" value={emp.dependents_count} />
            <Row label="رقم الجوال" value={emp.phone} />
            <Row label="البريد الإلكتروني" value={emp.email} />
          </Section>

          {/* Job */}
          <Section title="بيانات الوظيفة" icon={Briefcase}>
            <Row label="المسمى الوظيفي" value={emp.job_title} />
            <Row label="القسم" value={emp.department} />
            <Row label="الدرجة الوظيفية" value={emp.job_grade} />
            <Row label="المدير المباشر" value={emp.manager} />
            <Row label="الفرع" value={emp.branch} />
            <Row label="تاريخ المباشرة" value={emp.join_date ? new Date(emp.join_date).toLocaleDateString("ar-SA") : null} />
            <Row label="سنوات الخدمة" value={`${years.toFixed(2)} سنة`} />
            <Row label="نوع العقد" value={emp.contract_type} />
            {emp.contract_end_date && <Row label="انتهاء العقد" value={new Date(emp.contract_end_date).toLocaleDateString("ar-SA")} />}
            <Row label="مركز التكلفة" value={emp.cost_center} />
            <Row label="المشروع" value={emp.project} />
          </Section>

          {/* Salary */}
          <Section title="هيكل الراتب" icon={DollarSign}>
            <Row label="الراتب الأساسي" value={formatCurrency(emp.basic_salary)} highlight />
            <Row label="بدل السكن" value={formatCurrency(emp.housing_allowance)} />
            <Row label="بدل النقل" value={formatCurrency(emp.transport_allowance)} />
            <Row label="بدل الغذاء" value={formatCurrency(emp.food_allowance)} />
            <Row label="بدل الاتصالات" value={formatCurrency(emp.communication_allowance)} />
            <Row label="بدلات أخرى" value={formatCurrency(emp.other_allowances)} />
            <div className="flex justify-between py-2 bg-primary/5 rounded-lg px-3 mt-1">
              <span className="text-sm font-semibold text-foreground">إجمالي الراتب</span>
              <span className="text-sm font-bold text-primary">{formatCurrency(totalSalary)}</span>
            </div>
          </Section>

          {/* GOSI */}
          <Section title={`التأمينات الاجتماعية GOSI — ${emp.is_saudi ? "سعودي (9%/11.75%)" : "مقيم (2%/2%)"}`} icon={DollarSign}>
            <Row label="وعاء الاشتراك" value={formatCurrency(gosi.base)} />
            <Row label="خصم الموظف" value={formatCurrency(gosi.employeeDeduction)} highlight />
            <Row label="اشتراك صاحب العمل" value={formatCurrency(gosi.employerContribution)} />
            {!emp.is_saudi && <Row label="رسوم العمالة الوافدة" value="400 ريال/شهر" />}
            {emp.is_saudi && gosi.breakdown && (
              <>
                <Row label="تقاعد (9%)" value={formatCurrency(gosi.breakdown.retirement)} />
                <Row label="أخطار مهنية (2%)" value={formatCurrency(gosi.breakdown.occupational)} />
                <Row label="صندوق العمال (0.75%)" value={formatCurrency(gosi.breakdown.laborSupport)} />
              </>
            )}
          </Section>

          {/* Travel */}
          <Section title="استحقاق التذاكر" icon={Plane}>
            <Row label="دورية الاستحقاق" value={emp.ticket_entitlement} />
            <Row label="درجة التذكرة" value={emp.ticket_class} />
            <Row label="الوجهة" value={emp.ticket_destination} />
            <Row label="قيمة التذكرة" value={formatCurrency(emp.ticket_value)} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-muted/30 rounded-xl border border-border p-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-primary" />{title}
      </h3>
      {children}
    </div>
  );
}