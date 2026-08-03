// بتحاول تطلع رسالة خطأ مفهومة من أي شكل رد بيرجعه الباك إند
// بتغطي: { message }, { error } (نص أو كائن), { detail }, { errors } (مصفوفة أو كائن)
export function extractApiErrorMessage(err, fallback = "حصل خطأ أثناء الاتصال بالسيرفر، حاول تاني.") {
  if (!err?.response) {
    if (err?.message === "Network Error") {
      return "تعذّر الاتصال بالسيرفر. اتأكد إن السيرفر شغال والاتصال بالإنترنت تمام.";
    }
    return err?.message || fallback;
  }

  const data = err.response.data;
  if (!data) return fallback;
  if (typeof data === "string") return data;

  if (typeof data.message === "string") return data.message;
  if (typeof data.error === "string") return data.error;
  if (typeof data.error?.message === "string") return data.error.message;
  if (typeof data.detail === "string") return data.detail;

  if (Array.isArray(data.errors)) {
    return data.errors.map((e) => (typeof e === "string" ? e : e.message || JSON.stringify(e))).join(" — ");
  }
  if (data.errors && typeof data.errors === "object") {
    return Object.entries(data.errors)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
      .join(" | ");
  }

  return fallback;
}

// زي extractApiErrorMessage، لكن لطلبات responseType: "blob" (زي تحميل PDF)
// لأن رد الخطأ بيرجع كـ Blob مش JSON عادي، فلازم نقراه كنص الأول
export async function extractApiErrorMessageFromBlob(err, fallback) {
  const data = err?.response?.data;
  if (data instanceof Blob) {
    try {
      const text = await data.text();
      const parsed = JSON.parse(text);
      return extractApiErrorMessage({ response: { data: parsed } }, fallback);
    } catch (_) {
      return fallback ?? "حصل خطأ أثناء الاتصال بالسيرفر، حاول تاني.";
    }
  }
  return extractApiErrorMessage(err, fallback);
}
