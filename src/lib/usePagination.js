import { useState, useMemo, useEffect } from "react";

/**
 * Pagination عميل (client-side) للجداول — بيقطّع مصفوفة بيانات محمّلة بالكامل
 * لصفحات. مؤقت لحد ما الباك إند يدعم page/limit حقيقي على الـ endpoint.
 */
export function usePagination(items, pageSize = 20) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // لو البيانات اتغيرت (فلترة/بحث) وبقى العدد أقل من الصفحة الحالية، رجّع لأول صفحة
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    totalPages,
    totalItems,
    pageItems,
    pageSize,
  };
}
