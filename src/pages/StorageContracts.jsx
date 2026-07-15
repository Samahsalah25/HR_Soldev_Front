import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, RefreshCw, Search, Eye, StopCircle } from "lucide-react";
import ContractView from "../components/storage/ContractView";
import InvoiceView from "../components/storage/InvoiceView";
import api from "../api/axios";

import {
   getContracts,
  getContractById,
  renewContract,
  stopRenewalContract,
  getInvoices,
  getInvoiceById,
  payInvoice,
} from "@/api/storageInvoices";

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
  setLoading(true);

  try {
    const [contractsRes, invoicesRes] = await Promise.all([
      getContracts(),
      getInvoices(),
    ]);

    setContracts(contractsRes.data || []);
    setInvoices(invoicesRes.data || []);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => { load(); }, []);

const handleViewContract = async (id) => {
  try {
    const res = await getContractById(id);
    setSelectedContract(res.data);
  } catch (err) {
    console.error(err);
  }
};
const handlePayInvoice = async () => {
  try {

    await payInvoice(selectedInvoice.id);

    await load();

    setSelectedInvoice(null);

  } catch (error) {
    console.error("Payment error:", error);
  }
};
  // Auto-renew contracts that reach end_date
const handleRenewContract = async (contract) => {
  try {
    setProcessing((p) => ({ ...p, [contract.id]: true }));

    await renewContract(contract.id);

    await load();
  } catch (error) {
    console.error(error);
  } finally {
    setProcessing((p) => ({ ...p, [contract.id]: false }));
  }
};
const stopRenew = async (contract) => {
  try {
    await stopRenewalContract(contract.id);
    await load();
  } catch (error) {
    console.error(error);
  }
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
      <thead>
        <tr className="bg-muted/30 border-b border-border">
          {[
            "رقم العقد",
            "العميل",
            "الوحدة",
            "المدة",
            "البداية",
            "النهاية",
            "التجديد",
            "الحالة",
            "إجراءات",
          ].map((h) => (
            <th
              key={h}
              className="text-right px-3 py-3 text-xs font-medium text-muted-foreground"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan={9} className="text-center py-10 text-muted-foreground">
              جاري التحميل...
            </td>
          </tr>
        ) : (
          filteredContracts.map((c) => {
            const expiringSoon =
              c.contract_end_date &&
              c.contract_end_date <=
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                  .toISOString()
                  .slice(0, 10) &&
              c.state === "active";

            return (
              <tr
                key={c.id}
                className={`border-b border-border last:border-0 hover:bg-muted/20 ${
                  expiringSoon ? "bg-amber-50/30" : ""
                }`}
              >
                {/* رقم العقد */}
                <td className="px-3 py-3 font-mono text-xs">
                  {c.contract_number}
                </td>

                {/* العميل */}
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground">
                    {c.customer_type === "company"
                      ? c.company_name
                      : c.customer_name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {c.customer_type === "company"
                      ? c.company_email
                      : c.customer_email}
                  </p>
                </td>

                {/* الوحدة */}
                <td className="px-3 py-3">
                  <p className="font-medium">{c.unit_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.location}
                  </p>
                </td>

                {/* المدة */}
                <td className="px-3 py-3 text-center">
                  {c.duration_months} شهر
                </td>

                {/* البداية */}
                <td className="px-3 py-3 text-xs text-muted-foreground">
                  {c.contract_start_date}
                </td>

                {/* النهاية */}
                <td className="px-3 py-3 text-xs">
                  <span
                    className={
                      expiringSoon
                        ? "text-amber-600 font-bold"
                        : "text-muted-foreground"
                    }
                  >
                    {c.contract_end_date}
                  </span>

                  {expiringSoon && (
                    <p className="text-xs text-amber-600">
                      ⚠️ قريباً
                    </p>
                  )}
                </td>

                {/* التجديد */}
                <td className="px-3 py-3 text-center">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      c.renewal === "automatic"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.renewal_label}
                  </span>
                </td>

                {/* الحالة */}
                <td className="px-3 py-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      c.state === "active"
                        ? "bg-green-100 text-green-700"
                        : c.state === "stopped"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {c.state_label}
                  </span>
                </td>

                {/* الإجراءات */}
                <td className="px-3 py-3">
                  <div className="flex gap-1">

                    {/* عرض العقد */}
                    <button
                      onClick={async () => {
                        try {
                          const res = await getContractById(c.id);
                          setSelectedContract(res.data);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      title="عرض العقد"
                      className="p-1.5 hover:bg-muted rounded"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* تجديد العقد */}
                    {c.renewal === "automatic" &&
                      c.state === "active" && (
                        <button
                          onClick={() => handleRenewContract(c)}
                          disabled={processing[c.id]}
                          title="تجديد العقد"
                          className="p-1.5 hover:bg-green-50 rounded text-green-600 disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${
                              processing[c.id]
                                ? "animate-spin"
                                : ""
                            }`}
                          />
                        </button>
                      )}

                    {/* إيقاف التجديد */}
                    {c.state === "active" && (
                      <button
                        onClick={() => stopRenew(c)}
                        title="إيقاف التجديد"
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                      </button>
                    )}

                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
)}

     {activeTab === "invoices" && (
  <div className="bg-card rounded-xl border border-border overflow-hidden">
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-muted/30 border-b border-border">
          {[
            "رقم الفاتورة",
            "العميل",
            "الوحدة",
            "النوع",
            "الفترة",
            "المبلغ",
            "الحالة",
            "عرض",
          ].map((h) => (
            <th
              key={h}
              className="text-right px-3 py-3 text-xs font-medium text-muted-foreground"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {loading ? (
          <tr>
            <td colSpan={8} className="text-center py-10 text-muted-foreground">
              جاري التحميل...
            </td>
          </tr>
        ) : (
          filteredInvoices.map((inv) => (
            <tr
              key={inv.id}
              className={`border-b border-border last:border-0 hover:bg-muted/20 ${
                inv.state !== "paid" ? "bg-red-50/20" : ""
              }`}
            >
              <td className="px-3 py-3 font-mono text-xs">
                {inv.invoice_number}
              </td>

              <td className="px-3 py-3">
                <p className="font-medium">
                  {inv.customer_name || "شركة"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inv.customer_email}
                </p>
              </td>

              <td className="px-3 py-3 text-xs">
                {inv.unit_number}
              </td>

              <td className="px-3 py-3">
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {inv.invoice_type_label}
                </span>
              </td>

              <td className="px-3 py-3 text-xs text-muted-foreground">
                {inv.period_start}
                <br />— {inv.period_end}
              </td>

              <td className="px-3 py-3 font-bold text-primary">
                {Number(inv.total_price).toLocaleString("ar-SA")} ر.س
              </td>

              <td className="px-3 py-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.state === "paid"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {inv.state_label}
                </span>
              </td>

              <td className="px-3 py-3">
               <button
  onClick={async () => {
    try {
      const res = await getInvoiceById(inv.id);

      setSelectedInvoice(res.data);

    } catch (err) {
      console.error(err);
    }
  }}
  className="p-1.5 hover:bg-muted rounded"
  title="عرض الفاتورة"
>
  <Eye className="w-3.5 h-3.5" />
</button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
)}
      {selectedContract && <ContractView contract={selectedContract} onClose={() => setSelectedContract(null)} />}
      {selectedInvoice && <InvoiceView invoice={selectedInvoice}     onClose={() => setSelectedInvoice(null)}
    onPay={handlePayInvoice} />}
    </div>
  );
}