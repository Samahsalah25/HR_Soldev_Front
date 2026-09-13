import api from "./axios";

// =============================
// GET ANALYTIC LINES BY PROJECT (analytic_account_id)
// =============================
// ⚠️ الفلتر الأساسي هنا هو analytic_account_id بتاع المشروع (مش project_id
// العادي)، وده بيجيلنا من /projects كحقل analytic_account_id لكل مشروع.
export const getAnalyticLines = async (analyticAccountId, params = {}) => {
  const res = await api.get("/analytic/lines", {
    params: { analytic_account_id: analyticAccountId, ...params },
  });
  return res.data;
};