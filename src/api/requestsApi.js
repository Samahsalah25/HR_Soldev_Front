// src/api/requestsApi.js

import api from "./axios";

// =============================
// GET ALL REQUESTS
// =============================
export const getAllRequests = async () => {
  const res = await api.get("/requests");
  return res.data;
};

// =============================
// GET ONE REQUEST
// =============================
export const getOneRequest = async (id) => {
  const res = await api.get(`/requests/${id}`);
  return res.data;
};

// =============================
// CREATE VACATION REQUEST
// vacation_type options:
//   "yearly"      -> سنوية
//   "sick_leaves" -> مرضية (حتى 120 يوم)
//   "unpaid"      -> بدون راتب
//   "peternety"   -> أمومة (حتى 70 يوم)
//   "fatherly"    -> أبوة (حتى 3 أيام)
//   "marriage"    -> زواج (حتى 5 أيام)
//   "death"       -> وفاة (حتى 5 أيام)
//   "plimsarage"  -> حج (حتى 10 أيام)
// =============================
export const createVacationRequest = async (data) => {
  // data: { employee_id, vacation_type, from, to, contains_flying_ticket, notes }
  const res = await api.post("/requests/vacation", data);
  return res.data;
};

// =============================
// GET ALL VACATION REQUESTS
// =============================
export const getAllVacationRequests = async () => {
  const res = await api.get("/requests/vacation");
  return res.data;
};

// =============================
// GET ALL VACATION YEARLY BALANCE
// =============================
export const getVacationYearlyBalance = async () => {
  const res = await api.get("/requests/vacation/yearly-balance");
  return res.data;
};

// =============================
// GET FLYING TICKET
// =============================
export const getFlyingTicket = async () => {
  const res = await api.get("/requests/vacation/flying-ticket");
  return res.data;
};

// =============================
// CREATE COMPLAINT REQUEST
// complaint_type options:
//   "authority_trespassing" -> تجاوز صلاحيات
//   "unfair_evaluation"     -> تقييم غير عادل
//   "work_environment"      -> بيئة عمل
//   "coworker_trespassing"  -> تعدي من زميل
//   "salary_problem"        -> مشكلة راتب
//   "other"                 -> أخرى
// =============================
export const createComplaintRequest = async (data) => {
  // data: { is_anonymous, employee_id, complaint_type, topic, meaned_employee_id, incident_date, description }
  const res = await api.post("/requests/complaint", data);
  return res.data;
};

// =============================
// CREATE APPEAL REQUEST
// appeal_type options:
//   "objection_disciplinary"  -> اعتراض على قرار تأديبي
//   "objection_salary"        -> اعتراض على راتب
//   "objection_refused_vacation" -> اعتراض على إجازة مرفوضة
//   "objection_evaluation"    -> اعتراض على تقييم أداء
//   "other"                   -> أخرى
// =============================
export const createAppealRequest = async (data) => {
  // data: { is_anonymous, employee_id, appeal_type, topic, description }
  const res = await api.post("/requests/appeal", data);
  return res.data;
};

// =============================
// CREATE ALLOWANCE REQUEST
// allowance_type options:
//   "housing"       -> بدل سكن
//   "transportation"-> بدل مواصلات
//   "food"          -> بدل طعام
//   "communication" -> بدل اتصالات
//   "special"       -> بدل خاص
//   "reward"        -> مكافأة
// =============================
export const createAllowanceRequest = async (data) => {
  // data: { employee_id, allowance_type, amount, description }
  const res = await api.post("/requests/allowance", data);
  return res.data;
};

// =============================
// CREATE EXPENSE REQUEST
// =============================
export const createExpenseRequest = async (formData) => {
  // formData: FormData with { employee_id, expense_type, amount, receipt_number, receipt_date, description, attachment (file) }
  const res = await api.post("/requests/expense", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// =============================
// DOWNLOAD EXPENSE DOCUMENT
// =============================
export const downloadExpenseDocument = async (id) => {
  const res = await api.get(`/requests/expense/${id}/document`, {
    responseType: "blob",
  });
  return res.data;
};

// =============================
// APPROVE / REJECT REQUEST
// action options: "approve" (or "accept"), "reject" (or "refuse")
// =============================
export const requestAction = async (id, action) => {
  // action: "approve" | "accept" | "reject" | "refuse"
  const res = await api.post(`/requests/${id}/action`, { action });
  return res.data;
};

// =============================
// APPROVE / REJECT VACATION REQUEST
// =============================
export const vacationAction = async (id, action) => {
  // action: "accept" | "refuse"
  const res = await api.post(`/requests/vacation/${id}/action`, { action });
  return res.data;
};

// =============================
// SEND TO MANAGER
// =============================
export const sendToManager = async (id) => {
  const res = await api.post(`/requests/${id}/send_to_manager`);
  return res.data;
};

// =============================
// MANAGER APPROVE
// =============================
export const managerApprove = async (id) => {
  const res = await api.post(`/requests/${id}/manager_approve`);
  return res.data;
};

// =============================
// SEND VACATION TO MANAGER
// =============================
export const sendVacationToManager = async (id) => {
  const res = await api.post(`/requests/vacation/${id}/send_to_manager`);
  return res.data;
};

// =============================
// MANAGER APPROVE VACATION
// =============================
export const managerApproveVacation = async (id) => {
  const res = await api.post(`/requests/vacation/${id}/manager_approve`);
  return res.data;
};
