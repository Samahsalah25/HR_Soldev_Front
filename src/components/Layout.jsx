// import { useState } from "react";
// import { Link, useLocation, Outlet } from "react-router-dom";
// import {
//   LayoutDashboard, Users, DollarSign, CalendarDays, Clock,
//   Briefcase, FileText, LogOut, Bell, Menu, ChevronLeft,
//   Building2, Shield, Settings, Globe, UserCircle,
//   CheckSquare, ClipboardList, Video, Calculator, Scale, AlertTriangle, ChevronDown,
//   UserPlus, ArrowLeftRight, FolderOpen, Gift, MinusCircle, BarChart2, Warehouse, BookText ,Receipt, Package, Calendar, CreditCard, UserX
// } from "lucide-react";
// import NotificationPanel from "./NotificationPanel";
// import { useLanguage } from "../lib/useLanguage";
// import { useRole } from "../lib/useRole";
// import { useNavigate } from "react-router-dom";
// import { logoutUser } from "@/api/authApi";
// import { useConfirm } from "@/components/ui/confirm-dialog";

// // Nav groups are filtered dynamically based on role — defined inside component
// const ALL_NAV_GROUPS = [
//   {
//     label: "الرئيسية",
//     items: [
//       { path: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم" },
//     ]
//   },
//   {
//     label: "الموارد البشرية",
//     items: [
//       { path: "/employees", icon: Users, label: "الموظفون" },
//       { path: "/recruitment", icon: UserPlus, label: "التوظيف" },
//       { path: "/leaves", icon: CalendarDays, label: "الإجازات والتذاكر" },
//       { path: "/attendance", icon: Clock, label: "الحضور والانصراف" },
//       { path: "/missions", icon: Briefcase, label: "المهمات والسفر" },
//       { path: "/transfers", icon: ArrowLeftRight, label: "حركة النقل" },
//       { path: "/violations", icon: AlertTriangle, label: "المخالفات" },
//       { path: "/deductions", icon: MinusCircle, label: "الخصومات" },
//       { path: "/bonuses", icon: Gift, label: "المكافآت" },
//       { path: "/loan-management", icon: CreditCard, label: "السلف والقروض" },
//       { path: "/termination", icon: UserX, label: "إنهاء الخدمة" },
//     ]
//   },
// {
//   label: "المالية",
//   items: [
//     { path: "/payroll", icon: DollarSign, label: "الرواتب والتأمينات" },
//     { path: "/accounting", icon: Calculator, label: "نظام الحسابات" },
//     { path: "/financial-reports", icon: BarChart2, label: "التقارير المالية" },
//   ],

//   subgroups: [
//     {
//       label: "إعدادات المالية",
//       items: [
//         { path: "/journals", icon: BookText, label: "دفاتر اليومية" },
//       ],
//     },
//   ],
// },
//   {
//     label: "التشغيل",
//     items: [
//       { path: "/tasks", icon: CheckSquare, label: "المهام" },
//       { path: "/requests", icon: ClipboardList, label: "طلبات الموظفين" },
//       { path: "/assets", icon: Package, label: "إدارة الأصول" },
//       { path: "/meetings", icon: Video, label: "الاجتماعات" },
//     ]
//   },
//   {
//     label: "وحدات التخزين",
//     items: [
//       { path: "/storage-dashboard", icon: LayoutDashboard, label: "لوحة التخزين" },
//       { path: "/storage-units", icon: Warehouse, label: "الوحدات" },
//       { path: "/storage-bookings", icon: ClipboardList, label: "الحجوزات" },
//       { path: "/storage-contracts", icon: Receipt, label: "العقود والفواتير" },
//       { path: "/storage-crm", icon: UserCircle, label: "CRM العملاء" },
//     ]
//   },
//   {
//     label: "الإدارة",
//     items: [
//       { path: "/branches", icon: Building2, label: "الفروع والأقسام" },
//       { path: "/company-records", icon: FolderOpen, label: "سجلات الشركة" },
//       { path: "/policies", icon: FileText, label: "سياسات الشركة" },
//       { path: "/legal", icon: Scale, label: "الشؤون القانونية" },
//       { path: "/reports", icon: FileText, label: "التقارير" },
//       { path: "/permissions", icon: Shield, label: "الصلاحيات" },
//       { path: "/user-management", icon: UserCircle, label: "إدارة المستخدمين" },
//     ]
//   },
// ];


