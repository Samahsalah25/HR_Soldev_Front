import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, Plus, RefreshCw, Search, Eye, StopCircle, CheckCircle, AlertCircle } from "lucide-react";
import ContractView from "../components/storage/ContractView";
import InvoiceView from "../components/storage/InvoiceView";

function createInvoice(contract, type = "تجديد") {
  const subtotal = contract.monthly_price * contract.contract_months;
  const vatAmount = Math.round(subtotal * 0.15);
  const total = subtotal + vatAmount;
  const now = new Date();
  const due = new Date(now); due.setDate(due.getDate() + 7);
  const periodEnd = new Date(contract.next_renewal_date || contract.end_date);
  const periodStart = new Date(periodEnd); periodStart.setMonth(periodStart.getMonth() - contract.contract_months);

  return base44.entities.StorageInvoice.create({
    invoice_number: "INV-" + Date.now().toString().slice(-8),
    contract_id: contract.id,
    contract_number: contract.contract_number,
    booking_id: contract.booking_id,
    booking_number: contract.booking_number,
    customer_email: contract.customer_email,
    customer_name: contract.customer_name,
    customer_phone: contract.customer_phone,
    customer_type: contract.customer_type,
    company_name: contract.company_name,
    tax_number: contract.tax_number,
    unit_number: contract.unit_number,
    branch: contract.branch,
    period_start: periodStart.toISOString().slice(0, 10),
    period_end: periodEnd.toISOString().slice(0, 10),
    invoice_date: now.toISOString().slice(0, 10),
    due_date: due.toISOString().slice(0, 10),
    monthly_price: contract.monthly_price,
    months: contract.contract_months,
    subtotal,
    vat_rate: 15,
    vat_amount: vatAmount,
    total_amount: total,
    status: "غير مدفوعة",
    invoice_type: type,
  });
}

