import { useState } from "react";
import {
  Plus,
  ArrowRight,
  Save,
  Search,
  Filter,
  SlidersHorizontal,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

// ===== Mock Data for Payments =====
const MOCK_PAYMENTS = [
  {
    id: 1,
    date: "07/29/2026",
    number: "PAY0009",
    journal: "Cash",
    paymentMethod: "Manual Payment",
    customer: "Acme Corp",
    amount: 1.15,
    state: "Paid",
    paymentType: "receive",
    memo: "Inv-001 partial",
  },
  {
    id: 2,
    date: "07/28/2026",
    number: "PAY0008",
    journal: "Bank",
    paymentMethod: "Manual Payment",
    customer: "Ahmed Mohamed",
    amount: 1.15,
    state: "Paid",
    paymentType: "receive",
    memo: "Invoice settlement",
  },
  {
    id: 3,
    date: "07/27/2026",
    number: "PAY0006",
    journal: "Cash",
    paymentMethod: "Manual Payment",
    customer: "Default User Template",
    amount: 5000.00,
    state: "Rejected",
    paymentType: "send",
    memo: "Advance payment",
  },
];

const emptyPayment = {
  date: new Date().toISOString().split('T')[0],
  number: `PAY000${Math.floor(Math.random() * 90 + 10)}`,
  journal: "Cash",
  paymentMethod: "Manual Payment",
  customer: "",
  amount: "",
  state: "Draft",
  paymentType: "receive",
  memo: "",
};

// ===== Single Payment Form View =====
function PaymentForm({ payment, onBack, onSave }) {
  const [form, setForm] = useState(payment || emptyPayment);

  const change = (key, value) =>
    setForm({
      ...form,
      [key]: value,
    });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Top Bar / Breadcrumb */}
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button
            onClick={onBack}
            className="flex items-center gap-1 hover:text-foreground font-medium"
          >
            <ArrowRight className="w-4 h-4" />
            مدفوعات العملاء
          </button>
          <span>/</span>
          <span className="text-foreground font-bold">
            {payment ? payment.number : "سند جديد"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(form)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:opacity-90"
          >
            <Save className="w-4 h-4" />
            حفظ
          </button>
        </div>
      </div>

      {/* Status Bar / Pipeline */}
      <div className="flex justify-between items-center bg-card border rounded-xl p-4 shadow-sm">
        <div className="flex gap-2">
          <button 
            onClick={() => change("state", "Draft")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${form.state === 'Draft' ? 'bg-secondary text-secondary-foreground font-bold' : 'text-muted-foreground'}`}
          >
            مسودة (Draft)
          </button>
          <button 
            onClick={() => change("state", "In Process")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${form.state === 'In Process' ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold' : 'text-muted-foreground'}`}
          >
            قيد المعالجة (In Process)
          </button>
          <button 
            onClick={() => change("state", "Paid")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border ${form.state === 'Paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold' : 'text-muted-foreground'}`}
          >
            مدفوع (Paid)
          </button>
        </div>
        
        <div className="text-xs bg-muted px-3 py-1.5 rounded-md font-semibold">
          الحالة الحالية: <span className="text-primary">{form.state}</span>
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-2xl font-bold">{form.number || "سند دفع جديد"}</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Payment Type */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium block text-muted-foreground">نوع الدفع</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  checked={form.paymentType === "send"}
                  onChange={() => change("paymentType", "send")}
                />
                <span className="text-sm">إرسال (Send)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="paymentType"
                  checked={form.paymentType === "receive"}
                  onChange={() => change("paymentType", "receive")}
                />
                <span className="text-sm">استلام (Receive)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">العميل</label>
            <input
              value={form.customer}
              onChange={(e) => change("customer", e.target.value)}
              placeholder="اختر أو اكتب اسم العميل"
              className="w-full border rounded-lg p-2 text-sm bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">اليومية (Journal)</label>
            <select
              value={form.journal}
              onChange={(e) => change("journal", e.target.value)}
              className="w-full border rounded-lg p-2 text-sm bg-background"
            >
              <option value="Cash">Cash (نقدى)</option>
              <option value="Bank">Bank (بنكي)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">المبلغ (ر.س)</label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => change("amount", parseFloat(e.target.value) || 0)}
              className="w-full border rounded-lg p-2 text-sm bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">طريقة الدفع</label>
            <input
              value={form.paymentMethod}
              onChange={(e) => change("paymentMethod", e.target.value)}
              className="w-full border rounded-lg p-2 text-sm bg-background"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">التاريخ</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => change("date", e.target.value)}
              className="w-full border rounded-lg p-2 text-sm bg-background"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">ملاحظات (Memo)</label>
            <input
              value={form.memo}
              onChange={(e) => change("memo", e.target.value)}
              placeholder="وصف مختصر للمعاملة..."
              className="w-full border rounded-lg p-2 text-sm bg-background"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main List View Component =====
export default function CustomerPayments() {
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const savePayment = (payment) => {
    if (selected) {
      setPayments((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...selected, ...payment } : p))
      );
      setSelected(null);
    } else {
      setPayments((prev) => [
        {
          ...payment,
          id: Date.now(),
        },
        ...prev,
      ]);
      setCreating(false);
    }
  };

  if (selected) {
    return (
      <PaymentForm
        payment={selected}
        onBack={() => setSelected(null)}
        onSave={savePayment}
      />
    );
  }

  if (creating) {
    return (
      <PaymentForm
        payment={null}
        onBack={() => setCreating(false)}
        onSave={savePayment}
      />
    );
  }

  const totalAmount = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />
            مدفوعات العملاء
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            متابعة وسداد فواتير وحركات العملاء المالية
          </p>
        </div>

        <button
          onClick={() => setCreating(true)}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 flex items-center gap-2 text-sm font-medium shadow hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          سند جديد
        </button>
      </div>

      {/* Filter/Search Bar mock */}
      <div className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 w-1/3 border rounded-lg px-3 py-1.5 bg-background">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input 
            placeholder="بحث في المدفوعات..." 
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>فلتر النشاط</span>
        </div>
      </div>

      {/* Table View */}
      <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
              <p className="p-4">التاريخ</p>
              <th className="p-4">رقم السند</th>
              <th className="p-4">اليومية</th>
              <th className="p-4">طريقة الدفع</th>
              <th className="p-4">العميل</th>
              <th className="p-4">المبلغ</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {payments.map((payment) => (
              <tr
                key={payment.id}
                onClick={() => setSelected(payment)}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <td className="p-4 flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  {payment.date}
                </td>
                <td className="p-4 font-medium text-primary">{payment.number}</td>
                <td className="p-4">{payment.journal}</td>
                <td className="p-4 text-muted-foreground">{payment.paymentMethod}</td>
                <td className="p-4 font-semibold">{payment.customer}</td>
                <td className="p-4 font-bold text-foreground">
                  ر.س {payment.amount.toLocaleString()}
                </td>
                <td className="p-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      payment.state === "Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : payment.state === "In Process"
                        ? "bg-amber-100 text-amber-800"
                        : payment.state === "Rejected"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {payment.state}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table Footer Total */}
        <div className="p-4 bg-muted/20 border-t flex justify-between items-center font-bold text-sm">
          <span>الإجمالي الكلي:</span>
          <span className="text-primary text-base">ر.س {totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}