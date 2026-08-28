import { useState, useRef, useEffect, useCallback } from "react";
import {
  BookOpen,
  FileText,
  Receipt,
  BarChart2,
  TrendingUp,
  Users,
  CreditCard,
  FileSpreadsheet,
  BadgePercent,
  ChevronDown,
  Truck,
  FileMinus,
  Wallet,
  UserCog,
  Layers,
} from "lucide-react";

import ChartOfAccounts from "./accounting/ChartOfAccounts";
import JournalEntries from "./accounting/JournalEntries";
import Vouchers from "./accounting/Vouchers";
import TrialBalance from "./accounting/TrialBalance";
import FinancialStatements from "./accounting/FinancialStatements";
import Ledgers from "./accounting/Ledgers";

import Customers from "./accounting/Customers";
import CustomerPayments from "./accounting/CustomerPayments";
import Invoices from "./accounting/Invoices";
import CreditNotes from "./accounting/CreditNotes";
import Products from "./Products";

import Vendors from "./accounting/Vendors";
import Bills from "./accounting/Bills";
import Refunds from "./accounting/Refunds";
import VendorPayments from "./accounting/VendorPayments";
import EmployeeExpenses from "./accounting/EmployeeExpenses";

const TABS = [
  { id: "chart", label: "دليل الحسابات", icon: BookOpen },
  { id: "journal", label: "القيود اليومية", icon: FileText },
  { id: "vouchers", label: "سندات القبض والدفع", icon: Receipt },
  { id: "trial", label: "ميزان المراجعة", icon: BarChart2 },
  { id: "statements", label: "القوائم المالية", icon: TrendingUp },
  { id: "ledgers", label: "دفتر الحسابات", icon: Layers },
];

const CUSTOMER_TABS = [
  { id: "customer", label: "العملاء", icon: Users },
  { id: "customer-payments", label: "دفعات العملاء", icon: CreditCard },
  { id: "invoices", label: "الفواتير", icon: FileSpreadsheet },
  { id: "credit-notes", label: "ملاحظات الائتمان", icon: BadgePercent },
  { id: "products", label: "المنتجات", icon: BadgePercent },
];

const VENDOR_TABS = [
  { id: "bills", label: "الفواتير", icon: FileText },
  { id: "refunds", label: "المرتجعات", icon: FileMinus },
  { id: "vendor-payments", label: "الدفعات", icon: Wallet },
  { id: "employee-expenses", label: "مصروفات الموظفين", icon: UserCog },
  { id: "vendor-products", label: "المنتجات", icon: BadgePercent },
  { id: "vendors", label: "الموردين", icon: Truck },
];