export default function StorageContracts() {
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("contracts");
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [processing, setProcessing] = useState({});

  const load = async () => {
    const [c, inv] = await Promise.all([
      base44.entities.StorageContract.list("-created_date"),
      base44.entities.StorageInvoice.list("-created_date"),
    ]);
    setContracts(c);
    setInvoices(inv);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  // Auto-renew contracts that reach end_date
  const renewContract = async (contract) => {
    if (!contract.auto_renew || contract.status !== "نشط") return;
    setProcessing(p => ({ ...p, [contract.id]: true }));
    const newStart = contract.end_date;
    const newEnd = new Date(newStart);
    newEnd.setMonth(newEnd.getMonth() + contract.contract_months);
    const newEndStr = newEnd.toISOString().slice(0, 10);
    const nextRenewal = new Date(newEndStr);
    nextRenewal.setDate(nextRenewal.getDate() - 7);
    const updated = { ...contract, start_date: newStart, end_date: newEndStr, next_renewal_date: nextRenewal.toISOString().slice(0, 10) };
    await base44.entities.StorageContract.update(contract.id, { start_date: newStart, end_date: newEndStr, next_renewal_date: nextRenewal.toISOString().slice(0, 10) });
    await createInvoice(updated, "تجديد");
    // Post accounting entry
    try {
      const accounts = await base44.entities.AccountChart.list();
      const revenueAcc = accounts.find(a => a.account_name?.includes("إيراد") && !a.is_parent);
      const arAcc = accounts.find(a => (a.account_name?.includes("مدين") || a.account_name?.includes("عملاء")) && !a.is_parent);
      if (revenueAcc && arAcc) {
        const subtotal = contract.monthly_price * contract.contract_months;
        const vat = Math.round(subtotal * 0.15);
        const total = subtotal + vat;
        await base44.entities.JournalEntry.create({
          entry_number: "JE-STR-" + Date.now().toString().slice(-6),
          entry_date: new Date().toISOString().slice(0, 10),
          description: `إيراد إيجار تخزين — ${contract.unit_number} — ${contract.customer_name}`,
          lines: [
            { account_id: arAcc.id, account_code: arAcc.account_code, account_name: arAcc.account_name, debit: total, credit: 0, description: `مديونية عميل تخزين: ${contract.customer_name}` },
            { account_id: revenueAcc.id, account_code: revenueAcc.account_code, account_name: revenueAcc.account_name, debit: 0, credit: subtotal, description: `إيراد تخزين: ${contract.unit_number}` },
          ],
          total_debit: total, total_credit: total,
          status: "مرحل", source: "تخزين ذاتي", source_id: contract.id,
          posted_by: "النظام التلقائي",
          posted_date: new Date().toISOString().slice(0, 10),
        });
      }
    } catch {}
    setProcessing(p => ({ ...p, [contract.id]: false }));
    load();
  };

  const stopRenew = async (contract) => {
    await base44.entities.StorageContract.update(contract.id, { auto_renew: false, status: "موقوف" });
    load();
  };

  const filteredContracts = contracts.filter(c => !search || c.customer_name?.includes(search) || c.contract_number?.includes(search) || c.unit_number?.includes(search));
  const filteredInvoices = invoices.filter(i => !search || i.customer_name?.includes(search) || i.invoice_number?.includes(search));
  const unpaid = invoices.filter(i => i.status === "غير مدفوعة").length;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="w-6 h-6 text-primary" />العقود والفواتير</h1>
          <p className="text-sm text-muted-foreground">إدارة عقود وفواتير عملاء التخزين</p>
        </div>
        <div className="flex gap-2">
          {unpaid > 0 && <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-bold">{unpaid} فاتورة غير مدفوعة</span>}
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <RefreshCw className="w-4 h-4" />تحديث
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[{id:"contracts",label:`العقود (${contracts.length})`},{id:"invoices",label:`الفواتير (${invoices.length})`}].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..."
          className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
      </div>

      {activeTab === "contracts" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["رقم العقد","العميل","الوحدة","المدة","البداية","النهاية","التجديد","الحالة","إجراءات"].map(h => (
                <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                : filteredContracts.map(c => {
                  const today = new Date().toISOString().slice(0, 10);
                  const expiringSoon = c.end_date && c.end_date <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) && c.status === "نشط";
                  return (
                    <tr key={c.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${expiringSoon ? "bg-amber-50/30" : ""}`}>
                      <td className="px-3 py-3 font-mono text-xs">{c.contract_number}</td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground">{c.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{c.customer_email}</p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium">{c.unit_number}</p>
                        <p className="text-xs text-muted-foreground">{c.branch}</p>
                      </td>
                      <td className="px-3 py-3 text-center">{c.contract_months} شهر</td>
                      <td className="px-3 py-3 text-xs text-muted-foreground">{c.start_date}</td>
                      <td className="px-3 py-3 text-xs">
                        <span className={expiringSoon ? "text-amber-600 font-bold" : "text-muted-foreground"}>{c.end_date}</span>
                        {expiringSoon && <p className="text-xs text-amber-600">⚠️ قريباً</p>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {c.auto_renew ? <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">🔄 تلقائي</span>
                          : <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">موقوف</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "نشط" ? "bg-green-100 text-green-700" : c.status === "موقوف" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>{c.status}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setSelectedContract(c)} title="عرض العقد" className="p-1.5 hover:bg-muted rounded"><Eye className="w-3.5 h-3.5" /></button>
                          {c.auto_renew && c.status === "نشط" && (
                            <button onClick={() => renewContract(c)} disabled={processing[c.id]} title="تجديد وإصدار فاتورة"
                              className="p-1.5 hover:bg-green-50 rounded text-green-600 disabled:opacity-50">
                              <RefreshCw className={`w-3.5 h-3.5 ${processing[c.id] ? "animate-spin" : ""}`} />
                            </button>
                          )}
                          {c.status === "نشط" && (
                            <button onClick={() => stopRenew(c)} title="إيقاف التجديد" className="p-1.5 hover:bg-red-50 rounded text-red-500">
                              <StopCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-muted/30 border-b border-border">
              {["رقم الفاتورة","العميل","الوحدة","النوع","الفترة","المبلغ","الحالة","عرض"].map(h => (
                <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
                : filteredInvoices.map(inv => (
                  <tr key={inv.id} className={`border-b border-border last:border-0 hover:bg-muted/20 ${inv.status === "غير مدفوعة" ? "bg-red-50/20" : ""}`}>
                    <td className="px-3 py-3 font-mono text-xs">{inv.invoice_number}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{inv.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.customer_email}</p>
                    </td>
                    <td className="px-3 py-3 text-xs">{inv.unit_number}<br/><span className="text-muted-foreground">{inv.branch}</span></td>
                    <td className="px-3 py-3"><span className="text-xs bg-muted px-1.5 py-0.5 rounded">{inv.invoice_type}</span></td>
                    <td className="px-3 py-3 text-xs text-muted-foreground">{inv.period_start}<br/>— {inv.period_end}</td>
                    <td className="px-3 py-3 font-bold text-primary">{inv.total_amount?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === "مدفوعة" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{inv.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 hover:bg-muted rounded"><Eye className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedContract && <ContractView contract={selectedContract} onClose={() => setSelectedContract(null)} />}
      {selectedInvoice && <InvoiceView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
    </div>
  );
}