import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, X, Warehouse, Phone, Mail, Shield, Camera, Zap, User, LogIn } from "lucide-react";
import { getCustomerSession, clearCustomerSession } from "../lib/customerAuth";

const DISCOUNT_OPTIONS = [
  { months: 1,  label: "شهري (بدون خصم)",   discount: 0 },
  { months: 3,  label: "3 أشهر (خصم 5%)",   discount: 0.05 },
  { months: 6,  label: "6 أشهر (خصم 15%)",  discount: 0.15 },
  { months: 12, label: "سنوي (خصم 35%)",    discount: 0.35 },
];

// ── Booking Modal ─────────────────────────────────────────────────────────────
function BookingModal({ unit, onClose, onBook }) {
  const [selectedPlan, setSelectedPlan] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  const plan = DISCOUNT_OPTIONS[selectedPlan];
  const base = unit.monthly_price * plan.months;
  const discount = base * plan.discount;
  const total = Math.round(base - discount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-lg">خيارات الإيجار</h3>
            <p className="text-white/80 text-sm">الوحدة: {unit.unit_number} — {unit.unit_name || unit.branch}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Billing Period */}
          <div>
            <p className="font-bold text-foreground mb-1">فترة الفاتورة</p>
            <p className="text-xs text-muted-foreground mb-3">اختر المدة التي ترغب في الدفع عنها</p>
            <div className="space-y-2">
              {DISCOUNT_OPTIONS.map((opt, i) => (
                <label key={i} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedPlan === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedPlan === i ? "border-primary" : "border-border"}`}>
                    {selectedPlan === i && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                  <input type="radio" className="hidden" checked={selectedPlan === i} onChange={() => setSelectedPlan(i)} />
                  <span className="text-sm text-foreground flex-1">{opt.label}</span>
                  {opt.discount > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">وفر {Math.round(opt.discount * 100)}%</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Start Date */}
          <div>
            <p className="font-bold text-foreground mb-1">اختر تاريخ دخول المستودع</p>
            <p className="text-xs text-muted-foreground mb-2">اختر تاريخ الدخول الذي تفضله</p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">يبدأ في</p>
              <input type="date" value={startDate} min={new Date().toISOString().slice(0, 10)}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary text-foreground" />
            </div>
          </div>

          {/* Promo Code */}
          <div className="flex gap-2">
            <input value={promoCode} onChange={e => setPromoCode(e.target.value)}
              placeholder="أدخل كود الخصم"
              className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
            <button onClick={() => setPromoApplied(true)}
              className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors">
              تطبيق
            </button>
          </div>
          {promoApplied && <p className="text-xs text-green-600 -mt-2">✅ تم تطبيق الكود</p>}

          {/* Divider + Total */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">الإجمالي:</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary">{total.toLocaleString("ar-SA")}</span>
                <span className="text-sm text-muted-foreground mr-1">ر.س</span>
                {plan.discount > 0 && <p className="text-xs text-green-600 line-through text-right">{base.toLocaleString("ar-SA")} ر.س</p>}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 border-2 border-primary text-primary rounded-xl font-semibold text-sm hover:bg-primary/5 transition-colors">
              إلغاء
            </button>
            <button onClick={() => onBook(unit, { months: plan.months, total, startDate, discount: plan.discount })}
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/25">
              استئجار
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Unit Card ─────────────────────────────────────────────────────────────────
function UnitCard({ unit, onBook }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group border border-gray-100">
      {/* Image */}
      <div className="relative overflow-hidden">
        {unit.image_url
          ? <img src={unit.image_url} alt={unit.unit_number} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
          : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <Warehouse className="w-16 h-16 text-gray-300" />
            </div>
          )}
        {/* Type badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm ${unit.unit_type === "مكيف" ? "bg-blue-500 text-white" : "bg-amber-500 text-white"}`}>
            {unit.unit_type === "مكيف" ? "❄️ مكيف" : "🏭 غير مكيف"}
          </span>
        </div>
        {/* Features */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {unit.has_security && <span title="أمان 24/7" className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm"><Shield className="w-3.5 h-3.5 text-blue-600" /></span>}
          {unit.has_cameras && <span title="كاميرات" className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm"><Camera className="w-3.5 h-3.5 text-purple-600" /></span>}
          {unit.easy_access && <span title="وصول سهل" className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm"><Zap className="w-3.5 h-3.5 text-green-600" /></span>}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-bold text-gray-900 text-lg">{unit.unit_number}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{unit.branch}</p>
          </div>
          {unit.area_sqm > 0 && (
            <div className="text-right">
              <p className="font-bold text-gray-900">{unit.area_sqm} <span className="text-xs font-normal text-gray-500">م²</span></p>
              {unit.length_m > 0 && <p className="text-xs text-gray-400">{unit.length_m}×{unit.width_m} م</p>}
            </div>
          )}
        </div>

        {unit.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{unit.description}</p>}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <span className="text-2xl font-black text-primary">{unit.monthly_price?.toLocaleString("ar-SA")}</span>
            <span className="text-xs text-gray-500 mr-1">ر.س / شهرياً</span>
          </div>
        </div>
      </div>

      {/* Book Button */}
      <button onClick={() => onBook(unit)}
        className="w-full py-3.5 bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors">
        احجز هنا
      </button>
    </div>
  );
}

// ── Main Public Page ──────────────────────────────────────────────────────────
export default function PublicStorageRental() {
  const [customerSession, setCustomerSession_] = useState(() => getCustomerSession());
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [bookingOptions, setBookingOptions] = useState(null);

  // Filters
  const [filterBranch, setFilterBranch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(99999);
  const [minArea, setMinArea] = useState(0);
  const [maxArea, setMaxArea] = useState(9999);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    base44.entities.StorageUnit.list()
      .then(allUnits => {
        const u = allUnits.filter(x => x.status === "متاحة");
        setUnits(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const branches = [...new Set(units.map(u => u.branch).filter(Boolean))];

  const filtered = units.filter(u =>
    (!filterBranch || u.branch === filterBranch) &&
    (!filterType || u.unit_type === filterType) &&
    (u.monthly_price >= minPrice && u.monthly_price <= maxPrice) &&
    (u.area_sqm >= minArea && u.area_sqm <= maxArea)
  );

  const handleOpenModal = (unit) => {
    if (!getCustomerSession()) {
      window.location.href = `/customer-login?next=/rent`;
      return;
    }
    setSelectedUnit(unit);
  };

  const handleBook = (unit, opts) => {
    setSelectedUnit(null);
    // Navigate to booking flow with pre-filled data via query params
    const params = new URLSearchParams({
      unit_id: unit.id,
      unit_number: unit.unit_number,
      unit_name: unit.unit_name || "",
      branch: unit.branch,
      monthly_price: unit.monthly_price,
      months: opts.months,
      total: opts.total,
      start_date: opts.startDate,
      discount: opts.discount,
    });
    window.location.href = `/storage-booking?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Warehouse className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg leading-none">مخزن</p>
              <p className="text-xs text-primary font-medium">Self Storage</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#units" className="text-primary font-bold">الوحدات المتاحة</a>
            <a href="#contact" className="hover:text-primary transition-colors">تواصل معنا</a>
          </div>
          <div className="flex items-center gap-2">
            {customerSession ? (
              <>
                <a href="/my-account" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                  <User className="w-4 h-4" />حسابي
                </a>
                <button onClick={() => { clearCustomerSession(); setCustomerSession_(null); }}
                  className="px-3 py-2 text-sm text-gray-500 border border-gray-200 rounded-xl hover:border-red-300 hover:text-red-500 transition-colors">خروج</button>
              </>
            ) : (
              <a href="/customer-login" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
                <LogIn className="w-4 h-4" />تسجيل الدخول
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary via-primary to-orange-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">أحجز الآن</h1>
          <p className="text-white/85 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            استمتع بحرية مساحة خالية من الفوضى. حلول التخزين الآمنة والمريحة في متناول يدك.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-6 text-sm">
            {[["🔒","أمان 24/7"],["❄️","وحدات مكيفة"],["🚪","وصول سهل"],["📋","عقد فوري"]].map(([icon, label]) => (
              <div key={label} className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2">
                <span>{icon}</span><span className="font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section id="units" className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Branch */}
            <div className="flex-1 min-w-36">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">الموقع</label>
              <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary appearance-none bg-white text-gray-700">
                <option value="">الكل</option>
                {branches.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            {/* Type */}
            <div className="flex-1 min-w-36">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">نوع الوحدة</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary appearance-none bg-white text-gray-700">
                <option value="">الكل</option>
                <option>مكيف</option>
                <option>غير مكيف</option>
              </select>
            </div>
            {/* Price Range */}
            <div className="flex-1 min-w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">السعر (ر.س/شهر)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={minPrice} onChange={e => setMinPrice(+e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary text-center" />
                <span className="text-gray-400 text-sm">—</span>
                <input type="number" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} placeholder="أقصى"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary text-center" />
              </div>
            </div>
            {/* Area */}
            <div className="flex-1 min-w-48">
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">المساحة (م²)</label>
              <div className="flex items-center gap-2">
                <input type="number" value={minArea} onChange={e => setMinArea(+e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary text-center" />
                <span className="text-gray-400 text-sm">—</span>
                <input type="number" value={maxArea} onChange={e => setMaxArea(+e.target.value)} placeholder="أقصى"
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary text-center" />
              </div>
            </div>
            <button onClick={() => { setFilterBranch(""); setFilterType(""); setMinPrice(0); setMaxPrice(99999); setMinArea(0); setMaxArea(9999); }}
              className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-md shadow-primary/20 whitespace-nowrap">
              تطبيق
            </button>
          </div>
        </div>
      </section>

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-4 mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {loading ? "جاري التحميل..." : `${filtered.length} وحدة متاحة`}
        </p>
        {filtered.length > 0 && (
          <div className="flex gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5 text-blue-600" />أمان</span>
            <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5 text-purple-600" />كاميرات</span>
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-green-600" />وصول سهل</span>
          </div>
        )}
      </div>

      {/* Units Grid */}
      <main className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-md animate-pulse">
                <div className="w-full h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-6 bg-gray-200 rounded w-1/3 mt-3" />
                </div>
                <div className="h-12 bg-gray-200" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
              <Warehouse className="w-10 h-10 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">لا توجد وحدات تطابق بحثك</p>
            <p className="text-gray-400 text-sm">حاول تعديل الفلاتر</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(unit => (
              <UnitCard key={unit.id} unit={unit} onBook={handleOpenModal} />
            ))}
          </div>
        )}
      </main>

      {/* Contact / Footer */}
      <footer id="contact" className="bg-primary text-white py-10 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <p className="font-black text-xl">مخزن</p>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">حلول تخزين آمنة ومرنة تناسب احتياجاتك.</p>
          </div>
          <div>
            <h4 className="font-bold mb-3">روابط سريعة</h4>
            <div className="space-y-2 text-white/70 text-sm">
              <a href="#units" className="block hover:text-white transition-colors">أحجز الآن</a>
              <a href="#" className="block hover:text-white transition-colors">كيف تحجز؟</a>
              <a href="/storage-bookings" className="block hover:text-white transition-colors">تتبع حجزي</a>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-3">تواصل معنا</h4>
            <div className="space-y-2 text-white/70 text-sm">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>920000000</span></div>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>info@storage.com</span></div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><span>الرياض، جدة، الدمام</span></div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/20 mt-8 pt-4 text-center text-white/50 text-xs">
          © 2026 جميع الحقوق محفوظة
        </div>
      </footer>

      {/* Booking Modal */}
      {selectedUnit && (
        <BookingModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} onBook={handleBook} />
      )}
    </div>
  );
}