import { Printer } from "lucide-react";

const COMPANY = {
  name: "شركة سولديف للتخزين",
  crNumber: "1234567890",
  vatNumber: "300123456700003",
  address: "الرياض، المملكة العربية السعودية",
  phone: "920000000",
  email: "info@storage.com",
};

function addMonths(dateStr, months) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export default function ContractTemplate({ booking, onClose }) {
  const handlePrint = () => window.print();
  const contractEnd = booking.contract_end || addMonths(booking.contract_start, booking.contract_months || 1);
  const totalAmount = booking.total_amount || (booking.monthly_price * booking.contract_months);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl">
        {/* Actions */}
        <div className="flex items-center justify-between p-4 border-b print:hidden">
          <h3 className="font-bold text-gray-800">عقد إيجار وحدة تخزين</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium">
              <Printer className="w-4 h-4" />طباعة
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">إغلاق</button>
          </div>
        </div>

        {/* Contract Body */}
        <div className="p-10 space-y-6 text-gray-800 leading-relaxed" style={{ fontFamily: "serif" }}>
          {/* Header */}
          <div className="text-center space-y-2 border-b-2 border-gray-900 pb-6">
            <div className="w-20 h-8 bg-gray-900 rounded mx-auto flex items-center justify-center mb-3">
              <span className="text-white font-black text-xs">SOLDEV</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900">عقد إيجار وحدة تخزين</h1>
            <p className="text-sm text-gray-500">Storage Unit Lease Agreement</p>
            <p className="text-sm font-semibold">رقم العقد: {booking.booking_number}</p>
          </div>

          {/* Preamble */}
          <p className="text-sm leading-8">
            تم الاتفاق والتعاقد بين الطرفين الموضحين أدناه على إيجار وحدة التخزين المحددة وفق الشروط والأحكام المدرجة في هذا العقد،
            وذلك استناداً لنظام الإيجار السعودي ولوائحه التنفيذية.
          </p>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6 border border-gray-300 rounded-xl p-5">
            <div className="space-y-2">
              <h3 className="font-bold text-base border-b border-gray-200 pb-2">الطرف الأول (المؤجر)</h3>
              <p className="text-sm"><strong>الاسم:</strong> {COMPANY.name}</p>
              <p className="text-sm"><strong>السجل التجاري:</strong> {COMPANY.crNumber}</p>
              <p className="text-sm"><strong>الرقم الضريبي:</strong> {COMPANY.vatNumber}</p>
              <p className="text-sm"><strong>العنوان:</strong> {COMPANY.address}</p>
              <p className="text-sm"><strong>الهاتف:</strong> {COMPANY.phone}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-base border-b border-gray-200 pb-2">الطرف الثاني (المستأجر)</h3>
              <p className="text-sm"><strong>الاسم:</strong> {booking.full_name}</p>
              {booking.company_name && <p className="text-sm"><strong>الشركة:</strong> {booking.company_name}</p>}
              <p className="text-sm"><strong>الهوية/السجل:</strong> {booking.id_number || booking.commercial_reg || "—"}</p>
              {booking.tax_number && <p className="text-sm"><strong>الرقم الضريبي:</strong> {booking.tax_number}</p>}
              <p className="text-sm"><strong>الجوال:</strong> {booking.phone}</p>
              <p className="text-sm"><strong>البريد:</strong> {booking.email}</p>
            </div>
          </div>

          {/* Unit Details */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="font-bold text-base mb-3">تفاصيل الوحدة المؤجرة</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <p><strong>رقم الوحدة:</strong> {booking.unit_number}</p>
              <p><strong>الفرع / الموقع:</strong> {booking.branch}</p>
              <p><strong>نوع المخزون:</strong> {booking.storage_type || "—"}</p>
              <p><strong>السعر الشهري:</strong> {booking.monthly_price?.toLocaleString("ar-SA")} ر.س</p>
              <p><strong>تاريخ بداية العقد:</strong> {booking.contract_start}</p>
              <p><strong>تاريخ نهاية العقد:</strong> {contractEnd}</p>
              <p><strong>مدة العقد:</strong> {booking.contract_months} شهر</p>
              <p><strong>إجمالي قيمة العقد:</strong> {totalAmount?.toLocaleString("ar-SA")} ر.س</p>
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-3">
            <h3 className="font-bold text-base">الشروط والأحكام</h3>
            {[
              "يلتزم المستأجر بدفع الإيجار المقرر في مواعيده المحددة، ويُعد التأخر في السداد إخلالاً بالعقد.",
              "يُحظر على المستأجر تخزين المواد الخطرة أو القابلة للاشتعال أو المواد ذات الرائحة الكريهة أو المحظورة نظاماً.",
              "لا تتحمل شركة المؤجر أي مسؤولية عن الأضرار الناجمة عن سوء استخدام المستأجر للوحدة.",
              "يلتزم المستأجر بإخلاء الوحدة في نهاية مدة العقد، وإلا تُطبق رسوم إضافية تعادل ضعف الإيجار الشهري.",
              "يحق للمؤجر فسخ العقد في حال ثبوت مخالفة أي من الشروط المذكورة بعد إخطار المستأجر.",
              "التأمين على المحتويات مسؤولية المستأجر حصراً.",
              "يُسمح بالدخول للوحدة خلال ساعات العمل الرسمية (8 صباحاً — 10 مساءً) ما لم يُتفق على خلاف ذلك.",
              "يجدد هذا العقد تلقائياً لمدة مماثلة ما لم يُبلَّغ الطرف الآخر بالرغبة في عدم التجديد قبل 15 يوماً من انتهائه.",
              "يخضع هذا العقد لأحكام نظام الإيجار في المملكة العربية السعودية، وأي نزاع يُحسم أمام الجهات القضائية المختصة.",
            ].map((term, i) => (
              <div key={i} className="flex gap-3 text-sm leading-7">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">{i + 1}</span>
                <p>{term}</p>
              </div>
            ))}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-300">
            <div className="space-y-4">
              <p className="font-bold text-center">توقيع الطرف الأول (المؤجر)</p>
              <div className="h-16 border-b-2 border-gray-400" />
              <p className="text-sm text-center text-gray-600">{COMPANY.name}</p>
              <p className="text-xs text-center text-gray-400">التاريخ: _______________</p>
            </div>
            <div className="space-y-4">
              <p className="font-bold text-center">توقيع الطرف الثاني (المستأجر)</p>
              {booking.signature_image
                ? <img src={booking.signature_image} alt="توقيع" className="h-16 object-contain mx-auto border-b-2 border-gray-400 w-full" />
                : <div className="h-16 border-b-2 border-gray-400" />}
              <p className="text-sm text-center text-gray-600">{booking.full_name}</p>
              <p className="text-xs text-center text-gray-400">التاريخ: {booking.signed_at ? new Date(booking.signed_at).toLocaleDateString("ar-SA") : "_______________"}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-200">
            <p>{COMPANY.name} — {COMPANY.address} — {COMPANY.phone} — {COMPANY.email}</p>
            <p className="mt-1">هذا عقد قانوني ملزم للطرفين وفق أحكام نظام الإيجار السعودي</p>
          </div>
        </div>
      </div>
    </div>
  );
}