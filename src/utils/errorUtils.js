// src/utils/errorUtils.js

/**
 * بتحاول تطلع رسالة خطأ مفهومة من أي شكل رد بيرجعه الـ backend
 * بتغطي:
 *  - { message: "..." }
 *  - { error: "..." }  أو  { error: { message: "..." } }
 *  - { errors: ["...", "..."] }  أو  { errors: { field: ["msg"] } }  (شكل Odoo/Django شائع)
 *  - { detail: "..." }
 *  - نص عادي في data نفسها
 *  - أخطاء الشبكة (مفيش رد خالص من السيرفر)
 */
export function extractErrorMessage(err, fallback = "حصل خطأ غير متوقع") {
  // مفيش استجابة خالص (السيرفر واقع / مشكلة شبكة / CORS)
  if (!err?.response) {
    if (err?.message === "Network Error") {
      return "تعذر الاتصال بالسيرفر. اتأكدي إن السيرفر شغال والاتصال بالإنترنت تمام";
    }
    return err?.message || fallback;
  }

  const data = err.response.data;

  if (!data) return fallback;

  // نص عادي
  if (typeof data === "string") return data;

  // message مباشرة
  if (typeof data.message === "string") return data.message;

  // error كنص أو كائن
  if (typeof data.error === "string") return data.error;
  if (typeof data.error?.message === "string") return data.error.message;

  // detail (شائع في FastAPI)
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail
      .map((d) => d.msg || d.message || JSON.stringify(d))
      .join(" — ");
  }

  // errors كمصفوفة نصوص
  if (Array.isArray(data.errors)) {
    return data.errors
      .map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e)))
      .join(" — ");
  }

  // errors ككائن { field: ["msg1", "msg2"] }
  if (data.errors && typeof data.errors === "object") {
    return Object.entries(data.errors)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
      .join(" | ");
  }

  // Odoo بيرجع أحيانًا { name, message, arguments: [...] }
  if (Array.isArray(data.arguments) && data.arguments.length) {
    return data.arguments.join(" — ");
  }

  return fallback;
}