// // مكوّن ثابت برّه Layout عشان الـ DOM بتاعه (وسكرول الـ nav) ميتعملوش remount
// // كل ما الصفحة تتغيّر — تعريفه جوه Layout كان بيعمل identity جديدة كل render
// // فـ React كان يشيل الـ nav القديم ويحط واحد جديد (سكرول يرجع لفوق تلقائي).
// function SidebarContent({
//   sidebarOpen,
//   collapsedGroups,
//   toggleGroup,
//   canSee,
//   locationPathname,
//   setMobileSidebarOpen,
//   handleLogout,
// }) {
//   return (
//     <div className="flex flex-col h-full">
//       {/* Logo */}
//       <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
//         <img
//           src="https://media.base44.com/images/public/69f7177c4ad8b8c70dc86a2e/dfe020004_Soldevwhitelogo.png"
//           alt="SOLDEV"
//           className={`object-contain flex-shrink-0 ${
//             sidebarOpen ? "h-9 w-28" : "h-8 w-8"
//           }`}
//           style={sidebarOpen ? {} : { objectPosition: "left" }}
//         />
//       </div>

//       {/* Nav */}
//       <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
//         {ALL_NAV_GROUPS.map((group) => {
//           const visibleItems = group.items.filter((item) => {
//             const navKey = item.path.startsWith("/")
//               ? item.path.slice(1)
//               : item.path;

//             return canSee(navKey);
//           });

//           return (
//             <div key={group.label}>
//               {/* Main Group Header */}
//               {sidebarOpen && (
//                 <button
//                   onClick={() => toggleGroup(group.label)}
//                   className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider hover:text-sidebar-foreground/60 transition-colors"
//                 >
//                   <span>{group.label}</span>

//                   <ChevronDown
//                     className={`w-3 h-3 transition-transform ${
//                       collapsedGroups[group.label] ? "-rotate-90" : ""
//                     }`}
//                   />
//                 </button>
//               )}

//               {/* Main Group Items */}
//               {!collapsedGroups[group.label] &&
//                 visibleItems.map(({ path, icon: Icon, label }) => {
//                   const active = locationPathname === path;

//                   return (
//                     <Link
//                       key={path}
//                       to={path}
//                       onClick={() => setMobileSidebarOpen(false)}
//                       className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
//                         ${
//                           active
//                             ? "bg-secondary text-white font-semibold"
//                             : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
//                         }`}
//                     >
//                       <Icon
//                         className={`w-4 h-4 flex-shrink-0 ${
//                           active
//                             ? "text-white"
//                             : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
//                         }`}
//                       />

//                       {sidebarOpen && (
//                         <span className="text-sm">{label}</span>
//                       )}
//                     </Link>
//                   );
//                 })}

//               {/* Sub Groups */}
//               {!collapsedGroups[group.label] &&
//                 group.subgroups?.map((subgroup) => {
//                   const visibleSubItems = subgroup.items.filter((item) => {
//                     const navKey = item.path.startsWith("/")
//                       ? item.path.slice(1)
//                       : item.path;

//                     return canSee(navKey);
//                   });

//                   // لو مفيش صلاحية لأي عنصر جوه الـ subgroup
//                   if (visibleSubItems.length === 0) return null;

//                   return (
//                     <div key={subgroup.label} className="mt-2">
//                       {/* Subgroup Title */}
//                       {sidebarOpen && (
//                         <div className="px-5 py-1 text-[11px] font-semibold text-sidebar-foreground/30">
//                           {subgroup.label}
//                         </div>
//                       )}

