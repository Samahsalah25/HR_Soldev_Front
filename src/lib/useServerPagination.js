import { useState, useEffect, useCallback } from "react";

/**
 * Pagination من الباك إند — بيستقبل fetchPage({ page, limit }) لازم يرجّع
 * { data: [...], pagination: { total_items, limit, offset, has_next, has_prev } }
 * (نفس شكل الرد المؤكد من الباك على كل الـ list endpoints).
 * بيدير حالة الصفحة الحالية ويطلب صفحة جديدة من السيرفر كل ما الصفحة تتغيّر،
 * بنفس شكل خرج usePagination (page, setPage, totalPages, totalItems, pageItems)
 * عشان TablePagination يشتغل من غير أي تعديل.
 */
export function useServerPagination(fetchPage, pageSize = 20) {
  const [page, setPage] = useState(1);
  const [pageItems, setPageItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage({ page, limit: pageSize })
      .then((res) => {
        if (cancelled) return;
        setPageItems(res?.data || []);
        setTotalItems(res?.pagination?.total_items ?? (res?.data || []).length);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("خطأ أثناء تحميل الصفحة:", err);
        setPageItems([]);
        setTotalItems(0);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, reloadKey, fetchPage]);

  // لو الصفحة الحالية بقت أكبر من العدد الكلي (بعد حذف عنصر مثلاً) رجّع لأول صفحة
  useEffect(() => {
    if (page > 1 && page > totalPages) setPage(1);
  }, [totalPages, page]);

  // بعد أي عملية إنشاء/تعديل/حذف، استخدمها بدل load() عشان تعيد تحميل الصفحة الحالية من السيرفر
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { page, setPage, totalPages, totalItems, pageItems, pageSize, loading, reload };
}
