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
// SALARY
// ======================
export const getPortalSalary = async () => {
  const res = await api.get("/portal/salary");
  return res.data;
};

// ======================
// ATTENDANCE
// ======================
export const getPortalAttendance = async () => {
  const res = await api.get("/portal/attendance");
  return res.data;
};

// ======================
// POLICIES
// ======================
export const getPortalPolicies = async () => {
  const res = await api.get("/portal/policies");
  return res.data;
};

// ======================
// REQUESTS
// ======================
export const getPortalRequests = async () => {
  const res = await api.get("/portal/requests");
  return res.data;
};

// ======================
// CUSTODY
// ======================
export const getPortalCustody = async () => {
  const res = await api.get("/portal/custody");
  return res.data;
};

// ======================
// DISCIPLINARY
// ======================
export const getPortalDisciplinary = async () => {
  const res = await api.get("/portal/disciplinary");
  return res.data;
};

// ======================
// PASSWORD INFO
// ======================
export const getPortalPassword = async () => {
  const res = await api.get("/portal/password");
  return res.data;
};

// ======================
// RESET PASSWORD
// ======================
export const resetPortalPassword = async (data = {}) => {
  const res = await api.post("/portal/password/reset", data);
  return res.data;
};
export const downloadPortalPolicy = async (id) => {
  const res = await api.get(`/company_policies/${id}/download`, {
    responseType: "blob",
  });

  return res.data;
};

// ======================
// LOANS
// ======================
export const getPortalLoans = async () => {
  const res = await api.get("/portal/loans");
  return res.data;
};
// ======================
// CREATE VACATION REQUEST
// ======================
export const createPortalVacation = async (data) => {
  const res = await api.post("/portal/vacations", data);
  return res.data;
};

// ======================
// CHANGE PASSWORD (AUTH)
// ======================
export const changePassword = async (data) => {
  const res = await api.post(
    "/auth/change-password",
    {
      current_password: data.current_password,
      new_password: data.new_password,
      confirm_new_password: data.confirm_new_password,
    }
  );

  return res.data;
};