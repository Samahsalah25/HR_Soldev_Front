import { useState, useEffect } from "react";

/**
 * بيرجع عدد دقيق للسجلات اللي مطابقة لفلتر معيّن على مستوى الباك كله
 * (مش بس الصفحة الحالية) — من غير ما يجيب كل البيانات. بيستخدم
 * limit=1 + فلتر (زي state) ويقرا `pagination.total_items` من الرد.
 *
 * بيفترض إن الـ endpoint بيدعم فلتر الحالة كـ query param (زي ما اتأكد
 * على /requests). لو مش مدعوم، الباك هيتجاهل الفلتر ويرجّع العدد الكلي —
 * فده وقتها مش دقيق لكن مش أسوأ من الوضع الحالي (عدّ الصفحة بس).
 */
export function useFilteredCount(fetchPage, filterParams, deps = []) {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPage({ ...filterParams, limit: 1 })
      .then((res) => {
        if (cancelled) return;
        setCount(res?.pagination?.total_items ?? null);
      })
      .catch(() => {
        if (cancelled) return;
        setCount(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, deps);

  return { count, loading };
}
