// ═══════════════════════════════════════════════════════
// نظام الترجمة الثنائية — عربي / إنجليزي
// ═══════════════════════════════════════════════════════

export const translations = {
  ar: {
    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.employees": "الموظفون",
    "nav.payroll": "الرواتب والتأمينات",
    "nav.leaves": "الإجازات والتذاكر",
    "nav.attendance": "الحضور والانصراف",
    "nav.missions": "المهمات والسفر",
    "nav.endOfService": "نهاية الخدمة",
    "nav.reports": "التقارير",
    "nav.ess": "بوابة الموظف",
    "nav.branches": "الفروع والأقسام",
    "nav.policies": "سياسات الشركة",
    "nav.tasks": "المهام الداخلية",
    "nav.requests": "طلبات الموظفين",
    "nav.meetings": "الاجتماعات",
    "nav.accounting": "الحسابات",
    "nav.settings": "الإعدادات",
    "nav.logout": "تسجيل الخروج",

    // Dashboard
    "dashboard.title": "لوحة التحكم التنفيذية",
    "dashboard.subtitle": "نظام إدارة الموارد البشرية — المملكة العربية السعودية",
    "dashboard.totalEmployees": "إجمالي الموظفين",
    "dashboard.activeEmployees": "موظف نشط",
    "dashboard.totalPayroll": "إجمالي الرواتب",
    "dashboard.monthly": "شهرياً",
    "dashboard.saudization": "نسبة السعودة",
    "dashboard.leaveRequests": "طلبات الإجازة",
    "dashboard.pendingApproval": "في انتظار الموافقة",

    // Common
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.view": "عرض",
    "common.search": "بحث",
    "common.filter": "فلتر",
    "common.export": "تصدير",
    "common.loading": "جاري التحميل...",
    "common.noData": "لا توجد بيانات",
    "common.add": "إضافة",
    "common.status": "الحالة",
    "common.actions": "الإجراءات",
    "common.department": "القسم",
    "common.name": "الاسم",
    "common.date": "التاريخ",
    "common.total": "الإجمالي",
    "common.print": "طباعة",
    "common.allDepartments": "كل الأقسام",
    "common.saudi": "سعودي",
    "common.resident": "مقيم",

    // Settings
    "settings.title": "الإعدادات والمعايير النظامية",
    "settings.gosi": "معدلات التأمينات GOSI",
    "settings.wps": "نظام حماية الأجور WPS",
    "settings.sandbox": "بيئة اختبار الحسابات",
    "settings.gosiNote": "المرجع: لوائح GOSI المحدّثة 2024-2025",

    // ESS
    "ess.title": "بوابة الموظف الذاتية",
    "ess.subtitle": "Employee Self Service — ESS",
    "ess.myProfile": "بياناتي الشخصية",
    "ess.myLeaves": "إجازاتي",
    "ess.myPayslips": "قسائم الراتب",
    "ess.myAttendance": "سجل حضوري",
    "ess.requestLeave": "تقديم طلب إجازة",
    "ess.leaveBalance": "رصيد الإجازات",
  },
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.employees": "Employees",
    "nav.payroll": "Payroll & GOSI",
    "nav.leaves": "Leaves & Tickets",
    "nav.attendance": "Attendance",
    "nav.missions": "Missions & Travel",
    "nav.endOfService": "End of Service",
    "nav.reports": "Reports",
    "nav.ess": "Employee Portal",
    "nav.branches": "Branches & Depts",
    "nav.policies": "Company Policies",
    "nav.tasks": "Tasks",
    "nav.requests": "Employee Requests",
    "nav.meetings": "Meetings",
    "nav.accounting": "Accounting",
    "nav.settings": "Settings",
    "nav.logout": "Logout",

    // Dashboard
    "dashboard.title": "Executive Dashboard",
    "dashboard.subtitle": "HR Management System — Kingdom of Saudi Arabia",
    "dashboard.totalEmployees": "Total Employees",
    "dashboard.activeEmployees": "Active Employees",
    "dashboard.totalPayroll": "Total Payroll",
    "dashboard.monthly": "Monthly",
    "dashboard.saudization": "Saudization Rate",
    "dashboard.leaveRequests": "Leave Requests",
    "dashboard.pendingApproval": "Pending Approval",

    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.view": "View",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    "common.loading": "Loading...",
    "common.noData": "No data found",
    "common.add": "Add",
    "common.status": "Status",
    "common.actions": "Actions",
    "common.department": "Department",
    "common.name": "Name",
    "common.date": "Date",
    "common.total": "Total",
    "common.print": "Print",
    "common.allDepartments": "All Departments",
    "common.saudi": "Saudi",
    "common.resident": "Resident",

    // Settings
    "settings.title": "System Settings & Rates",
    "settings.gosi": "GOSI Contribution Rates",
    "settings.wps": "Wage Protection System (WPS)",
    "settings.sandbox": "Calculation Sandbox",
    "settings.gosiNote": "Reference: Updated GOSI Regulations 2024-2025",

    // ESS
    "ess.title": "Employee Self Service",
    "ess.subtitle": "بوابة الموظف الذاتية",
    "ess.myProfile": "My Profile",
    "ess.myLeaves": "My Leaves",
    "ess.myPayslips": "My Payslips",
    "ess.myAttendance": "My Attendance",
    "ess.requestLeave": "Request Leave",
    "ess.leaveBalance": "Leave Balance",
  }
};

export function t(lang, key) {
  return translations[lang]?.[key] ?? translations["ar"]?.[key] ?? key;
}