import { useState } from "react";
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
} from "lucide-react";

import ChartOfAccounts from "./accounting/ChartOfAccounts";
import JournalEntries from "./accounting/JournalEntries";
import Vouchers from "./accounting/Vouchers";
import TrialBalance from "./accounting/TrialBalance";
import FinancialStatements from "./accounting/FinancialStatements";

import Customers from "./accounting/Customers";
import CustomerPayments from "./accounting/CustomerPayments";
import Invoices from "./accounting/Invoices";
import CreditNotes from "./accounting/CreditNotes";
import Products from "./Products";

const TABS = [
  { id: "chart", label: "دليل الحسابات", icon: BookOpen },
  { id: "journal", label: "القيود اليومية", icon: FileText },
  { id: "vouchers", label: "سندات القبض والدفع", icon: Receipt },
  { id: "trial", label: "ميزان المراجعة", icon: BarChart2 },
  { id: "statements", label: "القوائم المالية", icon: TrendingUp },
];

const CUSTOMER_TABS = [
  { id: "customer", label: "العملاء", icon: Users },
  {
    id: "customer-payments",
    label: "دفعات العملاء",
    icon: CreditCard,
  },
  {
    id: "invoices",
    label: "الفواتير",
    icon: FileSpreadsheet,
  },
  {
    id: "credit-notes",
    label: "ملاحظات الائتمان",
    icon: BadgePercent,
  },
  {
    id: "products",
    label: "المنتجات",
    icon: BadgePercent,
  },
];

export default function AccountingMain() {
  const [activeTab, setActiveTab] = useState("chart");
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);

  const isCustomerTab = CUSTOMER_TABS.some(
    (tab) => tab.id === activeTab
  );

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

          {/* Customers Dropdown */}
          <div className="relative">
            <button
              onClick={() => setCustomerMenuOpen(!customerMenuOpen)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                isCustomerTab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4" />
              العملاء
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  customerMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {customerMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">

                {CUSTOMER_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setCustomerMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-gray-100 transition ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : ""
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}

              </div>
            )}
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {activeTab === "chart" && <ChartOfAccounts />}

        {activeTab === "journal" && <JournalEntries />}

        {activeTab === "vouchers" && <Vouchers />}

        {activeTab === "trial" && <TrialBalance />}

        {activeTab === "statements" && <FinancialStatements />}

        {activeTab === "customer" && <Customers />}

        {activeTab === "customer-payments" && (
          <CustomerPayments />
        )}

        {activeTab === "invoices" && <Invoices />}

        {activeTab === "credit-notes" && <CreditNotes />}
        {activeTab === "products" && <Products />}

      </div>
    </div>
  );
}