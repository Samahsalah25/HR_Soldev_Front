import { useState, useEffect, useRef } from "react";
import { CheckCircle, Warehouse, User, PenLine, CreditCard, ChevronLeft, Search, X, Loader2 } from "lucide-react";
import { getCustomerSession } from "../lib/customerAuth";
import {
  getAvailableUnits,
  getRentalDurations,
  createRental,
  updateRental,
  buildSingleRentalFormData,
  buildCompanyRentalFormData,
  buildUpdateRentalFormData,
  RENTAL_STATE_API,
  PAYMENT_TYPE_API,
  PAYMENT_OPTION_API,
  fromApiRental,
} from "@/api/storageRentalsApi";
import { fromApiUnit } from "@/api/storageUnitsApi";

const STEPS = [
  { id: 1, label: "اختيار الوحدة", icon: Warehouse },
  { id: 2, label: "بيانات العميل", icon: User },
  { id: 3, label: "الشروط والتوقيع", icon: PenLine },
  { id: 4, label: "الدفع", icon: CreditCard },
  { id: 5, label: "التأكيد", icon: CheckCircle },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
    </div>
  );
}

function NavButtons({ onBack, onNext, canNext, nextLabel = "التالي" }) {
  return (
    <div className="flex justify-between pt-2">
      <button onClick={onBack}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
        <ChevronLeft className="w-4 h-4" />السابق
      </button>
      <button onClick={onNext} disabled={!canNext}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-primary/90">
        {nextLabel}
      </button>
    </div>
  );
}

function FileInput({ label, file, onChange }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {file && <p className="text-xs text-green-600">✅ {typeof file === "string" ? "تم الرفع" : file.name}</p>}
      <input type="file" onChange={e => e.target.files[0] && onChange(e.target.files[0])}
        className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:bg-primary/10 file:text-primary file:rounded-lg" />
    </div>
  );
}

