import { useState } from "react";
import { BookOpen, FileText, Receipt, BarChart2, TrendingUp } from "lucide-react";
import ChartOfAccounts from "./accounting/ChartOfAccounts";
import JournalEntries from "./accounting/JournalEntries";
import Vouchers from "./accounting/Vouchers";
import TrialBalance from "./accounting/TrialBalance";
import FinancialStatements from "./accounting/FinancialStatements";

const TABS = [
  { id: "chart", label: "دليل الحسابات", icon: BookOpen },
  { id: "journal", label: "القيود اليومية", icon: FileText },
  { id: "vouchers", label: "سندات القبض والدفع", icon: Receipt },
  { id: "trial", label: "ميزان المراجعة", icon: BarChart2 },
  { id: "statements", label: "القوائم المالية", icon: TrendingUp },
];

export default function AccountingMain() {
  const [activeTab, setActiveTab] = useState("chart");

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Sub Navigation */}
      <div className="bg-card border-b border-border px-6 overflow-x-auto flex-shrink-0">
        <div className="flex gap-0">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors
                ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chart" && <ChartOfAccounts />}
        {activeTab === "journal" && <JournalEntries />}
        {activeTab === "vouchers" && <Vouchers />}
        {activeTab === "trial" && <TrialBalance />}
        {activeTab === "statements" && <FinancialStatements />}
      </div>
    </div>
  );
}