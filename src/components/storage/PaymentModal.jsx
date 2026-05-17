import { useState } from "react";
import { X, CreditCard } from "lucide-react";

export default function PaymentModal({ invoice, onClose, onDone }) {
  const [method, setMethod] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processing, setProcessing] = useState(false);

  const formatCard = (v) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  const formatExp = (v) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  const handlePay = async () => {
    if (!method) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 2000));
    const ref = "PAY-" + Date.now().toString().slice(-8);
    await onDone(invoice, method, ref);
    setProcessing(false);
  };

  const canPay = method && (method !== "بطاقة ائتمانية" || (cardNum.replace(/\s/g, "").length === 16 && cardName && cardExp && cardCvv));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-gray-900">دفع الفاتورة — {invoice.invoice_number}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">المبلغ المستحق</span>
            <span className="text-2xl font-black text-primary">{invoice.total_amount?.toLocaleString("ar-SA")} <span className="text-sm font-normal">ر.س</span></span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">طريقة الدفع</p>
            <div className="grid grid-cols-2 gap-2">
              {[["مدى","💳"],["Apple Pay","🍎"],["بطاقة ائتمانية","💸"],["تحويل بنكي","🏦"]].map(([id, icon]) => (
                <button key={id} onClick={() => setMethod(id)}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-all flex flex-col items-center gap-1 ${method === id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs">{id}</span>
                </button>
              ))}
            </div>
          </div>

          {method === "بطاقة ائتمانية" && (
            <div className="space-y-3">
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
                <input value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="CVV" type="password" dir="ltr"
                  className="px-4 py-3 border-2 border-border rounded-xl text-sm font-mono focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {method === "تحويل بنكي" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm space-y-1">
              <p className="font-bold text-blue-800">بيانات الحساب البنكي</p>
              <p className="text-blue-700">اسم الحساب: <strong>شركة التخزين الذاتي</strong></p>
              <p className="text-blue-700">IBAN: <strong className="font-mono">SA12 3456 7890 1234 5678 9012</strong></p>
              <p className="text-xs text-blue-500 mt-2 bg-blue-100 rounded-lg p-2">أرسل إيصال التحويل إلى info@storage.com مع رقم الفاتورة: {invoice.invoice_number}</p>
            </div>
          )}

          <button onClick={handlePay} disabled={!canPay || processing}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-bold text-sm disabled:opacity-40 hover:bg-green-700 transition-colors shadow-md shadow-green-600/20 flex items-center justify-center gap-2">
            {processing ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />جاري المعالجة...</>
              : <><CreditCard className="w-4 h-4" />🔒 تأكيد الدفع</>}
          </button>
        </div>
      </div>
    </div>
  );
}