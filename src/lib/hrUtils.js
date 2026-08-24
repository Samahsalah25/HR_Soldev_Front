// ───────────────────────────────────────────────
// نظام التأمينات الاجتماعية GOSI
// المصدر: لوائح GOSI المحدّثة 2024-2025
// ───────────────────────────────────────────────

export const GOSI_RATES = {
  saudi: {
    employee: 0.09,        // 9% على الموظف (أساسي + سكن)
    employer: {
      retirement: 0.09,    // 9% تقاعد
      occupational: 0.02,  // 2% أخطار مهنية
      labor_support: 0.0075, // 0.75% دعم صندوق العمال
      total: 0.1175,       // 11.75% إجمالي صاحب العمل
    }
  },
  nonSaudi: {
    employee: 0.02,        // 2% أخطار مهنية فقط
    employer: 0.02,        // 2% أخطار مهنية
  }
};

export const EXPAT_LEVY = 400; // ريال شهرياً لكل موظف غير سعودي (2024)

/**
 * حساب GOSI للموظف السعودي
 * وعاء الاشتراك: الراتب الأساسي + بدل السكن
 */
export function calcGOSI_Saudi(basicSalary, housingAllowance) {
  const base = basicSalary + housingAllowance;
  const employeeDeduction = base * GOSI_RATES.saudi.employee;
  const employerContribution = base * GOSI_RATES.saudi.employer.total;
  return {
    base,
    employeeDeduction: Math.round(employeeDeduction * 100) / 100,
    employerContribution: Math.round(employerContribution * 100) / 100,
    breakdown: {
      retirement: Math.round(base * GOSI_RATES.saudi.employer.retirement * 100) / 100,
      occupational: Math.round(base * GOSI_RATES.saudi.employer.occupational * 100) / 100,
      laborSupport: Math.round(base * GOSI_RATES.saudi.employer.labor_support * 100) / 100,
    }
  };
}

/**
 * حساب GOSI للموظف غير السعودي
 * وعاء الاشتراك: الراتب الأساسي فقط
 */
export function calcGOSI_NonSaudi(basicSalary) {
  const employeeDeduction = basicSalary * GOSI_RATES.nonSaudi.employee;
  const employerContribution = basicSalary * GOSI_RATES.nonSaudi.employer;
  return {
    base: basicSalary,
    employeeDeduction: Math.round(employeeDeduction * 100) / 100,
    employerContribution: Math.round(employerContribution * 100) / 100,
    expatLevy: EXPAT_LEVY,
  };
}

