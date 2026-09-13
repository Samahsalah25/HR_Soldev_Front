import { useState, useEffect } from "react";
import {
  BarChart3,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { getProjects } from "@/api/PurchasesApi";
import { getAnalyticLines } from "@/api/AnalyticApi";
import { extractApiErrorMessage } from "@/lib/apiErrors";

/* ────────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

function money(n) {
  return Number(n || 0).toFixed(2);
}

// ⚠️ الباك اند لسه مفيش شكل ثابت متفق عليه لأسماء حقول سطر التحليل
// (analytic line)، والـ sample اللي وصلني كان data.lines فاضية دايمًا،
// فبنجرب أكتر من اسم محتمل لكل حقل عشان الشاشة تفضل شغالة أيًا كان الاسم
// اللي هيرجع فعليًا. لو الأسماء الحقيقية مختلفة، عدّلي في الدوال دي بس.
function lineDate(l) {
  return l.date || l.date_order || l.move_date || l.create_date || "—";
}
function lineDescription(l) {
  return l.description || l.name || l.label || l.ref || "—";
}
function lineAccount(l) {
  return l.account_name || l.financial_account || l.account || l.account_id_name || "—";
}
function lineAmount(l) {
  return Number(l.amount ?? l.balance ?? 0);
}

const LIMIT = 25;

/* ────────────────────────────────────────────────────────────────────────
   صفحة كشف حساب المشروع
   ──────────────────────────────────────────────────────────────────── */

export default function ProjectStatement() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");

  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [lines, setLines] = useState([]);
  const [summary, setSummary] = useState({ total_revenue: 0, total_expense: 0, net_profit: 0 });
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        setLoadingProjects(true);
        setProjects((await getProjects()) || []);
      } catch (err) {
        console.error("خطأ أثناء تحميل المشاريع:", err);
        setError(extractApiErrorMessage(err, "تعذر تحميل المشاريع"));
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, []);

  const selectedProject = projects.find((p) => String(p.id) === String(projectId));

  const load = async (targetPage = 1) => {
    if (!selectedProject?.analytic_account_id) return;
    setError(null);
    try {
      setLoading(true);
      const res = await getAnalyticLines(selectedProject.analytic_account_id, {
        limit: LIMIT,
        offset: (targetPage - 1) * LIMIT,
      });
      setLines(res?.data?.lines || []);
      setSummary(res?.data?.summary || { total_revenue: 0, total_expense: 0, net_profit: 0 });
      setPagination(res?.pagination || null);
      setPage(targetPage);
    } catch (err) {
      console.error("خطأ أثناء تحميل حركات المشروع:", err);
      setError(extractApiErrorMessage(err, "تعذر تحميل حركات المشروع"));
      setLines([]);
      setSummary({ total_revenue: 0, total_expense: 0, net_profit: 0 });
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      load(1);
    } else {
      setLines([]);
      setSummary({ total_revenue: 0, total_expense: 0, net_profit: 0 });
      setPagination(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const linesTotal = lines.reduce((s, l) => s + lineAmount(l), 0);

  return (
    <div className="p-6 space-y-6 w-full bg-background min-h-full" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          كشف حساب المشروع
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          حركات الإيرادات والمصروفات المرتبطة بمشروع معيّن
        </p>
      </div>

      {/* اختيار المشروع */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">المشروع</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={loadingProjects}
          className="w-full sm:w-80 px-3 py-2.5 text-sm border border-border rounded-xl bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background disabled:opacity-60 transition-colors"
        >
          <option value="">{loadingProjects ? "جاري تحميل المشاريع..." : "اختر مشروع"}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {projectId && (
        <>
          {/* ملخص */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 text-emerald-600 mb-1.5">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold text-muted-foreground">إجمالي الإيرادات</span>
              </div>
              <p className="text-xl font-extrabold text-foreground">{money(summary.total_revenue)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 text-red-600 mb-1.5">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs font-semibold text-muted-foreground">إجمالي المصروفات</span>
              </div>
              <p className="text-xl font-extrabold text-foreground">{money(summary.total_expense)}</p>
            </div>
            <div className="bg-card border border-border rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 text-primary mb-1.5">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-semibold text-muted-foreground">صافي الربح</span>
              </div>
              <p className="text-xl font-extrabold text-primary">{money(summary.net_profit)}</p>
            </div>
          </div>

          {/* الجدول */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> جاري تحميل الحركات...
              </div>
            ) : (
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["التاريخ", "الوصف", "الحساب المالي", "المبلغ"].map((h) => (
                        <th
                          key={h}
                          className="text-right px-4 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-muted-foreground">
                          لا توجد حركات لهذا المشروع
                        </td>
                      </tr>
                    ) : (
                      lines.map((l, i) => {
                        const amount = lineAmount(l);
                        return (
                          <tr key={l.id ?? i} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{lineDate(l)}</td>
                            <td className="px-4 py-3.5 text-foreground">{lineDescription(l)}</td>
                            <td className="px-4 py-3.5 text-muted-foreground">{lineAccount(l)}</td>
                            <td
                              className={`px-4 py-3.5 font-bold whitespace-nowrap ${
                                amount < 0 ? "text-red-600" : "text-foreground"
                              }`}
                            >
                              {money(amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {lines.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-border bg-muted/20">
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-foreground">الإجمالي</td>
                        <td className="px-4 py-3 text-sm font-extrabold text-primary whitespace-nowrap">
                          {money(linesTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {pagination && pagination.total_pages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
                    <span>
                      صفحة {pagination.current_page} من {pagination.total_pages} — إجمالي {pagination.total_items} حركة
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => load(page - 1)}
                        disabled={!pagination.has_prev}
                        className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => load(page + 1)}
                        disabled={!pagination.has_next}
                        className="p-1.5 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}