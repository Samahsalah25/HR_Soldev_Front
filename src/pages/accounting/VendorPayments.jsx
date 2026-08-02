// src/components/accounting/VendorPayments.jsx
import { useState } from "react";
import {
  Plus,
  ArrowRight,
  Search,
  Filter,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";

// ===== Mock Data for Vendor Payments =====
const MOCK_PAYMENTS = [
  {
    id: 1,
    date: "07/29/2026",
    number: "VPAY0009",
    journal: "Bank",
    paymentMethod: "Manual Payment",
    vendor: "شركة التوريدات الحديثة",
    vendorBankAccount: "",
    amount: 115.0,
    state: "Paid",
    paymentType: "send",
    memo: "دفعة فاتورة BILL/0001",
  },
  {
    id: 2,
    date: "07/28/2026",
    number: "VPAY0008",
    journal: "Cash",
    paymentMethod: "Manual Payment",
    vendor: "مؤسسة النقل السريع",
    vendorBankAccount: "",
    amount: 345.0,
    state: "Paid",
    paymentType: "send",
    memo: "تسوية فاتورة",
  },
  {
    id: 3,
    date: "07/27/2026",
    number: "VPAY0006",
    journal: "Bank",
    paymentMethod: "Manual Payment",
    vendor: "شركة الخليج للمعدات",
    vendorBankAccount: "",
    amount: 5000.0,
    state: "In Process",
    paymentType: "send",
    memo: "دفعة مقدمة",
  },
];

const emptyPayment = {
  date: new Date().toISOString().split("T")[0],
  number: `VPAY000${Math.floor(Math.random() * 90 + 10)}`,
  journal: "Bank",
  paymentMethod: "Manual Payment",
  vendor: "",
  vendorBankAccount: "",
  amount: "",
  state: "Draft",
  paymentType: "send",
  memo: "",
};

const STATES = ["Draft", "In Process", "Paid"];

const STATE_LABELS = {
  Draft: "مسودة",
  "In Process": "قيد المعالجة",
  Paid: "مدفوع",
};

// ===== Single Payment Form View (زي فورم الأودو في الصورة) =====
function PaymentForm({ payment, onBack, onSave }) {
  const [form, setForm] = useState(payment || emptyPayment);

  const change = (key, value) => setForm({ ...form, [key]: value });

  const stateIndex = STATES.indexOf(form.state);

  return (
    <div className="max-w-5xl mx-auto" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-6 pb-0">
        <button onClick={onBack} className="flex items-center gap-1 hover:text-foreground font-medium">
          <ArrowRight className="w-4 h-4" />
          دفعات الموردين
        </button>
        <span>/</span>
        <span className="text-foreground font-medium">
          {payment ? payment.number : "سند جديد"}
        </span>
      </div>

      {/* Action bar */}
      <div className="flex items-center justify-between px-6 pt-4 pb-2 flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {form.state === "Draft" && (
            <button
              onClick={() => onSave(form)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:opacity-90"
            >
              تأكيد
            </button>
          )}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted"
          >
            <X className="w-4 h-4" /> إلغاء
          </button>
        </div>

        {/* Status stepper */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden text-xs font-medium">
          {STATES.map((s, i) => (
            <span
              key={s}
              className={`px-3 py-1.5 ${i > 0 ? "border-r border-border" : ""} ${
                i === stateIndex
                  ? "bg-primary text-primary-foreground font-bold"
                  : "text-muted-foreground"
              }`}
            >
              {STATE_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-card border-t border-border p-6">
        <h2 className="text-3xl font-bold mb-6">{STATE_LABELS[form.state] || "مسودة"}</h2>

        <div className="grid md:grid-cols-2 gap-x-10 gap-y-5">
          {/* يمين */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">نوع الدفع</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={form.paymentType === "send"}
                    onChange={() => change("paymentType", "send")}
                    className="accent-primary"
                  />
                  <span className="text-sm">إرسال (Send)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={form.paymentType === "receive"}
                    onChange={() => change("paymentType", "receive")}
                    className="accent-primary"
                  />
                  <span className="text-sm">استلام (Receive)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">المورد</label>
              <input
                value={form.vendor}
                onChange={(e) => change("vendor", e.target.value)}
                placeholder="اختر أو اكتب اسم المورد"
                className="w-full border border-border rounded-lg p-2 text-sm bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">المبلغ (ر.س)</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => change("amount", parseFloat(e.target.value) || 0)}
                className="w-full border border-border rounded-lg p-2 text-sm bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">التاريخ</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => change("date", e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-sm bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات (Memo)</label>
              <input
                value={form.memo}
                onChange={(e) => change("memo", e.target.value)}
                placeholder="وصف مختصر للمعاملة..."
                className="w-full border border-border rounded-lg p-2 text-sm bg-background"
              />
            </div>
          </div>

          {/* شمال */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">اليومية (Journal)</label>
              <select
                value={form.journal}
                onChange={(e) => change("journal", e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-sm bg-background"
              >
                <option value="Bank">Bank (بنكي)</option>
                <option value="Cash">Cash (نقدى)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                طريقة الدفع <span className="text-muted-foreground text-xs">؟</span>
              </label>
              <input
                value={form.paymentMethod}
                onChange={(e) => change("paymentMethod", e.target.value)}
                className="w-full border border-border rounded-lg p-2 text-sm bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">حساب المورد البنكي</label>
              <input
                value={form.vendorBankAccount}
                onChange={(e) => change("vendorBankAccount", e.target.value)}
                placeholder="—"
                className="w-full border border-border rounded-lg p-2 text-sm bg-background placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Main List View Component =====
export default function VendorPayments() {
  const [payments, setPayments] = useState(MOCK_PAYMENTS);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const savePayment = (payment) => {
    if (selected) {
      setPayments((prev) =>
        prev.map((p) => (p.id === selected.id ? { ...selected, ...payment, state: "In Process" } : p))
      );
      setSelected(null);
    } else {
      setPayments((prev) => [
        {
          ...payment,
          id: Date.now(),
          state: "In Process",
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
            دفعات الموردين
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            متابعة وسداد فواتير وحركات الموردين المالية
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

      {/* Filter/Search Bar */}
      <div className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-sm">
        <div className="flex items-center gap-2 w-1/3 border rounded-lg px-3 py-1.5 bg-background">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            placeholder="بحث في الدفعات..."
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
              <th className="p-4">التاريخ</th>
              <th className="p-4">رقم السند</th>
              <th className="p-4">اليومية</th>
              <th className="p-4">طريقة الدفع</th>
              <th className="p-4">المورد</th>
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
                <td className="p-4 font-semibold">{payment.vendor}</td>
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