//                       {/* Subgroup Items */}
//                       {visibleSubItems.map(
//                         ({ path, icon: Icon, label }) => {
//                           const active = locationPathname === path;

//                           return (
//                             <Link
//                               key={path}
//                               to={path}
//                               onClick={() =>
//                                 setMobileSidebarOpen(false)
//                               }
//                               className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
//                                 sidebarOpen ? "mr-3" : ""
//                               }
//                               ${
//                                 active
//                                   ? "bg-secondary text-white font-semibold"
//                                   : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
//                               }`}
//                             >
//                               <Icon
//                                 className={`w-4 h-4 flex-shrink-0 ${
//                                   active
//                                     ? "text-white"
//                                     : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
//                                 }`}
//                               />

//                               {sidebarOpen && (
//                                 <span className="text-sm">
//                                   {label}
//                                 </span>
//                               )}
//                             </Link>
//                           );
//                         }
//                       )}
//                     </div>
//                   );
//                 })}

//               {sidebarOpen && <div className="h-2" />}
//             </div>
//           );
//         })}
//       </nav>

//       {/* Bottom */}
//       <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
//         {canSee("ess") && (
//           <Link
//             to="/ess"
//             onClick={() => setMobileSidebarOpen(false)}
//             className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all ${
//               locationPathname === "/ess"
//                 ? "bg-secondary text-white"
//                 : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
//             }`}
//           >
//             <UserCircle className="w-4 h-4 flex-shrink-0" />

//             {sidebarOpen && (
//               <span className="text-sm">بوابتي</span>
//             )}
//           </Link>
//         )}

//         {canSee("recruitment") && (
//           <Link
//             to="/recruitment#my-interviews"
//             onClick={() => setMobileSidebarOpen(false)}
//             className="flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
//           >
//             <Calendar className="w-4 h-4 flex-shrink-0" />

//             {sidebarOpen && (
//               <span className="text-sm">مقابلاتي</span>
//             )}
//           </Link>
//         )}

//         {canSee("settings") && (
//           <Link
//             to="/settings"
//             onClick={() => setMobileSidebarOpen(false)}
//             className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all ${
//               locationPathname === "/settings"
//                 ? "bg-secondary text-white"
//                 : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
//             }`}
//           >
//             <Settings className="w-4 h-4 flex-shrink-0" />

//             {sidebarOpen && (
//               <span className="text-sm">الإعدادات</span>
//             )}
//           </Link>
//         )}

//         <button
//           onClick={handleLogout}
//           className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
//         >
//           <LogOut className="w-4 h-4 flex-shrink-0" />

//           {sidebarOpen && (
//             <span className="text-sm">تسجيل الخروج</span>
//           )}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default function Layout() {
//   const location = useLocation();
//   const { canSee, role, loading: roleLoading } = useRole();
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
//   const [notifOpen, setNotifOpen] = useState(false);
//   const [collapsedGroups, setCollapsedGroups] = useState({});
//   const { toggle, isAr } = useLanguage();
//   const confirmDialog = useConfirm();

