import api from "./axios";

// ======================
// SALARY REPORT
// GET /reports/salary
// ======================
export const getSalaryReport = async () => {
  const res = await api.get("/reports/salary");
  return res.data;
};

// ======================
// ATTENDANCE REPORT
// GET /reports/attendance
// ======================
export const getAttendanceReport = async () => {
  const res = await api.get("/reports/attendance");
  return res.data;
};

// ======================
// VACATION REPORT
// GET /reports/vacation
// ======================
export const getVacationReport = async () => {
  const res = await api.get("/reports/vacation");
  return res.data;
};

// ======================
// END OF SERVICE REPORT
// GET /reports/end-of-service
// ======================
export const getEndOfServiceReport = async () => {
  const res = await api.get("/reports/end-of-service");
  return res.data;
};

// ======================
// COMPLIANCE REPORT
// GET /reports/compliance
// ======================
export const getComplianceReport = async () => {
  const res = await api.get("/reports/compliance");
  return res.data;
};