import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { FileText, CreditCard, RefreshCw, Eye, Warehouse, CheckCircle, Clock, AlertCircle, LogOut } from "lucide-react";
import ContractView from "../components/storage/ContractView";
import InvoiceView from "../components/storage/InvoiceView";
import PaymentModal from "../components/storage/PaymentModal";

export default function CustomerPortal() {
  const [user, setUser] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("contracts");
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const [c, inv] = await Promise.all([
          base44.entities.StorageContract.filter({ customer_email: me.email }),
          base44.entities.StorageInvoice.filter({ customer_email: me.email }),
        ]);
        setContracts(c);
        setInvoices(inv.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)));
      } catch {
        base44.auth.redirectToLogin(window.location.pathname);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const unpaidCount = invoices.filter(i => i.status === "غير مدفوعة").length;

  const handlePaymentDone = async (invoice, method, ref) => {
    await base44.entities.StorageInvoice.update(invoice.id, {
      status: "مدفوعة",
      payment_method: method,
      payment_ref: ref,
      paid_at: new Date().toISOString(),
    });
    setPayingInvoice(null);
    const inv = await base44.entities.StorageInvoice.filter({ customer_email: user.email });
    setInvoices(inv.sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <Warehouse className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 leading-none">بوابة العملاء</p>
              <p className="text-xs text-primary">مركز التخزين الذاتي</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unpaidCount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">
                {unpaidCount} فاتورة غير مدفوعة
              </span>
            )}
            <span className="text-sm text-gray-600 hidden sm:block">{user?.full_name || user?.email}</span>
            <button onClick={() => base44.auth.logout()} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50">
              <LogOut className="w-3.5 h-3.5" />خروج
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome */}
        <div className="bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5">
          <p className="text-xl font-bold text-gray-900">مرحباً، {user?.full_name || "عميلنا العزيز"} 👋</p>
          <p className="text-sm text-muted-foreground mt-1">يمكنك من هنا عرض عقودك وفواتيرك والدفع إلكترونياً</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-primary">{contracts.filter(c => c.status === "نشط").length}</p>
            <p className="text-xs text-muted-foreground mt-1">عقد نشط</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{unpaidCount}</p>
            <p className="text-xs text-muted-foreground mt-1">فاتورة مستحقة</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{invoices.filter(i => i.status === "مدفوعة").length}</p>
            <p className="text-xs text-muted-foreground mt-1">فاتورة مدفوعة</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border bg-white rounded-t-xl px-2">
          {[
            { id: "contracts", label: "عقودي", icon: FileText },
            { id: "invoices", label: "فواتيري", icon: CreditCard },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <tab.icon className="w-4 h-4" />{tab.label}
            </button>
          ))}
        </div>

        {/* Contracts Tab */}
        {activeTab === "contracts" && (
          <div className="space-y-4">
            {contracts.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <Warehouse className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد عقود بعد</p>
              </div>
            ) : contracts.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-900">عقد رقم: {c.contract_number}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "نشط" ? "bg-green-100 text-green-700" : c.status === "منتهي" ? "bg-gray-100 text-gray-500" : "bg-red-100 text-red-600"}`}>{c.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">الوحدة: <span className="font-medium text-gray-700">{c.unit_number} — {c.branch}</span></p>
                    <p className="text-sm text-muted-foreground">المدة: <span className="font-medium text-gray-700">{c.start_date} إلى {c.end_date}</span></p>
                    <p className="text-sm text-muted-foreground">السعر الشهري: <span className="font-bold text-primary">{c.monthly_price?.toLocaleString("ar-SA")} ر.س</span></p>
                    {c.auto_renew && <p className="text-xs text-amber-600 mt-1">🔄 التجديد التلقائي مفعّل — ينتهي {c.end_date}</p>}
                  </div>
                  <button onClick={() => setSelectedContract(c)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
                    <Eye className="w-4 h-4" />عرض العقد
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="space-y-3">
            {invoices.length === 0 ? (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد فواتير بعد</p>
              </div>
            ) : invoices.map(inv => (
              <div key={inv.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-3 flex-wrap ${inv.status === "غير مدفوعة" ? "border-red-200 bg-red-50/30" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${inv.status === "مدفوعة" ? "bg-green-100" : "bg-red-100"}`}>
                    {inv.status === "مدفوعة" ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{inv.invoice_number} <span className="text-xs font-normal text-muted-foreground">({inv.invoice_type})</span></p>
                    <p className="text-xs text-muted-foreground">الفترة: {inv.period_start} — {inv.period_end}</p>
                    <p className="text-xs text-muted-foreground">تاريخ الاستحقاق: {inv.due_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="font-black text-lg text-primary">{inv.total_amount?.toLocaleString("ar-SA")} ر.س</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${inv.status === "مدفوعة" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{inv.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedInvoice(inv)} className="p-2 hover:bg-muted rounded-lg">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    {inv.status === "غير مدفوعة" && (
                      <button onClick={() => setPayingInvoice(inv)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors">
                        <CreditCard className="w-3.5 h-3.5" />ادفع الآن
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedContract && <ContractView contract={selectedContract} onClose={() => setSelectedContract(null)} />}
      {selectedInvoice && <InvoiceView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} onPay={selectedInvoice.status === "غير مدفوعة" ? () => { setSelectedInvoice(null); setPayingInvoice(selectedInvoice); } : null} />}
      {payingInvoice && <PaymentModal invoice={payingInvoice} onClose={() => setPayingInvoice(null)} onDone={handlePaymentDone} />}
    </div>
  );
}