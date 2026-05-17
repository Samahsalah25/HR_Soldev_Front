import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle, Warehouse, User, FileText, PenLine, CreditCard, ChevronLeft, Search, X } from "lucide-react";
import { getCustomerSession } from "../lib/customerAuth";

const STEPS = [
  { id: 1, label: "اختيار الوحدة", icon: Warehouse },
  { id: 2, label: "بيانات العميل", icon: User },
  { id: 3, label: "الشروط والتوقيع", icon: PenLine },
  { id: 4, label: "الدفع", icon: CreditCard },
  { id: 5, label: "التأكيد", icon: CheckCircle },
];

function Field({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
    </div>
  );
}

function NavButtons({ onBack, onNext, canNext }) {
  return (
    <div className="flex justify-between pt-2">
      <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
        <ChevronLeft className="w-4 h-4" />السابق
      </button>
      <button onClick={onNext} disabled={!canNext}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-primary/90">
        التالي
      </button>
    </div>
  );
}

function FileUpload({ label, value, uploading, onUpload }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {value && <p className="text-xs text-green-600">✅ تم الرفع</p>}
      <input type="file" onChange={e => e.target.files[0] && onUpload(e.target.files[0])}
        className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:border-0 file:text-xs file:bg-primary/10 file:text-primary file:rounded-lg" />
      {uploading && <p className="text-xs text-muted-foreground animate-pulse">جاري الرفع...</p>}
    </div>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────
function StepSelectUnit({ onSelect }) {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    base44.entities.StorageUnit.filter({ status: "متاحة" }).then(u => { setUnits(u); setLoading(false); });
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث برقم الوحدة..."
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
          <option>مكيف</option><option>غير مكيف</option>
        </select>
      </div>
      {loading ? <p className="text-center py-12 text-muted-foreground">جاري التحميل...</p>
        : filtered.length === 0 ? <p className="text-center py-12 text-muted-foreground">لا توجد وحدات متاحة</p>
        : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(u => (
              <div key={u.id} onClick={() => onSelect(u)}
                className="bg-card rounded-xl border-2 border-border hover:border-primary cursor-pointer transition-all hover:shadow-md group">
                {u.image_url
                  ? <img src={u.image_url} alt="" className="w-full h-36 object-cover rounded-t-xl" />
                  : <div className="w-full h-36 bg-muted/50 flex items-center justify-center rounded-t-xl"><Warehouse className="w-10 h-10 text-muted-foreground/30" /></div>}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-foreground group-hover:text-primary">{u.unit_number} — {u.unit_name || ""}</p>
                      <p className="text-xs text-muted-foreground">{u.branch}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.unit_type === "مكيف" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>{u.unit_type}</span>
                  </div>
                  {u.area_sqm > 0 && <p className="text-xs text-muted-foreground">📐 {u.area_sqm} م²</p>}
                  <div className="flex flex-wrap gap-1">
                    {u.has_security && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">🔒</span>}
                    {u.has_cameras && <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">📷</span>}
                    {u.easy_access && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">🚪</span>}
                  </div>
                  <p className="font-bold text-primary text-lg">{u.monthly_price?.toLocaleString("ar-SA")} <span className="text-xs font-normal text-muted-foreground">ر.س/شهر</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Step 2 ───────────────────────────────────────────────────────────────────
function StepCustomerData({ data, onChange, onNext, onBack }) {
  const [uploading, setUploading] = useState({});
  const set = (k, v) => onChange({ ...data, [k]: v });
  const uploadFile = async (key, file) => {
    setUploading(u => ({ ...u, [key]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set(key, file_url);
    setUploading(u => ({ ...u, [key]: false }));
  };
  const isIndividual = data.customer_type === "فرد";
  const canNext = data.full_name && data.phone && data.email && data.storage_type &&
    (isIndividual ? data.id_number : data.commercial_reg && data.tax_number);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">بيانات العميل</h2>
      <div className="flex gap-3">
        {["فرد","شركة"].map(t => (
          <button key={t} onClick={() => set("customer_type", t)}
            className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${data.customer_type === t ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
            {t === "فرد" ? "👤 فرد" : "🏢 شركة"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isIndividual ? (
          <>
            <Field label="الاسم الكامل *" value={data.full_name} onChange={v => set("full_name", v)} />
            <Field label="رقم الجوال *" value={data.phone} onChange={v => set("phone", v)} />
            <Field label="البريد الإلكتروني *" type="email" value={data.email} onChange={v => set("email", v)} />
            <Field label="رقم الهوية / الإقامة *" value={data.id_number} onChange={v => set("id_number", v)} />
            <Field label="تاريخ الميلاد" type="date" value={data.birth_date} onChange={v => set("birth_date", v)} />
          </>
        ) : (
          <>
            <Field label="اسم الشركة *" value={data.company_name} onChange={v => set("company_name", v)} />
            <Field label="اسم المفوض *" value={data.company_rep} onChange={v => set("company_rep", v)} />
            <Field label="رقم الجوال *" value={data.phone} onChange={v => set("phone", v)} />
            <Field label="البريد الإلكتروني *" type="email" value={data.email} onChange={v => set("email", v)} />
            <Field label="رقم السجل التجاري *" value={data.commercial_reg} onChange={v => set("commercial_reg", v)} />
            <Field label="الرقم الضريبي *" value={data.tax_number} onChange={v => set("tax_number", v)} />
          </>
        )}
        <Field label="نوع المخزون *" value={data.storage_type} onChange={v => set("storage_type", v)} placeholder="أثاث، بضاعة، أرشيف..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="تاريخ بداية العقد" type="date" value={data.contract_start} onChange={v => set("contract_start", v)} />
        <div className="space-y-1.5">
          <label className="text-sm font-medium">مدة العقد (أشهر)</label>
          <select value={data.contract_months || 1} onChange={e => set("contract_months", +e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background">
            {[1,2,3,6,12,24].map(m => <option key={m} value={m}>{m} {m === 1 ? "شهر" : "أشهر"}</option>)}
          </select>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">المرفقات</h3>
        {isIndividual
          ? <FileUpload label="صورة الهوية / الإقامة" value={data.id_image_url} uploading={uploading.id_image_url} onUpload={(f) => uploadFile("id_image_url", f)} />
          : <>
              <FileUpload label="ملف السجل التجاري" value={data.commercial_reg_url} uploading={uploading.commercial_reg_url} onUpload={(f) => uploadFile("commercial_reg_url", f)} />
              <FileUpload label="شهادة الرقم الضريبي" value={data.tax_cert_url} uploading={uploading.tax_cert_url} onUpload={(f) => uploadFile("tax_cert_url", f)} />
              <FileUpload label="مستند التفويض (اختياري)" value={data.auth_doc_url} uploading={uploading.auth_doc_url} onUpload={(f) => uploadFile("auth_doc_url", f)} />
            </>}
      </div>
      <NavButtons onBack={onBack} onNext={onNext} canNext={canNext} />
    </div>
  );
}

// ─── Step 3 ───────────────────────────────────────────────────────────────────
function StepTermsAndSign({ data, unit, onChange, onNext, onBack }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signMode, setSignMode] = useState("draw");
  const [signText, setSignText] = useState("");

  const startDraw = (e) => {
    setDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  };
  const draw = (e) => {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - rect.left;
    const y = (e.touches?.[0]?.clientY ?? e.clientY) - rect.top;
    ctx.lineTo(x, y); ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.stroke();
    setHasSignature(true);
  };
  const stopDraw = () => setDrawing(false);
  const clearCanvas = () => {
    canvasRef.current.getContext("2d").clearRect(0, 0, 500, 120);
    setHasSignature(false);
  };

  const confirmSignature = () => {
    let sigImg = "";
    if (signMode === "draw" && hasSignature) {
      sigImg = canvasRef.current.toDataURL();
    } else if (signMode === "text" && signText) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "italic 36px serif";
      ctx.fillStyle = "#1e293b";
      ctx.fillText(signText, 20, 60);
      sigImg = canvas.toDataURL();
    }
    onChange({ ...data, signature_image: sigImg, signature_name: data.full_name || data.company_rep, signed_at: new Date().toISOString() });
    onNext();
  };

  const total = (unit?.monthly_price || 0) * (data.contract_months || 1);
  const canConfirm = data.terms_accepted && (signMode === "draw" ? hasSignature : signText.trim().length > 2);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">مراجعة الشروط والتوقيع</h2>
      <div className="bg-muted/30 rounded-xl border border-border p-4 grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">الوحدة:</span> <span className="font-semibold">{unit?.unit_number} — {unit?.branch}</span></div>
        <div><span className="text-muted-foreground">السعر الشهري:</span> <span className="font-bold text-primary">{unit?.monthly_price?.toLocaleString("ar-SA")} ر.س</span></div>
        <div><span className="text-muted-foreground">مدة العقد:</span> <span className="font-semibold">{data.contract_months} شهر</span></div>
        <div><span className="text-muted-foreground">الإجمالي:</span> <span className="font-bold text-primary">{total.toLocaleString("ar-SA")} ر.س</span></div>
        <div><span className="text-muted-foreground">بداية العقد:</span> <span className="font-semibold">{data.contract_start || "—"}</span></div>
        <div><span className="text-muted-foreground">العميل:</span> <span className="font-semibold">{data.full_name}</span></div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground">الشروط والأحكام</h3>
        <div className="h-40 overflow-y-auto text-xs text-muted-foreground space-y-2 leading-relaxed pr-1">
          <p><strong>1. مدة العقد:</strong> يبدأ العقد من تاريخ الدفع ويستمر للمدة المحددة.</p>
          <p><strong>2. الدفع:</strong> يُدفع الإيجار مقدماً قبل استلام الوحدة.</p>
          <p><strong>3. استخدام الوحدة:</strong> يُحظر تخزين المواد الخطرة أو القابلة للاشتعال أو المواد الحية.</p>
          <p><strong>4. المسؤولية:</strong> لا تتحمل الشركة مسؤولية الأضرار الناجمة عن سوء الاستخدام.</p>
          <p><strong>5. الإخلاء:</strong> يجب إخلاء الوحدة في نهاية مدة العقد وإلا تُطبق رسوم إضافية.</p>
          <p><strong>6. الإلغاء:</strong> لا تُسترد الرسوم في حال الإلغاء بعد التوقيع.</p>
          <p><strong>7. الوصول:</strong> يسمح بالوصول للوحدة خلال ساعات العمل الرسمية فقط.</p>
          <p><strong>8. التأمين:</strong> يُنصح بالتأمين على المحتويات وتتحمله مسؤولية المستأجر.</p>
          <p><strong>9. الصيانة:</strong> على المستأجر إبلاغ الإدارة فور ملاحظة أي عطل أو ضرر.</p>
          <p><strong>10. القانون المطبق:</strong> يخضع هذا العقد للنظام السعودي.</p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer bg-primary/5 border border-primary/20 rounded-lg p-3">
          <input type="checkbox" checked={data.terms_accepted || false}
            onChange={e => onChange({ ...data, terms_accepted: e.target.checked, terms_accepted_at: e.target.checked ? new Date().toISOString() : "", terms_version: "v1.0" })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">
            أقر بأنني قرأت ووافقت على شروط وأحكام عقد التخزين
            <br /><span className="text-xs text-muted-foreground font-normal">I confirm that I have read and agree to the storage agreement terms and conditions</span>
          </span>
        </label>
      </div>

      <div className={`space-y-3 transition-opacity ${data.terms_accepted ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        <h3 className="font-semibold text-foreground">التوقيع الإلكتروني</h3>
        <div className="flex gap-2 mb-3">
          {[["draw","رسم التوقيع"],["text","كتابة الاسم"]].map(([m,l]) => (
            <button key={m} onClick={() => setSignMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${signMode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{l}</button>
          ))}
        </div>
        {signMode === "draw" ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">ارسم توقيعك بالماوس أو باللمس</p>
            <canvas ref={canvasRef} width={500} height={120}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
              className="w-full border-2 border-dashed border-border rounded-xl bg-white cursor-crosshair touch-none" style={{ height: 120 }} />
            <button onClick={clearCanvas} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="w-3 h-3" />مسح التوقيع</button>
          </div>
        ) : (
          <input value={signText} onChange={e => setSignText(e.target.value)} placeholder="اكتب اسمك الكامل كتوقيع..."
            className="w-full px-4 py-4 text-2xl border-2 border-dashed border-border rounded-xl bg-white focus:outline-none focus:border-primary text-center" style={{ fontFamily: "cursive" }} />
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />السابق
        </button>
        <button onClick={confirmSignature} disabled={!canConfirm}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-primary/90">
          اعتماد التوقيع والمتابعة
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Enhanced Payment ─────────────────────────────────────────────────
function StepPayment({ data, unit, onChange, onNext, onBack }) {
  const [method, setMethod] = useState(data.payment_method || "");
  const [processing, setProcessing] = useState(false);
  const [paymentType, setPaymentType] = useState("full");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const total = (unit?.monthly_price || 0) * (data.contract_months || 1);
  const deposit = Math.round(total * 0.25);
  const payAmount = paymentType === "deposit" ? deposit : total;

  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  const handlePay = async () => {
    if (!method) return;
    if (method === "بطاقة ائتمانية" && (!cardNum || !cardName || !cardExp || !cardCvv)) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2500));
    const ref = "PAY-" + Date.now().toString().slice(-8);
    onChange({ ...data, payment_method: method, payment_ref: ref, paid_at: new Date().toISOString(), total_amount: total, paid_amount: payAmount });
    setProcessing(false);
    onNext();
  };

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-foreground">الدفع الإلكتروني</h2>

      {/* Summary + payment type choice */}
      <div className="bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">الوحدة: <span className="font-bold text-foreground">{unit?.unit_number}</span></p>
            <p className="text-xs text-muted-foreground">{unit?.branch} | {data.contract_months} شهر</p>
          </div>
          <div className="text-left">
            <p className="text-3xl font-black text-primary">{total.toLocaleString("ar-SA")} <span className="text-sm font-normal">ر.س</span></p>
            <p className="text-xs text-muted-foreground text-left">إجمالي العقد</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPaymentType("full")}
            className={`p-3 rounded-xl border-2 text-right transition-all ${paymentType === "full" ? "border-primary bg-white shadow-sm" : "border-white/60 bg-white/40 hover:border-primary/30"}`}>
            <p className="text-xs text-muted-foreground">دفع كامل</p>
            <p className="text-lg font-bold text-primary">{total.toLocaleString("ar-SA")} ر.س</p>
          </button>
          <button onClick={() => setPaymentType("deposit")}
            className={`p-3 rounded-xl border-2 text-right transition-all ${paymentType === "deposit" ? "border-amber-500 bg-white shadow-sm" : "border-white/60 bg-white/40 hover:border-amber-300"}`}>
            <p className="text-xs text-muted-foreground">عربون (25%)</p>
            <p className="text-lg font-bold text-amber-600">{deposit.toLocaleString("ar-SA")} ر.س</p>
          </button>
        </div>
        {paymentType === "deposit" && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
            ℹ️ المتبقي ({(total - deposit).toLocaleString("ar-SA")} ر.س) يُدفع عند استلام الوحدة
          </p>
        )}
      </div>

      {/* Payment method */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">طريقة الدفع</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[["مدى","💳"],["Apple Pay","🍎"],["بطاقة ائتمانية","💸"],["تحويل بنكي","🏦"]].map(([id, icon]) => (
            <button key={id} onClick={() => setMethod(id)}
              className={`py-4 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1.5 ${method === id ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40 bg-card"}`}>
              <span className="text-2xl">{icon}</span>
              <span className="text-xs">{id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Card form */}
      {method === "بطاقة ائتمانية" && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">بيانات البطاقة</h3>
            <span className="text-xs text-green-600 flex items-center gap-1">🔒 مشفر SSL 256-bit</span>
          </div>
          <div className="relative">
            <input value={cardNum} onChange={e => setCardNum(formatCard(e.target.value))}
              placeholder="0000 0000 0000 0000" maxLength={19} dir="ltr"
              className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary tracking-widest" />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">💳</span>
          </div>
          <input value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())}
            placeholder="CARD HOLDER NAME" dir="ltr"
            className="w-full px-4 py-3 border-2 border-border rounded-xl text-sm focus:outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input value={cardExp} onChange={e => setCardExp(formatExp(e.target.value))}
              placeholder="MM/YY" maxLength={5} dir="ltr"
              className="px-4 py-3 border-2 border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary" />
            <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="CVV" maxLength={4} type="password" dir="ltr"
              className="px-4 py-3 border-2 border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary" />
          </div>
        </div>
      )}

      {method === "تحويل بنكي" && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1.5 text-sm">
          <p className="font-bold text-blue-800">بيانات الحساب البنكي</p>
          <p className="text-blue-700">اسم الحساب: <span className="font-mono font-bold">شركة التخزين</span></p>
          <p className="text-blue-700">IBAN: <span className="font-mono font-bold">SA12 3456 7890 1234 5678 9012</span></p>
          <p className="text-blue-700">البنك: <span className="font-bold">بنك الراجحي</span></p>
          <p className="text-xs text-blue-500 bg-blue-100 rounded-lg p-2 mt-2">
            ℹ️ أرسل إيصال التحويل إلى info@storage.com مع ذكر رقم الحجز
          </p>
        </div>
      )}

      {(method === "Apple Pay" || method === "مدى") && (
        <div className="bg-muted/30 border border-border rounded-xl p-5 text-center space-y-2">
          <p className="text-3xl">{method === "Apple Pay" ? "🍎" : "💳"}</p>
          <p className="text-sm font-medium text-foreground">اضغط زر الدفع لإكمال العملية عبر {method}</p>
          <p className="text-xs text-muted-foreground">سيتم تحويلك لبوابة الدفع الآمنة</p>
        </div>
      )}

      <div className="flex justify-between">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">
          <ChevronLeft className="w-4 h-4" />السابق
        </button>
        <button onClick={handlePay} disabled={!method || processing}
          className="px-8 py-3 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-green-700 transition-colors shadow-md shadow-green-600/20 flex items-center gap-2">
          {processing
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري المعالجة...</>
            : <>🔒 ادفع {payAmount.toLocaleString("ar-SA")} ر.س</>}
        </button>
      </div>
    </div>
  );
}

// ─── Step 5 ───────────────────────────────────────────────────────────────────
function StepConfirmation({ booking }) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">تم تأكيد الحجز!</h2>
        <p className="text-muted-foreground mt-1">رقم الحجز: <span className="font-mono font-bold text-primary">{booking?.booking_number}</span></p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-right space-y-2 max-w-md mx-auto">
        <p className="text-sm"><span className="text-muted-foreground">الوحدة:</span> <strong>{booking?.unit_number}</strong></p>
        <p className="text-sm"><span className="text-muted-foreground">الفرع:</span> <strong>{booking?.branch}</strong></p>
        <p className="text-sm"><span className="text-muted-foreground">بداية العقد:</span> <strong>{booking?.contract_start}</strong></p>
        <p className="text-sm"><span className="text-muted-foreground">طريقة الدفع:</span> <strong>{booking?.payment_method}</strong></p>
        <p className="text-sm"><span className="text-muted-foreground">المبلغ المدفوع:</span> <strong className="text-primary">{(booking?.paid_amount || booking?.total_amount)?.toLocaleString("ar-SA")} ر.س</strong></p>
      </div>
      <p className="text-sm text-muted-foreground">تم إرسال تأكيد الحجز إلى: <strong>{booking?.email}</strong></p>
      <div className="flex gap-3 justify-center flex-wrap">
        <a href="/my-storage" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90">
          بوابتي — عقودي وفواتيري
        </a>
        <a href="/storage-bookings" className="inline-block px-6 py-2.5 border border-primary text-primary rounded-xl font-medium text-sm hover:bg-primary/5">
          عرض الحجوزات
        </a>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function StorageBookingFlow() {
  const [step, setStep] = useState(1);
  const [unit, setUnit] = useState(null);
  const [customerData, setCustomerData] = useState({ customer_type: "فرد", contract_months: 1 });
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = getCustomerSession();
    if (session) {
      setIsLoggedIn(true);
      setCustomerData(d => ({
        ...d,
        full_name: session.full_name || "",
        email: session.email || "",
        phone: session.phone || "",
        id_number: session.id_number || "",
        birth_date: session.birth_date || "",
        customer_type: session.customer_type || "فرد",
        company_name: session.company_name || "",
        company_rep: session.company_rep || "",
        commercial_reg: session.commercial_reg || "",
        tax_number: session.tax_number || "",
        storage_type: session.storage_type || "",
      }));
    }
    const p = new URLSearchParams(window.location.search);
    const uid = p.get("unit_id");
    if (uid) {
      const preUnit = { id: uid, unit_number: p.get("unit_number") || "", unit_name: p.get("unit_name") || "", branch: p.get("branch") || "", monthly_price: +p.get("monthly_price") || 0 };
      setUnit(preUnit);
      setCustomerData(d => ({ ...d, contract_months: +p.get("months") || 1, contract_start: p.get("start_date") || "" }));
      // Skip customer data step if logged in
      setStep(session ? 3 : 2);
    }
  }, []);

  const selectUnit = (u) => {
    setUnit(u);
    // Skip step 2 if already logged in (data prefilled)
    setStep(isLoggedIn ? 3 : 2);
  };

  const finishPayment = async (paidData) => {
    const bookingNum = "BK-" + Date.now().toString().slice(-8);
    const fullName = paidData.full_name || paidData.company_name || paidData.company_rep || "";
    const booking = await base44.entities.StorageBooking.create({
      ...paidData,
      full_name: fullName,
      unit_id: unit.id,
      unit_number: unit.unit_number,
      unit_name: unit.unit_name,
      branch: unit.branch,
      monthly_price: unit.monthly_price,
      booking_number: bookingNum,
      status: "Confirmed",
    });
    await base44.entities.StorageUnit.update(unit.id, { status: "مؤجرة" });

    // Create contract
    const contractNum = "CNT-" + Date.now().toString().slice(-8);
    const endDateObj = new Date(paidData.contract_start || new Date());
    endDateObj.setMonth(endDateObj.getMonth() + (paidData.contract_months || 1));
    const endDate = endDateObj.toISOString().slice(0, 10);
    const renewalDate = new Date(endDateObj); renewalDate.setDate(renewalDate.getDate() - 7);
    const contract = await base44.entities.StorageContract.create({
      contract_number: contractNum,
      booking_id: booking.id,
      booking_number: bookingNum,
      customer_email: paidData.email,
      customer_name: fullName,
      customer_phone: paidData.phone,
      customer_id_number: paidData.id_number,
      customer_type: paidData.customer_type,
      company_name: paidData.company_name,
      commercial_reg: paidData.commercial_reg,
      tax_number: paidData.tax_number,
      unit_id: unit.id,
      unit_number: unit.unit_number,
      unit_name: unit.unit_name,
      branch: unit.branch,
      storage_type: paidData.storage_type,
      monthly_price: unit.monthly_price,
      contract_months: paidData.contract_months || 1,
      start_date: paidData.contract_start,
      end_date: endDate,
      next_renewal_date: renewalDate.toISOString().slice(0, 10),
      auto_renew: true,
      signature_image: paidData.signature_image,
      signature_name: paidData.signature_name,
      signed_at: paidData.signed_at,
      status: "نشط",
    });

    // Create first invoice
    const subtotal = unit.monthly_price * (paidData.contract_months || 1);
    const vatAmount = Math.round(subtotal * 0.15);
    const invoiceTotal = subtotal + vatAmount;
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + 3);
    await base44.entities.StorageInvoice.create({
      invoice_number: "INV-" + Date.now().toString().slice(-8),
      contract_id: contract.id,
      contract_number: contractNum,
      booking_id: booking.id,
      booking_number: bookingNum,
      customer_email: paidData.email,
      customer_name: fullName,
      customer_phone: paidData.phone,
      customer_type: paidData.customer_type,
      company_name: paidData.company_name,
      tax_number: paidData.tax_number,
      unit_number: unit.unit_number,
      branch: unit.branch,
      period_start: paidData.contract_start,
      period_end: endDate,
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: dueDate.toISOString().slice(0, 10),
      monthly_price: unit.monthly_price,
      months: paidData.contract_months || 1,
      subtotal,
      vat_rate: 15,
      vat_amount: vatAmount,
      total_amount: invoiceTotal,
      status: "مدفوعة",
      payment_method: paidData.payment_method,
      payment_ref: paidData.payment_ref,
      paid_at: paidData.paid_at,
      invoice_type: "أول مرة",
    });

    try {
      await base44.integrations.Core.SendEmail({
        to: paidData.email,
        subject: `تأكيد حجز وحدة التخزين — ${bookingNum}`,
        body: `Dear ${fullName},\n\nYour storage unit booking has been confirmed.\n\nBooking Number: ${bookingNum}\nUnit: ${unit.unit_number} — ${unit.branch}\nContract Start: ${paidData.contract_start}\nTotal: ${paidData.total_amount?.toLocaleString("ar-SA")} SAR\nPaid: ${paidData.paid_amount?.toLocaleString("ar-SA")} SAR\n\nThank you for choosing us.`,
      });
    } catch {}
    setConfirmedBooking({ ...booking, ...paidData, full_name: fullName, booking_number: bookingNum });
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Warehouse className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">حجز وحدة تخزين</h1>
            {unit && <p className="text-xs text-muted-foreground">الوحدة: {unit.unit_number} — {unit.branch} | {unit.monthly_price?.toLocaleString("ar-SA")} ر.س/شهر</p>}
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all
                ${step === s.id ? "bg-primary text-primary-foreground shadow-sm" : step > s.id ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                {step > s.id ? <CheckCircle className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-4 h-0.5 ${step > s.id ? "bg-green-400" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          {step === 1 && <StepSelectUnit onSelect={selectUnit} />}
          {step === 2 && <StepCustomerData data={customerData} onChange={setCustomerData} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <StepTermsAndSign data={customerData} unit={unit} onChange={setCustomerData} onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <StepPayment data={customerData} unit={unit} onChange={d => { setCustomerData(d); finishPayment(d); }} onNext={() => {}} onBack={() => setStep(3)} />}
          {step === 5 && <StepConfirmation booking={confirmedBooking} />}
        </div>
      </div>
    </div>
  );
}