// ─── Step 1: اختيار الوحدة ────────────────────────────────────────────────────
function StepSelectUnit({ onSelect }) {
  const [units, setUnits] = useState([]);
  const [durations, setDurations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    Promise.all([
      getAvailableUnits(),           // GET /storage/rentals/available-units
      getRentalDurations(),          // GET /storage/rentals/durations
    ]).then(([u, d]) => {
      setUnits(u.map(fromApiUnit));
      setDurations(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const branches = [...new Set(units.map(u => u.branch).filter(Boolean))];

  const filtered = units
    .filter(u => !filterBranch || u.branch === filterBranch)
    .filter(u => !filterType || u.unit_type === filterType)
    .filter(u => !search || u.unit_number?.includes(search) || u.unit_name?.includes(search));

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">اختر الوحدة المناسبة</h2>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="ابحث برقم الوحدة..."
            className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
        </div>
        <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background">
          <option value="">كل الفروع</option>
          {branches.map(b => <option key={b}>{b}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg bg-background">
          <option value="">كل الأنواع</option>
          <option value="ac">مكيف</option>
          <option value="no_ac">غير مكيف</option>
        </select>
      </div>
      {loading ? <p className="text-center py-12 text-muted-foreground">جاري التحميل...</p>
        : filtered.length === 0 ? <p className="text-center py-12 text-muted-foreground">لا توجد وحدات متاحة</p>
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(u => (
                <div key={u.id} onClick={() => onSelect(u, durations)}
                  className="bg-card rounded-xl border-2 border-border hover:border-primary cursor-pointer transition-all hover:shadow-md group">
                  {u.image_url
                    ? <img src={u.image_url} alt="" className="w-full h-36 object-cover rounded-t-xl" />
                    : <div className="w-full h-36 bg-muted/50 flex items-center justify-center rounded-t-xl">
                      <Warehouse className="w-10 h-10 text-muted-foreground/30" />
                    </div>}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-foreground group-hover:text-primary">{u.unit_number}</p>
                        <p className="text-xs text-muted-foreground">{u.branch}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.unit_type === "مكيف" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                        {u.unit_type}
                      </span>
                    </div>
                    {u.area_sqm > 0 && <p className="text-xs text-muted-foreground">📐 {u.area_sqm} م²</p>}
                    <p className="font-bold text-primary text-lg">
                      {u.monthly_price?.toLocaleString("ar-SA")} <span className="text-xs font-normal text-muted-foreground">ر.س/شهر</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  );
}

// ─── Step 2: بيانات العميل ────────────────────────────────────────────────────
function StepCustomerData({ data, durations, onChange, onNext, onBack }) {
  const set = (k, v) => onChange({ ...data, [k]: v });
  const isCompany = data.customer_type === "company";

  const canNext = data.contract_start_date && data.contract_duration_id &&
    (isCompany
      ? data.company_name && data.company_rep_name && data.company_mobile && data.customer_email && data.company_cr_number && data.stored_objects_type
      : data.customer_name && data.customer_mobile && data.customer_email && data.customer_id_number && data.stored_objects_type);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">بيانات العميل</h2>

      {/* customer_type: single | company */}
      <div className="flex gap-3">
        {[["single", "👤 فرد"], ["company", "🏢 شركة"]].map(([val, label]) => (
          <button key={val} onClick={() => set("customer_type", val)}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all
              ${data.customer_type === val ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* مدة العقد: contract_duration_id */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="تاريخ بداية العقد *" type="date" value={data.contract_start_date}
          onChange={v => set("contract_start_date", v)} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">مدة العقد *</label>
          <select value={data.contract_duration_id || ""} onChange={e => set("contract_duration_id", +e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background">
            <option value="">اختر المدة...</option>
            {durations.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* نوع المخزون: stored_objects_type */}
      <Field label="نوع المخزون *" value={data.stored_objects_type}
        onChange={v => set("stored_objects_type", v)} placeholder="أثاث، بضاعة، أرشيف..." />

      {/* حقول الفرد */}
      {!isCompany && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="الاسم الكامل *" value={data.customer_name} onChange={v => set("customer_name", v)} />
          <Field label="رقم الجوال *" value={data.customer_mobile} onChange={v => set("customer_mobile", v)} />
          <Field label="البريد الإلكتروني *" type="email" value={data.customer_email} onChange={v => set("customer_email", v)} />
          <Field label="رقم الهوية / الإقامة *" value={data.customer_id_number} onChange={v => set("customer_id_number", v)} />
          <Field label="تاريخ الميلاد" type="date" value={data.customer_dob} onChange={v => set("customer_dob", v)} />
        </div>
      )}

      {/* حقول الشركة */}
      {isCompany && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="اسم الشركة *" value={data.company_name} onChange={v => set("company_name", v)} />
          <Field label="اسم المفوض *" value={data.company_rep_name} onChange={v => set("company_rep_name", v)} />
          <Field label="جوال الشركة *" value={data.company_mobile} onChange={v => set("company_mobile", v)} />
          <Field label="البريد الإلكتروني *" type="email" value={data.customer_email} onChange={v => set("customer_email", v)} />
          <Field label="رقم السجل التجاري *" value={data.company_cr_number} onChange={v => set("company_cr_number", v)} />
        </div>
      )}

      {/* المرفقات */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">المرفقات</h3>
        {!isCompany ? (
          <FileInput label="صورة الهوية (customer_id_photo)"
            file={data.customer_id_photo}
            onChange={f => set("customer_id_photo", f)} />
        ) : (
          <>
            <FileInput label="ملف السجل التجاري (company_cr_file)"
              file={data.company_cr_file}
              onChange={f => set("company_cr_file", f)} />
            <FileInput label="شهادة ضريبية (company_tax_cert_file)"
              file={data.company_tax_cert_file}
              onChange={f => set("company_tax_cert_file", f)} />
            <FileInput label="مستند تفويض (company_auth_doc_file)"
              file={data.company_auth_doc_file}
              onChange={f => set("company_auth_doc_file", f)} />
          </>
        )}
      </div>

      <NavButtons onBack={onBack} onNext={onNext} canNext={canNext} />
    </div>
  );
}

// ─── Step 3: الشروط والتوقيع ──────────────────────────────────────────────────
function StepTermsAndSign({ data, unit, onChange, onNext, onBack }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signMode, setSignMode] = useState("draw");
  const [signText, setSignText] = useState("");

  const startDraw = (e) => {
    setDrawing(true);
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo((e.touches?.[0]?.clientX ?? e.clientX) - rect.left,
      (e.touches?.[0]?.clientY ?? e.clientY) - rect.top);
  };
  const draw = (e) => {
    if (!drawing) return;
    const ctx = canvasRef.current.getContext("2d");
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineTo((e.touches?.[0]?.clientX ?? e.clientX) - rect.left,
      (e.touches?.[0]?.clientY ?? e.clientY) - rect.top);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.stroke();
    setHasSignature(true);
  };
  const stopDraw = () => setDrawing(false);
  const clearCanvas = () => { canvasRef.current.getContext("2d").clearRect(0, 0, 500, 120); setHasSignature(false); };

  // تحويل الـ canvas إلى Blob عشان نرسله كـ file في FormData
  const getSignatureBlob = () => new Promise(resolve => {
    canvasRef.current.toBlob(blob => resolve(blob), "image/png");
  });

  const confirmSignature = async () => {
    let sigBlob = null;
    if (signMode === "draw" && hasSignature) {
      sigBlob = await getSignatureBlob();
    } else if (signMode === "text" && signText.trim().length > 2) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "italic 36px serif";
      ctx.fillStyle = "#1e293b";
      ctx.fillText(signText, 20, 60);
      sigBlob = await getSignatureBlob();
    }
    // sigBlob → signature_image في buildUpdateRentalFormData
    onChange({
      ...data,
      is_terms_agreed: true,           // is_terms_agreed
      signature_name: data.customer_name || data.company_rep_name || "",  // signature_name
      signature_image: sigBlob,        // signature_image (Blob → File)
    });
    onNext();
  };

  const canConfirm = data.is_terms_agreed && (signMode === "draw" ? hasSignature : signText.trim().length > 2);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">مراجعة الشروط والتوقيع</h2>
      <div className="bg-muted/30 rounded-xl border border-border p-4 text-sm">
        <p><span className="text-muted-foreground">الوحدة:</span> <strong>{unit?.unit_number} — {unit?.branch}</strong></p>
        <p><span className="text-muted-foreground">السعر الشهري:</span> <strong className="text-primary">{unit?.monthly_price?.toLocaleString("ar-SA")} ر.س</strong></p>
        <p><span className="text-muted-foreground">بداية العقد:</span> <strong>{data.contract_start_date}</strong></p>
      </div>

      {/* الشروط */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground">الشروط والأحكام</h3>
        <div className="h-36 overflow-y-auto text-xs text-muted-foreground leading-relaxed space-y-1">
          <p><strong>1.</strong> يلتزم المستأجر بدفع الإيجار في مواعيده المحددة.</p>
          <p><strong>2.</strong> يُحظر تخزين المواد الخطرة أو المحظورة قانوناً.</p>
          <p><strong>3.</strong> لا تتحمل الشركة مسؤولية الأضرار الناجمة عن سوء الاستخدام.</p>
          <p><strong>4.</strong> يلتزم المستأجر بإخلاء الوحدة في نهاية العقد.</p>
          <p><strong>5.</strong> يجدد العقد تلقائياً ما لم يُبلَّغ قبل 15 يوماً بعدم التجديد.</p>
        </div>
        {/* is_terms_agreed */}
        <label className="flex items-start gap-3 cursor-pointer bg-primary/5 border border-primary/20 rounded-lg p-3">
          <input type="checkbox" checked={!!data.is_terms_agreed}
            onChange={e => onChange({ ...data, is_terms_agreed: e.target.checked })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">أوافق على الشروط والأحكام</span>
        </label>
      </div>

      {/* التوقيع: signature_name + signature_image */}
      <div className={`space-y-3 transition-opacity ${data.is_terms_agreed ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <h3 className="font-semibold text-foreground">التوقيع الإلكتروني (signature_image)</h3>
        <div className="flex gap-2">
          {[["draw", "رسم"], ["text", "كتابة"]].map(([m, l]) => (
            <button key={m} onClick={() => setSignMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${signMode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
        {signMode === "draw" ? (
          <div className="space-y-2">
            <canvas ref={canvasRef} width={500} height={120}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              className="w-full border-2 border-dashed border-border rounded-xl bg-white cursor-crosshair touch-none" style={{ height: 120 }} />
            <button onClick={clearCanvas} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="w-3 h-3" />مسح
            </button>
          </div>
        ) : (
          <input value={signText} onChange={e => setSignText(e.target.value)}
            placeholder="اكتب اسمك كتوقيع..."
            className="w-full px-4 py-4 text-2xl border-2 border-dashed border-border rounded-xl bg-white focus:outline-none focus:border-primary text-center"
            style={{ fontFamily: "cursive" }} />
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />السابق
        </button>
        <button onClick={confirmSignature} disabled={!canConfirm}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-40">
          اعتماد والمتابعة
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: الدفع ────────────────────────────────────────────────────────────
function StepPayment({ data, unit, rentalId, onChange, onNext, onBack }) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  // payment_option: full | down_payment
  const [paymentOption, setPaymentOption] = useState(PAYMENT_OPTION_API.FULL);
  // payment_type: visa | mada | apple_pay | bank_transfer
  const [paymentType, setPaymentType] = useState("");

  // بيانات البطاقة (visa فقط)
  const [cardName, setCardName] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");

  const formatCard = v => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExp = v => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  const canPay = paymentType && (
    paymentType !== PAYMENT_TYPE_API.VISA ||
    (cardName && cardNum.replace(/\s/g, "").length === 16 && cardExp && cardCvc)
  );

  const handlePay = async () => {
    setProcessing(true);
    setError("");
    try {
      const updates = {
        payment_option: paymentOption,
        payment_type: paymentType,
        state: RENTAL_STATE_API.APPROVED,
      };
      if (paymentType === PAYMENT_TYPE_API.VISA) {
        updates.visa_cardholder_name = cardName;
        updates.visa_card_number = cardNum.replace(/\s/g, "");
        updates.visa_expiry = cardExp;
        updates.visa_cvc = cardCvc;
      }
      const fd = buildUpdateRentalFormData(updates);
      await updateRental(rentalId, fd);    // PUT /storage/rentals/:id
      onChange({ ...data, payment_option: paymentOption, payment_type: paymentType });
      onNext();
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "حدث خطأ أثناء الدفع");
    } finally {
      setProcessing(false);
    }
  };

  const total = unit?.monthly_price || 0;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">الدفع الإلكتروني</h2>

      {/* payment_option: full | down_payment */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
        <p className="text-sm text-muted-foreground mb-3">اختر طريقة الدفع</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPaymentOption(PAYMENT_OPTION_API.FULL)}
            className={`p-3 rounded-xl border-2 text-right transition-all ${paymentOption === PAYMENT_OPTION_API.FULL ? "border-primary bg-white shadow-sm" : "border-border bg-white/40"}`}>
            <p className="text-xs text-muted-foreground">دفع كامل</p>
            <p className="text-lg font-bold text-primary">{total.toLocaleString("ar-SA")} ر.س</p>
          </button>
          <button onClick={() => setPaymentOption(PAYMENT_OPTION_API.DOWN_PAYMENT)}
            className={`p-3 rounded-xl border-2 text-right transition-all ${paymentOption === PAYMENT_OPTION_API.DOWN_PAYMENT ? "border-amber-500 bg-white shadow-sm" : "border-border bg-white/40"}`}>
            <p className="text-xs text-muted-foreground">عربون (25%)</p>
            <p className="text-lg font-bold text-amber-600">{Math.round(total * 0.25).toLocaleString("ar-SA")} ر.س</p>
          </button>
        </div>
      </div>

      {/* payment_type */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">وسيلة الدفع</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            [PAYMENT_TYPE_API.MADA, "💳", "مدى"],
            [PAYMENT_TYPE_API.APPLE_PAY, "🍎", "Apple Pay"],
            [PAYMENT_TYPE_API.VISA, "💸", "بطاقة ائتمانية"],
            [PAYMENT_TYPE_API.BANK_TRANSFER, "🏦", "تحويل بنكي"],
          ].map(([id, icon, label]) => (
            <button key={id} onClick={() => setPaymentType(id)}
              className={`py-4 rounded-xl border-2 text-sm font-medium flex flex-col items-center gap-1.5 transition-all
                ${paymentType === id ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40 bg-card"}`}>
              <span className="text-2xl">{icon}</span>
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* بيانات البطاقة */}
      {paymentType === PAYMENT_TYPE_API.VISA && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold">بيانات البطاقة</p>
          <input value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))}
            placeholder="0000 0000 0000 0000" maxLength={19} dir="ltr"
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary tracking-widest" />
          <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())}
            placeholder="CARD HOLDER NAME" dir="ltr"
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input value={cardExp} onChange={e => setCardExp(formatExp(e.target.value))}
              placeholder="MM/YY" maxLength={5} dir="ltr"
              className="px-4 py-3 border-2 border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary" />
            <input value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="CVV" type="password" dir="ltr"
              className="px-4 py-3 border-2 border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary" />
          </div>
        </div>
      )}

      {paymentType === PAYMENT_TYPE_API.BANK_TRANSFER && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
          <p className="font-bold text-blue-800">بيانات الحساب البنكي</p>
          <p className="text-blue-700">IBAN: <strong className="font-mono">SA12 3456 7890 1234 5678 9012</strong></p>
          <p className="text-xs text-blue-500 bg-blue-100 rounded-lg p-2">أرسل الإيصال مع رقم الحجز إلى info@storage.com</p>
        </div>
      )}

      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</div>}

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />السابق
        </button>
        <button onClick={handlePay} disabled={!canPay || processing}
          className="px-8 py-3 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-green-700 flex items-center gap-2">
          {processing ? <><Loader2 className="w-4 h-4 animate-spin" />جاري المعالجة...</> : <>🔒 تأكيد الدفع</>}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5: التأكيد ──────────────────────────────────────────────────────────
function StepConfirmation({ rental }) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">تم تأكيد الحجز!</h2>
        <p className="text-muted-foreground mt-1">رقم الطلب: <span className="font-mono font-bold text-primary">#{rental?.id}</span></p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-right space-y-2 max-w-md mx-auto text-sm">
        <p><span className="text-muted-foreground">الوحدة:</span> <strong>{rental?.unit_number}</strong></p>
        <p><span className="text-muted-foreground">الموقع:</span> <strong>{rental?.branch}</strong></p>
        <p><span className="text-muted-foreground">بداية العقد:</span> <strong>{rental?.contract_start_date}</strong></p>
        <p><span className="text-muted-foreground">إجمالي العقد:</span> <strong className="text-primary">{rental?.total_price?.toLocaleString("ar-SA")} ر.س</strong></p>
        <p><span className="text-muted-foreground">الحالة:</span> <strong>{rental?.stateAr}</strong></p>
      </div>
      <p className="text-sm text-muted-foreground">تم إرسال تأكيد الحجز إلى: <strong>{rental?.customer_email}</strong></p>
      <div className="flex gap-3 justify-center flex-wrap">
        <a href="/storage-bookings"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90">
          عرض الحجوزات
        </a>
        <a href="/storage-units"
          className="inline-block px-6 py-2.5 border border-primary text-primary rounded-xl font-medium text-sm hover:bg-primary/5">
          العودة للوحدات
        </a>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StorageBookingFlow() {
  const [step, setStep] = useState(1);
  const [unit, setUnit] = useState(null);
  const [durations, setDurations] = useState([]);
  const [customerData, setCustomerData] = useState({ customer_type: "single" });
  const [rentalId, setRentalId] = useState(null);   // id بعد POST /storage/rentals
  const [confirmedRental, setConfirmedRental] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // pre-fill من session العميل
  useEffect(() => {
    const session = getCustomerSession();
    if (session) {
      setCustomerData(d => ({
        ...d,
        customer_name: session.full_name || "",
        customer_email: session.email || "",
        customer_mobile: session.phone || "",
        customer_id_number: session.id_number || "",
        customer_dob: session.birth_date || "",
        customer_type: session.customer_type === "شركة" ? "company" : "single",
        company_name: session.company_name || "",
        company_rep_name: session.company_rep || "",
        company_mobile: session.phone || "",
        company_cr_number: session.commercial_reg || "",
        stored_objects_type: session.storage_type || "",
      }));
    }
  }, []);

  // اختيار الوحدة → Step 2
  const selectUnit = (u, allDurations) => {
    setUnit(u);
    setDurations(allDurations);
    setStep(2);
  };

  // Step 2 → إنشاء حجز draft → Step 3
  const submitCustomerData = async () => {
    setSubmitting(true);
    setError("");
    try {
      const isCompany = customerData.customer_type === "company";
      const fd = isCompany
        ? buildCompanyRentalFormData({ ...customerData, unit_id: unit.id, state: RENTAL_STATE_API.DRAFT })
        : buildSingleRentalFormData({ ...customerData, unit_id: unit.id, state: RENTAL_STATE_API.DRAFT });

      const result = await createRental(fd);   // POST /storage/rentals
      const created = result?.data ?? result;
      setRentalId(created.id);
      setStep(3);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "فشل إنشاء الحجز");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 → تحديث بالتوقيع → Step 4
  const submitSignature = async (updatedData) => {
    setCustomerData(updatedData);
    setSubmitting(true);
    setError("");
    try {
      const fd = buildUpdateRentalFormData({
        is_terms_agreed: updatedData.is_terms_agreed,
        signature_name: updatedData.signature_name,
        signature_image: updatedData.signature_image,
        state: RENTAL_STATE_API.WAITING_PAYMENT,
      });
      await updateRental(rentalId, fd);   // PUT /storage/rentals/:id
      setStep(4);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "فشل حفظ التوقيع");
    } finally {
      setSubmitting(false);
    }
  };

  // Step 4 → بعد الدفع → Step 5
  const onPaymentDone = (updatedData) => {
    setCustomerData(updatedData);
    const rental = fromApiRental({
      id: rentalId,
      unit_number: unit?.unit_number,
      location: unit?.branch,
      monthly_price: unit?.monthly_price,
      contract_start_date: customerData.contract_start_date,
      total_price: unit?.monthly_price,
      customer_email: customerData.customer_email,
      state: RENTAL_STATE_API.APPROVED,
    });
    setConfirmedRental(rental);
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">حجز وحدة تخزين</h1>
            {unit && (
              <p className="text-xs text-muted-foreground">
                {unit.unit_number} — {unit.branch} | {unit.monthly_price?.toLocaleString("ar-SA")} ر.س/شهر
              </p>
            )}
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${step === s.id ? "bg-primary text-primary-foreground shadow-sm"
                  : step > s.id ? "bg-green-100 text-green-700"
                    : "bg-muted text-muted-foreground"}`}>
                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-0.5 ${step > s.id ? "bg-green-400" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error global */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
        )}

        {/* Step content */}
        <div className="bg-card rounded-2xl border border-border p-6">
          {step === 1 && (
            <StepSelectUnit onSelect={selectUnit} />
          )}
          {step === 2 && (
            <StepCustomerData
              data={customerData}
              durations={durations}
              onChange={setCustomerData}
              onNext={submitCustomerData}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <StepTermsAndSign
              data={customerData}
              unit={unit}
              onChange={d => { }}
              onNext={submitSignature}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <StepPayment
              data={customerData}
              unit={unit}
              rentalId={rentalId}
              onChange={onPaymentDone}
              onNext={() => { }}
              onBack={() => setStep(3)}
            />
          )}
          {step === 5 && (
            <StepConfirmation rental={confirmedRental} />
          )}

          {/* Loading overlay */}
          {submitting && (
            <div className="flex items-center justify-center gap-2 mt-4 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />جاري المعالجة...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
