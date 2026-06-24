import { Printer } from "lucide-react";

const COMPANY = {
  name: "شركة سولديف للتخزين",
  nameEn: "SOLDEV Storage Co.",
  crNumber: "1234567890",
  vatNumber: "300123456700003",
  address: "الرياض، المملكة العربية السعودية",
  phone: "920000000",
  email: "info@storage.com",
  logo: "https://media.base44.com/images/public/69f7177c4ad8b8c70dc86a2e/dfe020004_Soldevwhitelogo.png",
};

export default function InvoiceTemplate({ invoice, onClose }) {
  const handlePrint = () => window.print();

  const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h3 className="font-bold text-gray-800">فاتورة ضريبية</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
              <Printer className="w-4 h-4" />طباعة
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">إغلاق</button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-8 space-y-6" id="invoice-print">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900">فاتورة ضريبية</h1>
              <p className="text-sm text-gray-500">Tax Invoice</p>
              <div className="mt-3 space-y-1 text-sm text-gray-700">
                <p className="font-bold text-lg text-primary">#{invoice.invoice_number}</p>
                <p>تاريخ الإصدار: <strong>{new Date().toLocaleDateString("ar-SA")}</strong></p>
                <p>تاريخ الاستحقاق: <strong>{invoice.due_date || "—"}</strong></p>
              </div>
            </div>
            <div className="text-left space-y-1">
              <div className="w-32 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-2">
                <span className="text-white font-black text-sm">SOLDEV</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{COMPANY.name}</p>
              <p className="text-xs text-gray-500">{COMPANY.address}</p>
              <p className="text-xs text-gray-500">ر.ت: {COMPANY.crNumber}</p>
              <p className="text-xs text-gray-500">الرقم الضريبي: {COMPANY.vatNumber}</p>
              <p className="text-xs text-gray-500">{COMPANY.phone} | {COMPANY.email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-0.5 bg-gradient-to-l from-primary to-orange-300" />

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">بيانات العميل · Customer</p>
              <p className="font-bold text-gray-900">{invoice.customer_name}</p>
              <p className="text-sm text-gray-600">{invoice.customer_email}</p>
              <p className="text-sm text-gray-600">{invoice.customer_phone}</p>
              {invoice.customer_id_number && <p className="text-sm text-gray-600">الهوية: {invoice.customer_id_number}</p>}
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">تفاصيل الوحدة · Unit Details</p>
              <p className="font-bold text-gray-900">وحدة: {invoice.unit_number}</p>
              <p className="text-sm text-gray-600">{invoice.branch}</p>
              <p className="text-sm text-gray-600">الفترة: {invoice.period_start} — {invoice.period_end}</p>
              <p className="text-sm text-gray-600">رقم الحجز: {invoice.booking_number}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="text-right px-4 py-3 rounded-tr-lg">الوصف</th>
                <th className="text-center px-4 py-3">الكمية</th>
                <th className="text-center px-4 py-3">سعر الوحدة</th>
                <th className="text-left px-4 py-3 rounded-tl-lg">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-gray-800">
                  إيجار وحدة تخزين — {invoice.unit_number} ({invoice.branch})
                  <br /><span className="text-xs text-gray-400">{invoice.period_start} إلى {invoice.period_end}</span>
                </td>
                <td className="px-4 py-3 text-center">{invoice.months_count} شهر</td>
                <td className="px-4 py-3 text-center">{fmt(invoice.monthly_price)} ر.س</td>
                <td className="px-4 py-3 text-left font-semibold">{fmt(invoice.subtotal)} ر.س</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600 py-1">
                <span>المجموع قبل الضريبة</span>
                <span>{fmt(invoice.subtotal)} ر.س</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 py-1">
                <span>ضريبة القيمة المضافة ({invoice.vat_rate || 15}%)</span>
                <span>{fmt(invoice.vat_amount)} ر.س</span>
              </div>
              <div className="flex justify-between font-bold text-base py-3 border-t-2 border-primary text-primary">
                <span>الإجمالي المستحق</span>
                <span>{fmt(invoice.total_amount)} ر.س</span>
              </div>
              <div className={`text-center py-2 rounded-xl text-sm font-bold ${invoice.status === "مدفوعة" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {invoice.status === "مدفوعة" ? `✅ مدفوعة — ${invoice.paid_at || ""}` : "⏳ غير مدفوعة"}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-400 space-y-1">
            <p>شكراً لتعاملكم معنا · Thank you for your business</p>
            <p>{COMPANY.name} — {COMPANY.phone} — {COMPANY.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}