//   const toggleGroup = (label) => setCollapsedGroups(g => ({ ...g, [label]: !g[label] }));
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     const ok = await confirmDialog({
//       title: "تسجيل الخروج",
//       message: "هل أنت متأكد من تسجيل الخروج من النظام؟",
//       confirmText: "تسجيل الخروج",
//       cancelText: "إلغاء",
//       variant: "destructive",
//     });

//     if (!ok) return;

//     try {
//       await logoutUser();
//     } catch (err) {
//       console.log("logout error:", err);
//     }
//     localStorage.removeItem("user");
//     navigate("/");
//   };

//   // انتظر لحد ما الصلاحيات تتحمل قبل ما ترسم السايد بار
//   if (roleLoading) {
//     return (
//       <div className="fixed inset-0 flex items-center justify-center bg-background">
//         <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
//       </div>
//     );
//   }

//   const sidebarProps = {
//     sidebarOpen, collapsedGroups, toggleGroup, canSee,
//     locationPathname: location.pathname, setMobileSidebarOpen, handleLogout,
//   };

//   return (
//     <div className="flex h-screen bg-background overflow-hidden" dir="rtl">
//       {/* Desktop Sidebar */}
//       <aside className={`hidden lg:flex flex-col bg-sidebar transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-56" : "w-14"}`}>
//         <SidebarContent {...sidebarProps} />
//       </aside>

//       {/* Mobile Overlay */}
//       {mobileSidebarOpen && (
//         <div className="lg:hidden fixed inset-0 z-50 flex">
//           <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
//           <aside className="relative w-56 bg-sidebar h-full z-50">
//             <SidebarContent {...sidebarProps} />
//           </aside>
//         </div>
//       )}

//       {/* Main */}
//       <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">
//           <button className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
//             onClick={() => setSidebarOpen(!sidebarOpen)}>
//             <ChevronLeft className={`w-4 h-4 text-muted-foreground transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
//           </button>
//           <button className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted"
//             onClick={() => setMobileSidebarOpen(true)}>
//             <Menu className="w-4 h-4 text-muted-foreground" />
//           </button>

//           <div className="flex-1" />

//           <button onClick={toggle} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium text-muted-foreground">
//             <Globe className="w-3.5 h-3.5" />{isAr ? "EN" : "عربي"}
//           </button>

//           <div className="relative">
//             <button onClick={() => setNotifOpen(o => !o)} className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors">
//               <Bell className="w-5 h-5 text-muted-foreground" />
//               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//             </button>
//             <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
//           </div>

//           {(role === "dept_manager" || role === "hr" || role === "general_manager" || role === "ceo" || role === "admin") && (
//             <Link to="/manager-dashboard"
//               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${location.pathname === "/manager-dashboard" ? "bg-primary text-white border-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
//               <ClipboardList className="w-3.5 h-3.5" />الطلبات المعلقة
//             </Link>
//           )}
//           <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">
//             <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
//               <Shield className="w-4 h-4 text-primary-foreground" />
//             </div>
//             <span className="text-sm font-medium text-foreground hidden sm:block">
//               {role === "dept_manager" ? "مدير قسم" : role === "hr" ? "HR" : role === "accountant" ? "محاسب" : role === "ceo" ? "CEO" : role === "general_manager" ? "مدير عام" : "مدير النظام"}
//             </span>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }

import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  CalendarDays,
  Clock,
  Briefcase,
  FileText,
  LogOut,
  Bell,
  Menu,
  ChevronLeft,
  Building2,
  Shield,
  Settings,
  Globe,
  UserCircle,
  CheckSquare,
  ClipboardList,
  Video,
  Calculator,
  Scale,
  AlertTriangle,
  ChevronDown,
  UserPlus,
  ArrowLeftRight,
  FolderOpen,
  Gift,
  MinusCircle,
  BarChart2,
  Warehouse,
  BookText,
  Receipt,
  Package,
  Calendar,
  CreditCard,
  UserX,
  Wallet,
} from "lucide-react";

import NotificationPanel from "./NotificationPanel";
import { useLanguage } from "../lib/useLanguage";
import { useRole } from "../lib/useRole";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/api/authApi";
import { useConfirm } from "@/components/ui/confirm-dialog";

// =========================================================
// NAV GROUPS
// =========================================================

const ALL_NAV_GROUPS = [
  {
    label: "الرئيسية",
    items: [
      {
        path: "/dashboard",
        icon: LayoutDashboard,
        label: "لوحة التحكم",
      },
    ],
  },

  // =========================================================
  // HR
  // =========================================================

  {
    label: "الموارد البشرية",
    items: [
      {
        path: "/employees",
        icon: Users,
        label: "الموظفون",
      },
      {
        path: "/recruitment",
        icon: UserPlus,
        label: "التوظيف",
      },
      {
        path: "/leaves",
        icon: CalendarDays,
        label: "الإجازات والتذاكر",
      },
      {
        path: "/attendance",
        icon: Clock,
        label: "الحضور والانصراف",
      },
      {
        path: "/missions",
        icon: Briefcase,
        label: "المهمات والسفر",
      },
      {
        path: "/transfers",
        icon: ArrowLeftRight,
        label: "حركة النقل",
      },
      {
        path: "/violations",
        icon: AlertTriangle,
        label: "المخالفات",
      },
      {
        path: "/deductions",
        icon: MinusCircle,
        label: "الخصومات",
      },
      {
        path: "/bonuses",
        icon: Gift,
        label: "المكافآت",
      },
      {
        path: "/loan-management",
        icon: CreditCard,
        label: "السلف والقروض",
      },
      {
        path: "/termination",
        icon: UserX,
        label: "إنهاء الخدمة",
      },
    ],
  },

  // =========================================================
  // FINANCE
  // =========================================================

  {
    label: "المالية",

    // العناصر الأساسية داخل المالية
    items: [
      {
        path: "/payroll",
        icon: DollarSign,
        label: "الرواتب والتأمينات",
      },
      {
        path: "/expenses",
        icon: Wallet,
        label: "المصروفات",
      },
      {
        path: "/accounting",
        icon: Calculator,
        label: "نظام الحسابات",
      },
      {
        path: "/financial-reports",
        icon: BarChart2,
        label: "التقارير المالية",
      },
    ],

    // =======================================================
    // FINANCE SETTINGS
    // تظهر داخل المالية وليس كقسم مستقل
    // =======================================================

    subgroups: [
      {
        label: "إعدادات المالية",

        items: [
          {
            path: "/journals",
            icon: BookText,
            label: "دفاتر اليومية",
          },
           {
            path: "/payment_terms",
            icon: BookText,
            label: "شروط الدفع",
          },
           {
            path: "/taxes",
            icon: BookText,
            label: " الضرائب",
          },
        ],
      },
    ],
  },

  // =========================================================
  // OPERATIONS
  // =========================================================

  {
    label: "التشغيل",
    items: [
      {
        path: "/tasks",
        icon: CheckSquare,
        label: "المهام",
      },
      {
        path: "/requests",
        icon: ClipboardList,
        label: "طلبات الموظفين",
      },
      {
        path: "/assets",
        icon: Package,
        label: "إدارة الأصول",
      },
      {
        path: "/meetings",
        icon: Video,
        label: "الاجتماعات",
      },
    ],
  },

  // =========================================================
  // STORAGE
  // =========================================================

  {
    label: "وحدات التخزين",
    items: [
      {
        path: "/storage-dashboard",
        icon: LayoutDashboard,
        label: "لوحة التخزين",
      },
      {
        path: "/storage-units",
        icon: Warehouse,
        label: "الوحدات",
      },
      {
        path: "/storage-bookings",
        icon: ClipboardList,
        label: "الحجوزات",
      },
      {
        path: "/storage-contracts",
        icon: Receipt,
        label: "العقود والفواتير",
      },
      {
        path: "/storage-crm",
        icon: UserCircle,
        label: "CRM العملاء",
      },
    ],
  },

  // =========================================================
  // ADMIN
  // =========================================================

  {
    label: "الإدارة",
    items: [
      {
        path: "/branches",
        icon: Building2,
        label: "الفروع والأقسام",
      },
      {
        path: "/company-records",
        icon: FolderOpen,
        label: "سجلات الشركة",
      },
      {
        path: "/policies",
        icon: FileText,
        label: "سياسات الشركة",
      },
      {
        path: "/legal",
        icon: Scale,
        label: "الشؤون القانونية",
      },
      {
        path: "/reports",
        icon: FileText,
        label: "التقارير",
      },
      {
        path: "/permissions",
        icon: Shield,
        label: "الصلاحيات",
      },
      {
        path: "/user-management",
        icon: UserCircle,
        label: "إدارة المستخدمين",
      },
    ],
  },
];

// =========================================================
// SIDEBAR CONTENT
// =========================================================

function SidebarContent({
  sidebarOpen,
  collapsedGroups,
  toggleGroup,
  canSee,
  locationPathname,
  setMobileSidebarOpen,
  handleLogout,
}) {
  return (
    <div className="flex flex-col h-full">

      {/* =====================================================
          LOGO
      ====================================================== */}

      <div className="flex items-center gap-3 px-4 py-4 border-b border-sidebar-border">
        <img
          src="https://media.base44.com/images/public/69f7177c4ad8b8c70dc86a2e/dfe020004_Soldevwhitelogo.png"
          alt="SOLDEV"
          className={`object-contain flex-shrink-0 ${
            sidebarOpen ? "h-9 w-28" : "h-8 w-8"
          }`}
          style={
            sidebarOpen
              ? {}
              : { objectPosition: "left" }
          }
        />
      </div>

      {/* =====================================================
          NAVIGATION
      ====================================================== */}

      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">

        {ALL_NAV_GROUPS.map((group) => {

          // =================================================
          // MAIN ITEMS
          // =================================================

          const visibleItems = group.items.filter((item) => {
            const navKey = item.path.startsWith("/")
              ? item.path.slice(1)
              : item.path;

            return canSee(navKey);
          });

          // =================================================
          // SUBGROUPS
          // =================================================

          const visibleSubgroups = (group.subgroups || [])
            .map((subgroup) => {

              // -------------------------------------------------
              // مهم:
              // إعدادات المالية ودفاتر اليومية لازم يظهروا
              // داخل المالية.
              //
              // لذلك journals مسموح ظهوره هنا مع المالية.
              // -------------------------------------------------

              const items = subgroup.items.filter((item) => {

                const navKey = item.path.startsWith("/")
                  ? item.path.slice(1)
                  : item.path;

                // دفاتر اليومية تظهر داخل إعدادات المالية
                // إذا كان المستخدم يستطيع رؤية المالية.
            if (group.label === "المالية" && navKey === "journals") {
  return (canSee("payroll") || canSee("accounting") || canSee("financial-reports"));
}
if (group.label === "المالية" && navKey === "payment_terms") {
  return (canSee("payroll") || canSee("accounting") || canSee("financial-reports"));
}
    if (group.label === "المالية" && navKey === "taxes") {
  return (canSee("payroll") || canSee("accounting") || canSee("taxes"));
}            
                return canSee(navKey);
              });

              return {
                ...subgroup,
                items,
              };
            })
            .filter(
              (subgroup) =>
                subgroup.items.length > 0
            );

          // =================================================
          // لو مفيش حاجة ظاهرة في المجموعة
          // =================================================

          if (
            visibleItems.length === 0 &&
            visibleSubgroups.length === 0
          ) {
            return null;
          }

          return (
            <div key={group.label}>

              {/* =================================================
                  MAIN GROUP HEADER
              ================================================== */}

              {sidebarOpen && (
                <button
                  onClick={() =>
                    toggleGroup(group.label)
                  }
                  className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider hover:text-sidebar-foreground/60 transition-colors"
                >
                  <span>
                    {group.label}
                  </span>

                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${
                      collapsedGroups[group.label]
                        ? "-rotate-90"
                        : ""
                    }`}
                  />
                </button>
              )}

              {/* =================================================
                  MAIN ITEMS
              ================================================== */}

              {!collapsedGroups[group.label] &&
                visibleItems.map(
                  ({
                    path,
                    icon: Icon,
                    label,
                  }) => {

                    const active =
                      locationPathname === path;

                    return (
                      <Link
                        key={path}
                        to={path}
                        onClick={() =>
                          setMobileSidebarOpen(false)
                        }
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                          active
                            ? "bg-secondary text-white font-semibold"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`}
                      >

                        <Icon
                          className={`w-4 h-4 flex-shrink-0 ${
                            active
                              ? "text-white"
                              : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                          }`}
                        />

                        {sidebarOpen && (
                          <span className="text-sm">
                            {label}
                          </span>
                        )}

                      </Link>
                    );
                  }
                )}

              {/* =================================================
                  SUBGROUPS
              ================================================== */}

              {!collapsedGroups[group.label] &&
                visibleSubgroups.map(
                  (subgroup) => {

                    const subgroupActive =
                      subgroup.items.some(
                        (item) =>
                          locationPathname ===
                          item.path
                      );

                    return (
                      <div
                        key={subgroup.label}
                        className="mt-3"
                      >

                        {/* =================================================
                            SUBGROUP HEADER
                        ================================================== */}

                        {sidebarOpen && (
                          <div
                            className={`px-5 py-1.5 text-xs font-semibold ${
                              subgroupActive
                                ? "text-sidebar-foreground/80"
                                : "text-sidebar-foreground/50"
                            }`}
                          >
                            {subgroup.label}
                          </div>
                        )}

                        {/* =================================================
                            SUBGROUP ITEMS
                        ================================================== */}

                        {subgroup.items.map(
                          ({
                            path,
                            icon: Icon,
                            label,
                          }) => {

                            const active =
                              locationPathname ===
                              path;

                            return (
                              <Link
                                key={path}
                                to={path}
                                onClick={() =>
                                  setMobileSidebarOpen(
                                    false
                                  )
                                }
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group ${
                                  sidebarOpen
                                    ? "mr-3"
                                    : ""
                                } ${
                                  active
                                    ? "bg-secondary text-white font-semibold"
                                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                }`}
                              >

                                <Icon
                                  className={`w-4 h-4 flex-shrink-0 ${
                                    active
                                      ? "text-white"
                                      : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                                  }`}
                                />

                                {sidebarOpen && (
                                  <span className="text-sm">
                                    {label}
                                  </span>
                                )}

                              </Link>
                            );
                          }
                        )}

                      </div>
                    );
                  }
                )}

              {sidebarOpen && (
                <div className="h-2" />
              )}

            </div>
          );
        })}

      </nav>

      {/* =====================================================
          BOTTOM
      ====================================================== */}

      <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">

        {/* بوابتي */}

        {canSee("ess") && (
          <Link
            to="/ess"
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all ${
              locationPathname === "/ess"
                ? "bg-secondary text-white"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <UserCircle className="w-4 h-4 flex-shrink-0" />

            {sidebarOpen && (
              <span className="text-sm">
                بوابتي
              </span>
            )}
          </Link>
        )}

        {/* مقابلاتي */}

        {canSee("recruitment") && (
          <Link
            to="/recruitment#my-interviews"
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className="flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Calendar className="w-4 h-4 flex-shrink-0" />

            {sidebarOpen && (
              <span className="text-sm">
                مقابلاتي
              </span>
            )}
          </Link>
        )}

        {/* الإعدادات العامة */}

        {canSee("settings") && (
          <Link
            to="/settings"
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all ${
              locationPathname === "/settings"
                ? "bg-secondary text-white"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Settings className="w-4 h-4 flex-shrink-0" />

            {sidebarOpen && (
              <span className="text-sm">
                الإعدادات
              </span>
            )}
          </Link>
        )}

        {/* Logout */}

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />

          {sidebarOpen && (
            <span className="text-sm">
              تسجيل الخروج
            </span>
          )}
        </button>

      </div>
    </div>
  );
}

// =========================================================
// LAYOUT
// =========================================================

export default function Layout() {

  const location = useLocation();

  const {
    canSee,
    role,
    loading: roleLoading,
  } = useRole();

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const [notifOpen, setNotifOpen] =
    useState(false);

  const [collapsedGroups, setCollapsedGroups] =
    useState({});

  const { toggle, isAr } =
    useLanguage();

  const confirmDialog =
    useConfirm();

  const navigate =
    useNavigate();

  // =========================================================
  // TOGGLE GROUP
  // =========================================================

  const toggleGroup = (label) => {
    setCollapsedGroups((groups) => ({
      ...groups,
      [label]: !groups[label],
    }));
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {

    const ok = await confirmDialog({
      title: "تسجيل الخروج",
      message:
        "هل أنت متأكد من تسجيل الخروج من النظام؟",
      confirmText: "تسجيل الخروج",
      cancelText: "إلغاء",
      variant: "destructive",
    });

    if (!ok) return;

    try {
      await logoutUser();
    } catch (err) {
      console.log(
        "logout error:",
        err
      );
    }

    localStorage.removeItem("user");

    navigate("/");
  };

  // =========================================================
  // ROLE LOADING
  // =========================================================

  if (roleLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  const sidebarProps = {
    sidebarOpen,
    collapsedGroups,
    toggleGroup,
    canSee,
    locationPathname:
      location.pathname,
    setMobileSidebarOpen,
    handleLogout,
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="flex h-screen bg-background overflow-hidden"
      dir="rtl"
    >

      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside
        className={`hidden lg:flex flex-col bg-sidebar transition-all duration-300 flex-shrink-0 ${
          sidebarOpen
            ? "w-56"
            : "w-14"
        }`}
      >
        <SidebarContent
          {...sidebarProps}
        />
      </aside>

      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}

      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">

          <div
            className="fixed inset-0 bg-black/50"
            onClick={() =>
              setMobileSidebarOpen(false)
            }
          />

          <aside className="relative w-56 bg-sidebar h-full z-50">
            <SidebarContent
              {...sidebarProps}
            />
          </aside>

        </div>
      )}

      {/* =====================================================
          MAIN
      ====================================================== */}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* HEADER */}

        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 flex-shrink-0">

          {/* Desktop sidebar toggle */}

          <button
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors"
            onClick={() =>
              setSidebarOpen(!sidebarOpen)
            }
          >
            <ChevronLeft
              className={`w-4 h-4 text-muted-foreground transition-transform ${
                sidebarOpen
                  ? ""
                  : "rotate-180"
              }`}
            />
          </button>

          {/* Mobile menu */}

          <button
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted"
            onClick={() =>
              setMobileSidebarOpen(true)
            }
          >
            <Menu className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex-1" />

          {/* Language */}

          <button
            onClick={toggle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium text-muted-foreground"
          >
            <Globe className="w-3.5 h-3.5" />

            {isAr
              ? "EN"
              : "عربي"}
          </button>

          {/* Notifications */}

          <div className="relative">

            <button
              onClick={() =>
                setNotifOpen(
                  (o) => !o
                )
              }
              className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-muted-foreground" />

              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            <NotificationPanel
              isOpen={notifOpen}
              onClose={() =>
                setNotifOpen(false)
              }
            />

          </div>

          {/* Pending requests */}

          {(
            role === "dept_manager" ||
            role === "hr" ||
            role === "general_manager" ||
            role === "ceo" ||
            role === "admin"
          ) && (
            <Link
              to="/manager-dashboard"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
                location.pathname ===
                "/manager-dashboard"
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />

              الطلبات المعلقة
            </Link>
          )}

          {/* User role */}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted">

            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>

            <span className="text-sm font-medium text-foreground hidden sm:block">

              {role === "dept_manager"
                ? "مدير قسم"
                : role === "hr"
                ? "HR"
                : role === "accountant"
                ? "محاسب"
                : role === "ceo"
                ? "CEO"
                : role === "general_manager"
                ? "مدير عام"
                : "مدير النظام"}

            </span>

          </div>

        </header>

        {/* PAGE */}

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}