// ───────────────────────────────────────────────
// حساب كشف الراتب الكامل
// ───────────────────────────────────────────────
export function calcPayslip(employee, absenceDays = 0, lateMinutes = 0, overtimeHours = 0) {
  const { basic_salary, housing_allowance, transport_allowance, food_allowance,
    communication_allowance, other_allowances, is_saudi } = employee;

  const totalEarnings = (basic_salary || 0) + (housing_allowance || 0) +
    (transport_allowance || 0) + (food_allowance || 0) +
    (communication_allowance || 0) + (other_allowances || 0);

  // العمل الإضافي: المادة 107 - 150% من الأجر الأساسي اليومي
  const dailyRate = basic_salary / 30;
  const hourlyRate = dailyRate / 8;
  const overtimeAmount = overtimeHours * hourlyRate * 1.5;

  // خصم الغياب (من الراتب الإجمالي)
  const absenceDeduction = (totalEarnings / 30) * absenceDays;

  // خصم التأخير (من الراتب الأساسي)
  const lateDeduction = (basic_salary / 30 / 480) * lateMinutes;

  // GOSI — الشركة تتحمل حصة الموظف كاملاً (لا خصم على الموظف)
  let gosiEmployee = 0;
  let gosiEmployer = 0;
  if (is_saudi) {
    const g = calcGOSI_Saudi(basic_salary, housing_allowance || 0);
    gosiEmployee = 0; // الشركة تتحمل حصة الموظف
    gosiEmployer = g.employerContribution + g.employeeDeduction; // إجمالي التكلفة على الشركة
  } else {
    const g = calcGOSI_NonSaudi(basic_salary);
    gosiEmployee = 0; // الشركة تتحمل حصة الموظف
    gosiEmployer = g.employerContribution + g.employeeDeduction; // إجمالي التكلفة على الشركة
  }

  // خصم قسط السلفة (يمرر كمعامل اختياري)
  const loanDeduction = arguments[4] || 0;

  const totalDeductions = absenceDeduction + lateDeduction + loanDeduction; // بدون خصم GOSI
  const netSalary = totalEarnings + overtimeAmount - totalDeductions;

  // مخصص نهاية الخدمة الشهري
  const eosProv = basic_salary / 12;

  return {
    totalEarnings: Math.round(totalEarnings * 100) / 100,
    overtimeAmount: Math.round(overtimeAmount * 100) / 100,
    gosiEmployee: Math.round(gosiEmployee * 100) / 100,
    gosiEmployer: Math.round(gosiEmployer * 100) / 100,
    absenceDeduction: Math.round(absenceDeduction * 100) / 100,
    lateDeduction: Math.round(lateDeduction * 100) / 100,
    loanDeduction: Math.round((arguments[4] || 0) * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    eosMonthlyProvision: Math.round(eosProv * 100) / 100,
  };
}

// ───────────────────────────────────────────────
// نهاية الخدمة - المادة 84 من نظام العمل
// ───────────────────────────────────────────────
export function calcEndOfService(basicSalary, serviceYears, terminationType, contractType) {
  const fullReward = basicSalary * serviceYears;

  let reward = 0;

  if (contractType === "محدد المدة") {
    if (terminationType === "إنهاء من صاحب العمل") reward = fullReward;
    else if (terminationType === "عدم تجديد بقرار العامل") reward = fullReward * 0.5;
    else if (terminationType === "انتهاء بالاتفاق") reward = fullReward;
  } else {
    // عقد غير محدد المدة
    if (terminationType === "إنهاء من صاحب العمل") {
      if (serviceYears < 2) reward = 0;
      else if (serviceYears < 5) reward = (basicSalary * 0.5) * serviceYears;
      else reward = fullReward;
    } else if (terminationType === "استقالة") {
      if (serviceYears < 2) reward = 0;
      else if (serviceYears < 5) reward = fullReward * (1/3);
      else if (serviceYears < 10) reward = fullReward * (2/3);
      else reward = fullReward;
    }
  }

  return {
    serviceYears,
    fullReward: Math.round(fullReward * 100) / 100,
    finalReward: Math.round(reward * 100) / 100,
  };
}

// ───────────────────────────────────────────────
// الإجازات - المادة 109 من نظام العمل
// ───────────────────────────────────────────────
export function getLeaveEntitlement(serviceYears) {
  return serviceYears >= 5 ? 30 : 21;
}

export function getMonthlyAccrual(serviceYears) {
  return serviceYears >= 5 ? 2.5 : 1.75;
}

// تصفية الإجازات
export function calcLeaveEncashment(basicSalary, housingAllowance, leaveDays) {
  const dailyRate = (basicSalary + housingAllowance) / 30;
  return Math.round(dailyRate * leaveDays * 100) / 100;
}

// احتساب رصيد الإجازات السنوية تلقائياً من تاريخ الانضمام
// الأساس: المادة 109 — 21 يوم لأقل من 5 سنوات، 30 يوم لـ5 سنوات فأكثر
export function calcAutoLeaveBalance(joinDate, approvedAnnualLeaveDays = 0) {
  if (!joinDate) return 0;
  const join = new Date(joinDate);
  const now = new Date();
  const monthsWorked = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  const years = monthsWorked / 12;
  const monthlyRate = years >= 5 ? 30 / 12 : 21 / 12;
  const accrued = monthsWorked * monthlyRate;
  const balance = Math.max(0, accrued - approvedAnnualLeaveDays);
  return Math.round(balance * 10) / 10;
}

// احتساب سنوات الخدمة
export function calcServiceYears(joinDate) {
  const join = new Date(joinDate);
  const now = new Date();
  return (now - join) / (1000 * 60 * 60 * 24 * 365.25);
}

// فرمات الأرقام بالعربي
export function formatCurrency(amount) {
  return new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
}

export function formatNumber(n) {
  return new Intl.NumberFormat("ar-SA").format(n || 0);
}

// ───────────────────────────────────────────────
// حساب التذاكر المتراكمة غير المستخدمة عند الإنهاء
// ───────────────────────────────────────────────
/**
 * يحسب عدد التذاكر المتراكمة التي لم يستخدمها الموظف
 * @param {string} joinDate - تاريخ المباشرة
 * @param {string} lastUsedTicketDate - آخر تاريخ استخدم فيه التذكرة (null = لم يستخدم أبداً)
 * @param {string} entitlement - "سنوياً" | "كل سنتين" | "غير مستحق"
 * @param {number} ticketValue - قيمة التذكرة بالريال
 * @returns {{ unUsedTickets: number, totalValue: number, details: string }}
 */
export function calcTicketEncashment(joinDate, lastUsedTicketDate, entitlement, ticketValue) {
  if (!joinDate || entitlement === "غير مستحق" || !ticketValue) {
    return { unUsedTickets: 0, totalValue: 0, details: "غير مستحق" };
  }

  const join = new Date(joinDate);
  const today = new Date();
  const totalMonths = (today.getFullYear() - join.getFullYear()) * 12 + (today.getMonth() - join.getMonth());
  const intervalMonths = entitlement === "كل سنتين" ? 24 : 12;

  // نقطة البداية للحساب = آخر استخدام أو تاريخ المباشرة
  const baseDate = lastUsedTicketDate ? new Date(lastUsedTicketDate) : join;
  const monthsSinceBase = (today.getFullYear() - baseDate.getFullYear()) * 12 + (today.getMonth() - baseDate.getMonth());

  // عدد التذاكر المتراكمة = الأشهر المنقضية ÷ فترة الاستحقاق (كسر = تذكرة جزئية)
  const unUsedTickets = Math.floor(monthsSinceBase / intervalMonths);

  if (unUsedTickets <= 0) {
    const remaining = intervalMonths - monthsSinceBase;
    return { unUsedTickets: 0, totalValue: 0, details: `لم يتراكم استحقاق بعد (${remaining} شهر للاستحقاق القادم)` };
  }

  const totalValue = unUsedTickets * ticketValue;
  return {
    unUsedTickets,
    totalValue: Math.round(totalValue * 100) / 100,
    details: `${unUsedTickets} تذكرة × ${ticketValue.toLocaleString("ar-SA")} ر.س`,
  };
}

// حالة انتهاء الوثيقة
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const days = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: "منتهية", color: "red", days };
  if (days <= 7) return { label: `تنتهي خلال ${days} يوم`, color: "red", days, critical: true };
  if (days <= 30) return { label: `تنتهي خلال ${days} يوم`, color: "red", days };
  if (days <= 60) return { label: `تنتهي خلال ${days} يوم`, color: "amber", days };
  if (days <= 90) return { label: `تنتهي خلال ${days} يوم`, color: "yellow", days };
  return { label: "سارية", color: "green", days };
}