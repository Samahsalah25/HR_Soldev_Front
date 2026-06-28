import api from "./axios";

// =============================
// DASHBOARD STATS
// =============================
export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");

  return response.data?.data || response.data;
};