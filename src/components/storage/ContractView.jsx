import { X, Printer } from "lucide-react";

const COMPANY = {
  name: "شركة التخزين الذاتي",
  address: "الرياض، المملكة العربية السعودية",
  phone: "920000000",
  email: "info@storage.com",
  cr: "1234567890",
  vat: "300000000000003",
};

export default function ContractView({ contract, onClose }) {
  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-bold text-gray-900">عقد إيجار وحدة تخزين</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted">
              <Printer className="w-4 h-4" />طباعة
            </button>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm" id="contract-print">
          {/* Header */}
          <div className="text-center space-y-1 border-b-2 border-gray-900 pb-4">
            <h1 className="text-2xl font-black text-gray-900">عقد إيجار وحدة تخزين ذاتي</h1>
            <p className="text-gray-500">Storage Unit Lease Agreement</p>
            <p className="font-bold text-primary">رقم العقد: {contract.contract_number}</p>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">الطرف الأول (المؤجر)</h3>
              <Row label="الاسم" value={COMPANY.name} />
              <Row label="السجل التجاري" value={COMPANY.cr} />
              <Row label="الرقم الضريبي" value={COMPANY.vat} />
              <Row label="العنوان" value={COMPANY.address} />
              <Row label="الهاتف" value={COMPANY.phone} />
              <Row label="البريد" value={COMPANY.email} />
            </div>
            <div className="border border-gray-200 rounded-xl p-4 space-y-2">
              <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">الطرف الثاني (المستأجر)</h3>
              <Row label="الاسم" value={contract.customer_name} />
              {contract.company_name && <Row label="الشركة" value={contract.company_name} />}
              {contract.commercial_reg && <Row label="السجل التجاري" value={contract.commercial_reg} />}
              {contract.tax_number && <Row label="الرقم الضريبي" value={contract.tax_number} />}
              <Row label="رقم الهوية" value={contract.customer_id_number || "—"} />
              <Row label="الهاتف" value={contract.customer_phone} />
              <Row label="البريد" value={contract.customer_email} />
            </div>
          </div>

          {/* Unit */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">تفاصيل الوحدة والعقد</h3>
            <div className="grid grid-cols-2 gap-4">
              <Row label="رقم الوحدة" value={contract.unit_number} />
              <Row label="الفرع" value={contract.branch} />
              <Row label="نوع المخزون" value={contract.storage_type || "—"} />
              <Row label="السعر الشهري" value={`${contract.monthly_price?.toLocaleString("ar-SA")} ريال`} />
              <Row label="تاريخ البداية" value={contract.start_date} />
              <Row label="تاريخ الانتهاء" value={contract.end_date} />
              <Row label="مدة العقد" value={`${contract.contract_months} شهر`} />
              <Row label="التجديد التلقائي" value={contract.auto_renew ? "مفعّل" : "غير مفعّل"} />
            </div>
          </div>

          {/* Terms */}
          <div className="border border-gray-200 rounded-xl p-4 space-y-2">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">الشروط والأحكام</h3>
            <div className="space-y-2 text-gray-600 text-xs leading-relaxed">
              <p><strong>1.</strong> يلتزم المستأجر بدفع الإيجار المحدد في العقد في مواعيده المقررة.</p>
              <p><strong>2.</strong> يُحظر على المستأجر تخزين أي مواد خطرة أو قابلة للاشتعال أو ممنوعة قانوناً.</p>
              <p><strong>3.</strong> لا تتحمل الشركة المؤجرة مسؤولية الأضرار الناجمة عن الاستخدام غير السليم.</p>
              <p><strong>4.</strong> يجب على المستأجر إخلاء الوحدة في نهاية مدة العقد، وإلا تُطبق رسوم إضافية يومية.</p>
              <p><strong>5.</strong> يجدد هذا العقد تلقائياً عند انتهاء مدته ما لم يُبلَّغ بعدم الرغبة في التجديد قبل 30 يوماً.</p>
              <p><strong>6.</strong> الوصول للوحدة خلال ساعات العمل الرسمية فقط (8ص - 10م).</p>
              <p><strong>7.</strong> يخضع هذا العقد لأحكام نظام العمل والأنظمة التجارية في المملكة العربية السعودية.</p>
              <p><strong>8.</strong> في حالة التأخر عن السداد يُطبق غرامة تأخير 2% من المبلغ عن كل أسبوع تأخير.</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-xl p-4 space-y-3 text-center">
              <p className="font-bold text-gray-900">توقيع الطرف الأول</p>
              <p className="text-xs text-muted-foreground">{COMPANY.name}</p>
              <div className="h-16 border-b border-dashed border-gray-300 flex items-end justify-center pb-1">
                <p className="text-xs text-muted-foreground">_________________</p>
              </div>
              <p className="text-xs text-muted-foreground">التاريخ: ________________</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-4 space-y-3 text-center">
              <p className="font-bold text-gray-900">توقيع الطرف الثاني</p>
              <p className="text-xs text-muted-foreground">{contract.customer_name}</p>
              <div className="h-16 flex items-center justify-center">
                {contract.signature_image
                  ? <img src={contract.signature_image} alt="توقيع" className="h-14 object-contain" />
                  : <p className="text-xs text-muted-foreground">_________________</p>}
              </div>
              <p className="text-xs text-muted-foreground">{contract.signed_at ? new Date(contract.signed_at).toLocaleDateString("ar-SA") : "التاريخ: ________________"}</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 border-t pt-3">
            هذا العقد محرر من نسختين لكل طرف نسخة — {COMPANY.name} © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 min-w-28 shrink-0">{label}:</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}