export default function AccountingMain() {
  const [activeTab, setActiveTab] = useState("chart");
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [vendorMenuOpen, setVendorMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 224 });
  const [vendorMenuPos, setVendorMenuPos] = useState({ top: 0, left: 0, width: 224 });

  const customerBtnRef = useRef(null);
  const menuRef = useRef(null);

  const vendorBtnRef = useRef(null);
  const vendorMenuRef = useRef(null);

  const isCustomerTab = CUSTOMER_TABS.some((tab) => tab.id === activeTab);
  const isVendorTab = VENDOR_TABS.some((tab) => tab.id === activeTab);

  // نحسب مكان الزرار فعليًا بالنسبة للـ viewport، عشان نستخدم position: fixed
  // ونفلت من أي overflow-x-auto بيقطع الـ dropdown
  const updateMenuPosition = useCallback(() => {
    if (!customerBtnRef.current) return;
    const rect = customerBtnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 224),
    });
  }, []);

  const updateVendorMenuPosition = useCallback(() => {
    if (!vendorBtnRef.current) return;
    const rect = vendorBtnRef.current.getBoundingClientRect();
    setVendorMenuPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 224),
    });
  }, []);

  const toggleCustomerMenu = () => {
    if (!customerMenuOpen) updateMenuPosition();
    setVendorMenuOpen(false);
    setCustomerMenuOpen((v) => !v);
  };

  const toggleVendorMenu = () => {
    if (!vendorMenuOpen) updateVendorMenuPosition();
    setCustomerMenuOpen(false);
    setVendorMenuOpen((v) => !v);
  };

  // إعادة حساب المكان لو حصل scroll أو resize والقائمة مفتوحة
  useEffect(() => {
    if (!customerMenuOpen) return;
    updateMenuPosition();
    window.addEventListener("scroll", updateMenuPosition, true);
    window.addEventListener("resize", updateMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateMenuPosition, true);
      window.removeEventListener("resize", updateMenuPosition);
    };
  }, [customerMenuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!vendorMenuOpen) return;
    updateVendorMenuPosition();
    window.addEventListener("scroll", updateVendorMenuPosition, true);
    window.addEventListener("resize", updateVendorMenuPosition);
    return () => {
      window.removeEventListener("scroll", updateVendorMenuPosition, true);
      window.removeEventListener("resize", updateVendorMenuPosition);
    };
  }, [vendorMenuOpen, updateVendorMenuPosition]);

  // قفل القوائم لو كبست برا
  useEffect(() => {
    if (!customerMenuOpen && !vendorMenuOpen) return;
    const handleClickOutside = (e) => {
      if (
        customerMenuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        customerBtnRef.current &&
        !customerBtnRef.current.contains(e.target)
      ) {
        setCustomerMenuOpen(false);
      }
      if (
        vendorMenuOpen &&
        vendorMenuRef.current &&
        !vendorMenuRef.current.contains(e.target) &&
        vendorBtnRef.current &&
        !vendorBtnRef.current.contains(e.target)
      ) {
        setVendorMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [customerMenuOpen, vendorMenuOpen]);

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Navigation */}
      <div className="bg-card border-b border-border px-6 overflow-x-auto flex-shrink-0">
        <div className="flex gap-0 items-center">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCustomerMenuOpen(false);
                setVendorMenuOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}

          {/* Vendors Dropdown trigger */}
          <button
            ref={vendorBtnRef}
            onClick={toggleVendorMenu}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              isVendorTab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Truck className="w-4 h-4" />
            الموردين
            <ChevronDown className={`w-4 h-4 transition-transform ${vendorMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Customers Dropdown trigger */}
          <button
            ref={customerBtnRef}
            onClick={toggleCustomerMenu}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              isCustomerTab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            العملاء
            <ChevronDown className={`w-4 h-4 transition-transform ${customerMenuOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Vendor Dropdown menu */}
      {vendorMenuOpen && (
        <div
          ref={vendorMenuRef}
          style={{ position: "fixed", top: vendorMenuPos.top, left: vendorMenuPos.left, width: vendorMenuPos.width, zIndex: 9999 }}
          className="bg-white border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {VENDOR_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setVendorMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-muted transition-colors ${
                activeTab === tab.id ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Customer Dropdown menu */}
      {customerMenuOpen && (
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width, zIndex: 9999 }}
          className="bg-white border border-border rounded-lg shadow-lg overflow-hidden"
        >
          {CUSTOMER_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCustomerMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-muted transition-colors ${
                activeTab === tab.id ? "bg-primary/10 text-primary" : "text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chart" && <ChartOfAccounts />}
        {activeTab === "journal" && <JournalEntries />}
        {activeTab === "vouchers" && <Vouchers />}
        {activeTab === "trial" && <TrialBalance />}
        {activeTab === "statements" && <FinancialStatements />}
        {activeTab === "ledgers" && <Ledgers />}
        {activeTab === "customer" && <Customers />}
        {activeTab === "customer-payments" && <CustomerPayments />}
        {activeTab === "invoices" && <Invoices />}
        {activeTab === "credit-notes" && <CreditNotes />}
        {activeTab === "products" && <Products />}
        {activeTab === "bills" && <Bills />}
        {activeTab === "refunds" && <Refunds />}
        {activeTab === "vendor-payments" && <VendorPayments />}
        {activeTab === "employee-expenses" && <EmployeeExpenses />}
        {activeTab === "vendor-products" && <Products />}
        {activeTab === "vendors" && <Vendors />}
      </div>
    </div>
  );
}