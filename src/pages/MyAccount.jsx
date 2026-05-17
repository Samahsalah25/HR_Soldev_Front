import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Warehouse, FileText, Receipt, LogOut, Home, User, Phone, Mail, CreditCard, Eye } from "lucide-react";
import { getCustomerSession, clearCustomerSession } from "../lib/customerAuth";
import InvoiceView from "../components/storage/InvoiceView";
import ContractView from "../components/storage/ContractView";
import PaymentModal from "../components/storage/PaymentModal";

export default function MyAccount() {
  const [customer, setCustomer] = useState(null);
  const [tab, setTab] = useState("units");
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [payingInvoice, setPayingInvoice] = useState(null);

  useEffect(() => {
    const session = getCustomerSession();
    if (!session) {
      window.location.href = "/customer-login?next=/my-account";
      return;
    }
    setCustomer(session);

    const load = async () => {
      const [b, inv, con] = await Promise.all([
        base44.entities.StorageBooking.filter({ email: session.email }),
        base44.entities.StorageInvoice.filter({ customer_email: session.email }),
        base44.entities.StorageContract.filter({ customer_email: session.email }),
      ]);
      setBookings(b.filter(x => x.status === "Confirmed"));
      setInvoices(inv.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      setContracts(con);
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = () => {
    clearCustomerSession();
    window.location.href = "/rent";
  };

  const handlePaymentDone = async (invoice, method, ref) => {
    await base44.entities.StorageInvoice.update(invoice.id, {
      status: "مدفوعة",
      payment_method: method,
      payment_ref: ref,
      paid_at: new Date().toISOString(),
    });
    setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, status: "مدفوعة", payment_method: method, payment_ref: ref } : i));
    setPayingInvoice(null);
  };

  if (!customer) return null;

  const unpaidInvoices = invoices.filter(i => i.status === "غير مدفوعة");

  const TABS = [
    { id: "units", label: "وحداتي", icon: Warehouse },
    { id: "invoices", label: "الفواتير", icon: Receipt },
    { id: "contracts", label: "العقود", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40 px-6 py-3 flex items-center justify-between">
        <a href="/rent" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Warehouse className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-gray-900 text-lg leading-none">مخزن</p>
            <p className="text-xs text-primary font-medium">Self Storage</p>
          </div>
        </a>
        <div className="flex items-center gap-3">
          <a href="/rent" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Warehouse className="w-4 h-4" />احجز الآن
          </a>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block">{customer.full_name}</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:border-red-200 transition-colors">
            <LogOut className="w-4 h-4" />تسجيل الخروج
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Welcome Card */}
        <div className="bg-gradient-to-l from-primary/10 to-orange-50 rounded-2xl border border-primary/20 p-6">
          <h1 className="text-2xl font-black text-gray-900">مرحباً، {customer.full_name}! 👋</h1>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="w-4 h-4 text-primary" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="w-4 h-4 text-primary" />
              <span>{customer.phone}</span>
            </div>
          </div>
          {unpaidInvoices.length > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-red-100 text-red-700 rounded-xl px-4 py-2 w-fit text-sm font-medium">
              <Receipt className="w-4 h-4" />
              لديك {unpaidInvoices.length} فاتورة غير مدفوعة
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 flex-1 py-4 text-sm font-semibold transition-colors ${tab === id ? "text-primary border-b-2 border-primary bg-primary/3" : "text-gray-400 hover:text-gray-600"}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {loading ? (
              <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
            ) : tab === "units" ? (
              <UnitsTab bookings={bookings} contracts={contracts} />
            ) : tab === "invoices" ? (
              <InvoicesTab invoices={invoices} onView={setSelectedInvoice} onPay={setPayingInvoice} />
            ) : (
              <ContractsTab contracts={contracts} onView={setSelectedContract} />
            )}
          </div>
        </div>
      </div>

      {selectedInvoice && <InvoiceView invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />}
      {selectedContract && <ContractView contract={selectedContract} onClose={() => setSelectedContract(null)} />}
      {payingInvoice && (
        <PaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onPaid={(method, ref) => handlePaymentDone(payingInvoice, method, ref)}
        />
      )}
    </div>
  );
}

function UnitsTab({ bookings, contracts }) {
  const contractsByBooking = {};
  contracts.forEach(c => { contractsByBooking[c.booking_id] = c; });

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Warehouse className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">لا توجد وحدات محجوزة</p>
        <a href="/rent" className="inline-block mt-3 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90">استعرض الوحدات المتاحة</a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {bookings.map(b => {
        const contract = contractsByBooking[b.id];
        return (
          <div key={b.id} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-l from-primary/10 to-orange-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{b.unit_number}</p>
                  <p className="text-sm text-gray-500">{b.branch}</p>
                </div>
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Warehouse className="w-7 h-7 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">رقم الحجز</span><span className="font-mono text-xs font-medium">{b.booking_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">السعر الشهري</span><span className="font-bold text-primary">{b.monthly_price?.toLocaleString("ar-SA")} ر.س</span></div>
              {contract && <>
                <div className="flex justify-between"><span className="text-gray-500">بداية العقد</span><span>{contract.start_date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">نهاية العقد</span><span>{contract.end_date}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">التجديد التلقائي</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${contract.auto_renew ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {contract.auto_renew ? "🔄 نشط" : "موقوف"}
                  </span>
                </div>
              </>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InvoicesTab({ invoices, onView, onPay }) {
  if (invoices.length === 0) return <EmptyState icon={Receipt} text="لا توجد فواتير" />;
  return (
    <div className="space-y-3">
      {invoices.map(inv => (
        <div key={inv.id} className={`flex items-center justify-between p-4 rounded-xl border ${inv.status === "غير مدفوعة" ? "border-red-200 bg-red-50/30" : "border-gray-100 bg-gray-50/30"}`}>
          <div>
            <p className="font-mono text-xs text-gray-400">{inv.invoice_number}</p>
            <p className="font-semibold text-gray-800 mt-0.5">وحدة {inv.unit_number} — {inv.months} شهر</p>
            <p className="text-xs text-gray-400 mt-0.5">{inv.period_start} — {inv.period_end}</p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <p className="font-bold text-primary text-lg">{inv.total_amount?.toLocaleString("ar-SA")} ر.س</p>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${inv.status === "مدفوعة" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{inv.status}</span>
            <div className="flex gap-2">
              <button onClick={() => onView(inv)} className="p-1.5 hover:bg-white rounded-lg border border-gray-200"><Eye className="w-3.5 h-3.5 text-gray-500" /></button>
              {inv.status === "غير مدفوعة" && (
                <button onClick={() => onPay(inv)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90">
                  <CreditCard className="w-3.5 h-3.5" />سدد الآن
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContractsTab({ contracts, onView }) {
  if (contracts.length === 0) return <EmptyState icon={FileText} text="لا توجد عقود" />;
  return (
    <div className="space-y-3">
      {contracts.map(c => (
        <div key={c.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50/30">
          <div>
            <p className="font-mono text-xs text-gray-400">{c.contract_number}</p>
            <p className="font-semibold text-gray-800 mt-0.5">وحدة {c.unit_number} — {c.branch}</p>
            <p className="text-xs text-gray-400 mt-0.5">من {c.start_date} إلى {c.end_date}</p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c.status === "نشط" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
            <button onClick={() => onView(c)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-white">
              <Eye className="w-3.5 h-3.5" />عرض العقد
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="text-center py-12">
      <Icon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
}