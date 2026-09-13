import api from "./axios";

// =============================
// GET DEPARTURE REASONS
// =============================
// ⚠️ لاحظت إن الـ path القديم كان "/departure_reasons" من غير prefix،
// لكن حسب التوثيق اللي بعتهولي الـ endpoint الفعلي هو:
// /end_of_service/departure_reasons — عدلته هنا عشان يطابق الباك اند.
// لو الـ axios instance بتاعك أصلاً فيه baseURL بيحط /end_of_service
// من نفسه، رجّعها زي ما كانت.
export const getDepartureReasons = async () => {
  const res = await api.get("/end_of_service/departure_reasons");
  return res.data;
};

// =============================
// GET ALL END OF SERVICE REQUESTS
// =============================
export const getEndOfService = async (params = {}) => {
  const res = await api.get("/end_of_service", { params });
  return res.data;
};

// =============================
// CREATE END OF SERVICE REQUEST
// =============================
export const createEndOfService = async (formData) => {
  const res = await api.post("/end_of_service", formData);
  return res.data;
};

// =============================
// APPROVE / REJECT EOS REQUEST
// =============================
export const eosAction = async (id, action, notes = "") => {
  const res = await api.post(`/end_of_service/${id}/action`, {
    action,
    notes,
  });
  return res.data;
};