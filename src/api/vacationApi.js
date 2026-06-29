import api from "./axios";

// =============================
// CREATE VACATION REQUEST
// =============================
export const createVacationRequest = async (data) => {
  // data:
  // {
  //   employee_id,
  //   vacation_type,
  //   from,
  //   to,
  //   contains_flying_ticket,
  //   notes
  // }

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
// GET VACATION YEARLY BALANCE
// =============================
export const getVacationYearlyBalance = async () => {
  const res = await api.get("/requests/vacation/yearly_balance");
  return res.data;
};

// =============================
// GET FLYING TICKETS
// =============================
export const getFlyingTickets = async () => {
  const res = await api.get("/requests/vacation/flying_tickets");
  return res.data;
};

// =============================
// APPROVE / REJECT VACATION REQUEST
// =============================
export const vacationAction = async (id, action) => {
  // action: "approve" | "reject" | "accept" | "refuse" (حسب الباك)
  const res = await api.post(`/requests/vacation/${id}/action`, {
    action,
  });

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