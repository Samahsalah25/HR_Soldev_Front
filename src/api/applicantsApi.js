import api from "./axios";

// =============================
// GET ALL APPLICANTS
// =============================
export const getApplicants = async () => {
  const res = await api.get("/applicants");
  return res.data?.data || [];
};

// =============================
// GET SINGLE APPLICANT
// =============================
export const getApplicantById = async (id) => {
  const res = await api.get(`/applicants/${id}`);
  return res.data?.data || res.data;
};

// =============================
// UPDATE STAGE + RESULT + HR NOTES
// =============================
export const updateApplicant = async (id, payload) => {
  const res = await api.put(`/applicants/${id}`, payload);
  return res.data;
};

// =============================
// ADD MEETING (CREATE)
// =============================
export const addApplicantMeeting = async (id, data) => {
  const res = await api.post(`/applicants/${id}/meetings`, data);
  return res.data;
};

// =============================
// UPDATE MEETING
// =============================
export const updateMeeting = async (meetingId, data) => {
  const res = await api.put(`/meetings/${meetingId}`, data);
  return res.data;
};

// =============================
// MY MEETINGS
// =============================
export const getMyMeetings = async () => {
  const res = await api.get("/my_meetings");
  return res.data?.data || [];
};

// =============================
export const allMyMeetingsForanApplicant = async (id) => {
  const res = await api.get(`/applicants/${id}/meetings`);
  return res.data?.data || [];
};
