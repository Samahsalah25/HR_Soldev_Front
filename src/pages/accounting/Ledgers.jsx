import { useState, useEffect, useCallback, Fragment } from "react";
import { BookOpen, RefreshCw, Loader2, ChevronDown, ChevronLeft } from "lucide-react";
import { getGeneralLedger, getPartnerLedger } from "@/api/accountingApi";

const fmt = (n) => (n || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const LEDGER_TABS = [
  { id: "general", label: "دفتر الحسابات العام" },
  { id: "partner", label: "دفتر حسابات الشركاء" },
];

/* ────────────────────────────────────────────────────────────────────────
   صفحة دفاتر الأستاذ — بتاعت "Ledgers" في Postman
   تبويبين: دفتر الأستاذ العام (مجمّع حسب الحساب) ودفتر أستاذ الشركاء
   (مجمّع حسب العميل/المورد)، كل مجموعة قابلة للطي/الفتح زي أودو بالظبط.
   ──────────────────────────────────────────────────────────────────── */
export default function Ledgers() {
  const [activeTab, setActiveTab] = useState("general");
  const [groups, setGroups] = useState([]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "general") {
        const data = await getGeneralLedger();
        setGroups(data?.accounts || []);
      } else {
        const data = await getPartnerLedger();
        setGroups(data?.partners || []);
      }
      setExpanded(new Set());
    } catch (err) {
      console.error("خطأ أثناء تحميل دفتر الأستاذ:", err);
      setError("حدث خطأ أثناء تحميل دفتر الحسابات");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const toggleGroup = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isGeneral = activeTab === "general";
  const groupId = (g) => (isGeneral ? g.account_id : g.partner_id);
  const groupLabel = (g) => (isGeneral ? `${g.account_code} ${g.account_name}` : g.partner_name);

  const grandDebit = groups.reduce((s, g) => s + (g.debit || 0), 0);
  const grandCredit = groups.reduce((s, g) => s + (g.credit || 0), 0);
  const grandBalance = groups.reduce((s, g) => s + (g.balance || 0), 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> دفتر الحسابات
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">حركة كل حساب أو شريك مجمّعة، مع تفاصيل القيود</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          تحديث
        </button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {LEDGER_TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm px-4 py-2 rounded-lg border border-red-200">{error}</div>
      )}

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground w-8" />
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{isGeneral ? "الحساب" : "الشريك"}</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-blue-600">مدين</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-red-600">دائن</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">جاري التحميل...</td></tr>
            ) : groups.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">لا توجد بيانات</td></tr>
            ) : (
              groups.map((g) => {
                const id = groupId(g);
                const isOpen = expanded.has(id);
                const lines = g.lines || [];
                return (
                  <Fragment key={id}>
                    <tr onClick={() => toggleGroup(id)}
                      className="border-b border-border last:border-0 hover:bg-muted/20 cursor-pointer">
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {groupLabel(g)} <span className="text-xs text-muted-foreground">({lines.length})</span>
                      </td>
                      <td className="px-4 py-2.5 text-blue-700 font-medium">{fmt(g.debit)}</td>
                      <td className="px-4 py-2.5 text-red-600 font-medium">{fmt(g.credit)}</td>
                      <td className="px-4 py-2.5 font-bold text-foreground">{fmt(g.balance)}</td>
                    </tr>
                    {isOpen && lines.length > 0 && (
                      <tr className="border-b border-border last:border-0">
                        <td colSpan={5} className="p-0">
                          <table className="w-full text-xs bg-muted/10">
                            <thead>
                              <tr className="border-b border-border">
                                <th className="text-right px-4 py-2 font-medium text-muted-foreground">التاريخ</th>
                                <th className="text-right px-4 py-2 font-medium text-muted-foreground">القيد</th>
                                <th className="text-right px-4 py-2 font-medium text-muted-foreground">دفتر اليومية</th>
                                <th className="text-right px-4 py-2 font-medium text-muted-foreground">{isGeneral ? "الشريك" : "الحساب"}</th>
                                <th className="text-right px-4 py-2 font-medium text-muted-foreground">البيان</th>
                                <th className="text-right px-4 py-2 font-medium text-blue-600">مدين</th>
                                <th className="text-right px-4 py-2 font-medium text-red-600">دائن</th>
                                <th className="text-right px-4 py-2 font-medium text-muted-foreground">الرصيد</th>
                              </tr>
                            </thead>
                            <tbody>
                              {lines.map((l) => (
                                <tr key={l.id} className="border-b border-border/50 last:border-0">
                                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{l.date}</td>
                                  <td className="px-4 py-2 font-mono text-foreground whitespace-nowrap">{l.move_name}</td>
                                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{l.journal_name}</td>
                                  <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                                    {isGeneral ? (l.partner_name || "—") : `${l.account_code} ${l.account_name}`}
                                  </td>
                                  <td className="px-4 py-2 text-foreground">{l.name || "—"}</td>
                                  <td className="px-4 py-2 text-blue-700">{fmt(l.debit)}</td>
                                  <td className="px-4 py-2 text-red-600">{fmt(l.credit)}</td>
                                  <td className="px-4 py-2 font-medium text-foreground">{fmt(l.balance)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </tbody>
          {!loading && groups.length > 0 && (
            <tfoot>
              <tr className="bg-primary/5 border-t-2 border-primary/20 font-bold">
                <td colSpan={2} className="px-4 py-3 text-sm text-foreground">الإجمالي</td>
                <td className="px-4 py-3 text-blue-700">{fmt(grandDebit)}</td>
                <td className="px-4 py-3 text-red-600">{fmt(grandCredit)}</td>
                <td className="px-4 py-3 text-foreground">{fmt(grandBalance)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
