import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Eye, X, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const STATUS_COLORS = {
  "Draft": "bg-gray-100 text-gray-600",
  "Pending Terms Approval": "bg-yellow-100 text-yellow-700",
  "Pending Signature": "bg-orange-100 text-orange-700",
  "Pending Payment": "bg-blue-100 text-blue-700",
  "Confirmed": "bg-green-100 text-green-700",
  "Cancelled": "bg-red-100 text-red-600",
  "Expired": "bg-gray-100 text-gray-500",
};

const STATUS_AR = {
  "Draft": "مسودة",
  "Pending Terms Approval": "بانتظار الموافقة",
  "Pending Signature": "بانتظار التوقيع",
  "Pending Payment": "بانتظار الدفع",
  "Confirmed": "مؤكد",
  "Cancelled": "ملغي",
  "Expired": "منتهي",
};

function BookingDetail({ booking, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h3 className="font-bold text-foreground">تفاصيل الحجز — {booking.booking_number}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[booking.status]}`}>{STATUS_AR[booking.status]}</span>
            <span className="text-xs text-muted-foreground">وحدة: {booking.unit_number} — {booking.branch}</span>
          </div>
          {/* Customer */}
          <Section title="بيانات العميل">
            <Row label="النوع" value={booking.customer_type} />
            <Row label="الاسم" value={booking.full_name} />
            <Row label="الجوال" value={booking.phone} />
            <Row label="البريد" value={booking.email} />
            <Row label="الهوية/السجل" value={booking.id_number || booking.commercial_reg} />
            {booking.company_name && <Row label="الشركة" value={booking.company_name} />}
            {booking.tax_number && <Row label="الرقم الضريبي" value={booking.tax_number} />}
            <Row label="نوع المخزون" value={booking.storage_type} />
          </Section>
          {/* Contract */}
          <Section title="تفاصيل العقد">
            <Row label="تاريخ البداية" value={booking.contract_start} />
            <Row label="مدة العقد" value={`${booking.contract_months} شهر`} />
            <Row label="السعر الشهري" value={`${booking.monthly_price?.toLocaleString("ar-SA")} ر.س`} />
            <Row label="الإجمالي" value={`${booking.total_amount?.toLocaleString("ar-SA")} ر.س`} />
          </Section>
          {/* Terms & Signature */}
          <Section title="الموافقة والتوقيع">
            <Row label="قبول الشروط" value={booking.terms_accepted ? `✅ ${booking.terms_accepted_at || ""}` : "❌ لم يوافق"} />
            <Row label="اسم الموقع" value={booking.signature_name || "—"} />
            <Row label="وقت التوقيع" value={booking.signed_at || "—"} />
            {booking.signature_image && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">التوقيع الإلكتروني:</p>
                <img src={booking.signature_image} alt="توقيع" className="border border-border rounded-lg h-20 bg-white" />
              </div>
            )}
          </Section>
          {/* Payment */}
          {booking.paid_at && (
            <Section title="الدفع">
              <Row label="طريقة الدفع" value={booking.payment_method} />
              <Row label="مرجع الدفع" value={booking.payment_ref} />
              <Row label="وقت الدفع" value={booking.paid_at} />
            </Section>
          )}
          {/* Attachments */}
          <Section title="المرفقات">
            {[["صورة الهوية", booking.id_image_url], ["السجل التجاري", booking.commercial_reg_url], ["شهادة ضريبية", booking.tax_cert_url], ["مستند تفويض", booking.auth_doc_url]]
              .filter(([, url]) => url)
              .map(([label, url]) => (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:underline">
                  <FileText className="w-3.5 h-3.5" />{label}
                </a>
              ))}
            {!booking.id_image_url && !booking.commercial_reg_url && <p className="text-xs text-muted-foreground">لا توجد مرفقات</p>}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-muted/20 rounded-xl border border-border p-4">
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

export default function StorageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    base44.entities.StorageBooking.list("-created_date").then(b => { setBookings(b); setLoading(false); });
  }, []);

  const filtered = bookings
    .filter(b => !filterStatus || b.status === filterStatus)
    .filter(b => !search || b.full_name?.includes(search) || b.unit_number?.includes(search) || b.booking_number?.includes(search) || b.email?.includes(search));

  const stats = Object.entries(STATUS_AR).map(([k, v]) => ({
    key: k, label: v, count: bookings.filter(b => b.status === k).length, color: STATUS_COLORS[k]
  }));

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">لوحة الحجوزات</h1>
          <p className="text-sm text-muted-foreground mt-0.5">متابعة جميع حجوزات وحدات التخزين</p>
        </div>
        <Link to="/storage-booking" className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
          + حجز جديد
        </Link>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 lg:grid-cols-7 gap-3">
        {stats.map(s => (
          <button key={s.key} onClick={() => setFilterStatus(filterStatus === s.key ? "" : s.key)}
            className={`rounded-xl border p-3 text-center transition-all cursor-pointer ${filterStatus === s.key ? "ring-2 ring-primary" : "hover:shadow-sm"} bg-card`}>
            <p className="text-xl font-bold text-foreground">{s.count}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
          </button>
        ))}
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث باسم أو وحدة..."
          className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["رقم الحجز","العميل","الوحدة","المبلغ","بداية العقد","الحالة","تفاصيل"].map(h => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد حجوزات</td></tr>
              : filtered.map(b => (
                <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{b.booking_number || b.id?.slice(0,8)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{b.full_name}</p>
                    <p className="text-xs text-muted-foreground">{b.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.unit_number}</p>
                    <p className="text-xs text-muted-foreground">{b.branch}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">{b.total_amount?.toLocaleString("ar-SA")} ر.س</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{b.contract_start || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>{STATUS_AR[b.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(b)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Eye className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {selected && <BookingDetail booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}