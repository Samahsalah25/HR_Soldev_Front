import { useState, useEffect } from "react";
import { Search, Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import {
  getRentals,
  RENTAL_STATE_AR,
} from "@/api/storageRentalsApi";
import { usePagination } from "@/lib/usePagination";
import TablePagination from "@/components/ui/TablePagination";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600",
  waiting_approval: "bg-yellow-100 text-yellow-700",
  waiting_signature: "bg-orange-100 text-orange-700",
  waiting_payment: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
  ended: "bg-gray-100 text-gray-500",
};

function BookingDetail({ booking, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" dir="rtl">
      <div className="bg-card rounded-2xl border border-border w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card">
          <h3 className="font-bold text-foreground">تفاصيل الحجز — #{booking.id}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* State */}
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[booking.state]}`}>{booking.stateAr}</span>
            <span className="text-xs text-muted-foreground">وحدة: {booking.unit_number} — {booking.branch}</span>
          </div>
          {/* Customer */}
          <Section title="بيانات العميل">
            <Row label="النوع" value={booking.customer_type_ar} />
            <Row label="الاسم" value={booking.customer_name || booking.company_name} />
            <Row label="الجوال" value={booking.customer_mobile || booking.company_mobile} />
            <Row label="البريد" value={booking.customer_email} />
            <Row label="الهوية / السجل" value={booking.customer_id_number || booking.company_cr_number} />
            {booking.company_rep_name && <Row label="المفوض" value={booking.company_rep_name} />}
            <Row label="نوع المخزون" value={booking.stored_objects_type} />
          </Section>
          {/* Contract */}
          <Section title="تفاصيل العقد">
            <Row label="تاريخ البداية" value={booking.contract_start_date} />
            <Row label="المدة" value={booking.duration_name} />
            <Row label="السعر الشهري" value={`${booking.monthly_price?.toLocaleString("ar-SA")} ر.س`} />
            <Row label="الإجمالي" value={`${booking.total_price?.toLocaleString("ar-SA")} ر.س`} />
          </Section>
          {/* Terms & Signature */}
          <Section title="الموافقة والتوقيع">
            <Row label="قبول الشروط" value={booking.is_terms_agreed ? "✅ وافق" : "❌ لم يوافق"} />
            <Row label="اسم الموقع" value={booking.signature_name || "—"} />
          </Section>
          {/* Payment */}
          {booking.payment_type && (
            <Section title="الدفع">
              <Row label="وسيلة الدفع" value={booking.payment_type_ar} />
              <Row label="خيار الدفع" value={booking.payment_option === "full" ? "دفع كامل" : "عربون 25%"} />
            </Section>
          )}
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
    getRentals({ state: filterStatus || undefined, search: search || undefined })
      .then(data => { setBookings(data); setLoading(false); });
  }, [filterStatus, search]);

  // الـ API بيعمل filter بـ state و search — بس نستخدم bookings مباشرة
  const filtered = bookings;
  const bookingsPagination = usePagination(filtered, 20);

  const stats = Object.entries(RENTAL_STATE_AR).map(([k, v]) => ({
    key: k, label: v,
    count: bookings.filter(b => b.state === k).length,
    color: STATUS_COLORS[k],
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
            {["رقم الحجز", "العميل", "الوحدة", "المبلغ", "بداية العقد", "الحالة", "تفاصيل"].map(h => (
              <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">لا توجد حجوزات</td></tr>
                : bookingsPagination.pageItems.map(b => (
                  <tr key={b.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">#{b.id}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{b.customer_name || b.company_name}</p>
                      <p className="text-xs text-muted-foreground">{b.customer_email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{b.unit_number}</p>
                      <p className="text-xs text-muted-foreground">{b.branch}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-primary">{b.total_price?.toLocaleString("ar-SA")} ر.س</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{b.contract_start_date || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[b.state]}`}>{b.stateAr}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setSelected(b)} className="p-1.5 hover:bg-muted rounded text-muted-foreground"><Eye className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        <TablePagination
          page={bookingsPagination.page}
          totalPages={bookingsPagination.totalPages}
          totalItems={bookingsPagination.totalItems}
          pageSize={bookingsPagination.pageSize}
          onPageChange={bookingsPagination.setPage}
        />
      </div>
      {selected && <BookingDetail booking={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}