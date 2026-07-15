import { useState, useEffect } from "react";
import { FileText, RefreshCw, Search, Eye, StopCircle } from "lucide-react";
import ContractView from "../components/storage/ContractView";
import { getRentals, updateRental, buildUpdateRentalFormData, RENTAL_STATE_API } from "@/api/storageRentalsApi";

export default function StorageContracts() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [processing, setProcessing] = useState({});

  const load = async () => {
    try {
      // الـ contracts = rentals بـ state approved
      const rentals = await getRentals({ state: RENTAL_STATE_API.APPROVED });
      setContracts(rentals);
    } catch (e) {
      console.error("StorageContracts load error:", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  // إيقاف التجديد → نحدّث state إلى ended
  const stopRenew = async (contract) => {
    const fd = buildUpdateRentalFormData({ state: RENTAL_STATE_API.ENDED });
    await updateRental(contract.id, fd);
    load();
  };

  const filteredContracts = contracts.filter(c =>
    !search ||
    (c.customer_name || c.company_name)?.includes(search) ||
    c.unit_number?.includes(search) ||
    c.customer_email?.includes(search)
  );

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><FileText className="w-6 h-6 text-primary" />العقود والفواتير</h1>
          <p className="text-sm text-muted-foreground">إدارة عقود وفواتير عملاء التخزين</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted">
            <RefreshCw className="w-4 h-4" />تحديث
          </button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث باسم أو وحدة..."
          className="w-full pr-9 pl-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/30 border-b border-border">
            {["#", "العميل", "الوحدة", "الموقع", "البداية", "النهاية", "الشهري", "الإجمالي", "الحالة", "إجراءات"].map(h => (
              <th key={h} className="text-right px-3 py-3 text-xs font-medium text-muted-foreground">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
            ) : filteredContracts.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-muted-foreground">لا توجد عقود مؤكدة</td></tr>
            ) : filteredContracts.map(c => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-3 py-3 font-mono text-xs">#{c.id}</td>
                <td className="px-3 py-3">
                  <p className="font-medium text-foreground">{c.customer_name || c.company_name}</p>
                  <p className="text-xs text-muted-foreground">{c.customer_email}</p>
                </td>
                <td className="px-3 py-3 font-medium">{c.unit_number}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{c.branch}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{c.contract_start_date}</td>
                <td className="px-3 py-3 text-xs text-muted-foreground">{c.end_date || "—"}</td>
                <td className="px-3 py-3 font-semibold text-primary">{c.monthly_price?.toLocaleString("ar-SA")} ر.س</td>
                <td className="px-3 py-3 font-bold text-foreground">{c.total_price?.toLocaleString("ar-SA")} ر.س</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.state === "approved" ? "bg-green-100 text-green-700" :
                    c.state === "ended" ? "bg-gray-100 text-gray-500" :
                      "bg-amber-100 text-amber-700"
                    }`}>{c.stateAr}</span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedContract(c)} title="عرض"
                      className="p-1.5 hover:bg-muted rounded"><Eye className="w-3.5 h-3.5" /></button>
                    {c.state === "approved" && (
                      <button onClick={() => stopRenew(c)} title="إنهاء العقد"
                        className="p-1.5 hover:bg-red-50 rounded text-red-500" disabled={!!processing[c.id]}>
                        <StopCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedContract && <ContractView contract={selectedContract} onClose={() => setSelectedContract(null)} />}
    </div>
  );
}