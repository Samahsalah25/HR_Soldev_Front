import { ChevronRight, ChevronLeft } from "lucide-react";

// شريط pagination بسيط لأسفل الجداول — RTL، بيتفق مع باقي ستايل الجداول في
// النظام. الزرار "التالي" بصريًا على اليمين والـ "السابق" على الشمال عشان
// اتجاه القراءة عربي (RTL)، فالأيقونات معكوسة عن الإنجليزي عمدًا.
export default function TablePagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalItems === 0) return null;

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pageNumbers = [];
  const windowSize = 5;
  let from = Math.max(1, page - Math.floor(windowSize / 2));
  let to = Math.min(totalPages, from + windowSize - 1);
  from = Math.max(1, to - windowSize + 1);
  for (let i = from; i <= to; i++) pageNumbers.push(i);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border flex-wrap gap-2" dir="rtl">
      <p className="text-xs text-muted-foreground">
        عرض {start}-{end} من {totalItems}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="الصفحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {from > 1 && <span className="px-1 text-xs text-muted-foreground">…</span>}
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={`min-w-[2rem] px-2 py-1.5 rounded-lg text-xs font-medium ${
                n === page ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted text-foreground"
              }`}
            >
              {n}
            </button>
          ))}
          {to < totalPages && <span className="px-1 text-xs text-muted-foreground">…</span>}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="الصفحة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
