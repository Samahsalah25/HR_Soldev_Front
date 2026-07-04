import api from "./axios";

// ======================
// PORTAL OVERVIEW
// ======================
export const getPortalOverview = async () => {
  const res = await api.get("/portal/overview");
  return res.data;
};

// ======================
// PORTAL PROFILE
// ======================
export const getPortalProfile = async () => {
  const res = await api.get("/portal/profile");
  return res.data;
};

// ======================
// VACATIONS
// ======================
export const getPortalVacations = async () => {
  const res = await api.get("/portal/vacations");
  return res.data;
};

// ======================
// SALARY (NEW)
// ======================
export const getPortalSalary = async () => {
  const res = await api.get("/portal/salary");
  return res.data;
};

// ======================
// ATTENDANCE (NEW)
// ======================
export const getPortalAttendance = async () => {
  const res = await api.get("/portal/attendance");
  return res.data;
};

// ======================
// POLICIES (NEW)
// ======================
export const getPortalPolicies = async () => {
  const res = await api.get("/portal/policies");
  return res.data;
};