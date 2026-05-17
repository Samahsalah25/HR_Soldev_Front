import { X, Printer, CreditCard } from "lucide-react";

const COMPANY = {
  name: "شركة التخزين الذاتي",
  address: "الرياض، المملكة العربية السعودية",
  phone: "920000000",
  email: "info@storage.com",
  cr: "1234567890",
  vat: "300000000000003",
};

export default function InvoiceView({ invoice, onClose, onPay }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900">فاتورة ضريبية</h3>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">
              <Printer className="w-4 h-4" />طباعة
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-5 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-2">
                <span className="text-white font-black text-xl">ت</span>
              </div>
              <h1 className="text-xl font-black text-gray-900">{COMPANY.name}</h1>
              <p className="text-xs text-gray-500">{COMPANY.address}</p>
              <p className="text-xs text-gray-500">{COMPANY.phone} | {COMPANY.email}</p>
              <p className="text-xs text-gray-500">س.ت: {COMPANY.cr} | الرقم الضريبي: {COMPANY.vat}</p>
            </div>
            <div className="text-left space-y-1">
              <div className={`px-3 py-1 rounded-full text-sm font-bold text-center ${invoice.status === "مدفوعة" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {invoice.status}
              </div>
              <p className="text-gray-500 text-xs">فاتورة رقم:</p>
              <p className="font-black text-gray-900">{invoice.invoice_number}</p>
              <p className="text-gray-500 text-xs">تاريخ الإصدار: {invoice.invoice_date}</p>
              <p className="text-gray-500 text-xs">تاريخ الاستحقاق: <span className={invoice.status === "غير مدفوعة" ? "text-red-600 font-bold" : ""}>{invoice.due_date}</span></p>
              <p className="text-gray-500 text-xs">نوع الفاتورة: {invoice.invoice_type}</p>
            </div>
          </div>

          {/* Client */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="font-bold text-gray-900 mb-2">فاتورة إلى:</p>
            <p className="font-semibold text-gray-800">{invoice.customer_name}</p>
            {invoice.company_name && <p className="text-gray-600">{invoice.company_name}</p>}
            {invoice.tax_number && <p className="text-xs text-gray-500">الرقم الضريبي: {invoice.tax_number}</p>}
            <p className="text-gray-600">{invoice.customer_phone}</p>
            <p className="text-gray-600">{invoice.customer_email}</p>
          </div>

          {/* Items */}
          <table className="w-full border border-gray-200 rounded-xl overflow-hidden text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-right px-4 py-2 text-gray-600 font-semibold">البيان</th>
                <th className="text-center px-4 py-2 text-gray-600 font-semibold">الفترة</th>
                <th className="text-center px-4 py-2 text-gray-600 font-semibold">السعر</th>
                <th className="text-left px-4 py-2 text-gray-600 font-semibold">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-4 py-3">
                  <p className="font-medium">إيجار وحدة تخزين — {invoice.unit_number}</p>
                  <p className="text-xs text-gray-400">{invoice.branch} | عقد: {invoice.contract_number}</p>
                </td>
                <td className="px-4 py-3 text-center text-gray-600 text-xs">{invoice.period_start}<br/>— {invoice.period_end}</td>
                <td className="px-4 py-3 text-center">{invoice.monthly_price?.toLocaleString("ar-SA")} × {invoice.months}</td>
                <td className="px-4 py-3 text-left font-semibold">{invoice.subtotal?.toLocaleString("ar-SA")} ر.س</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 border border-gray-200 rounded-xl p-4 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع قبل الضريبة</span>
              <span>{invoice.subtotal?.toLocaleString("ar-SA")} ر.س</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ضريبة القيمة المضافة ({invoice.vat_rate}%)</span>
              <span>{invoice.vat_amount?.toLocaleString("ar-SA")} ر.س</span>
            </div>
            <div className="flex justify-between font-black text-lg text-primary border-t border-gray-200 pt-2 mt-2">
              <span>الإجمالي المستحق</span>
              <span>{invoice.total_amount?.toLocaleString("ar-SA")} ر.س</span>
            </div>
          </div>

          {invoice.status === "مدفوعة" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
              <p className="font-bold text-green-700">✅ تم الدفع</p>
              <p className="text-green-600 text-xs">طريقة: {invoice.payment_method} | مرجع: {invoice.payment_ref}</p>
              <p className="text-green-600 text-xs">وقت الدفع: {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString("ar-SA") : "—"}</p>
            </div>
          )}

          {onPay && (
            <button onClick={onPay}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
              <CreditCard className="w-4 h-4" />ادفع الآن — {invoice.total_amount?.toLocaleString("ar-SA")} ر.س
            </button>
          )}
        </div>
      </div>
    </div>
  );
}