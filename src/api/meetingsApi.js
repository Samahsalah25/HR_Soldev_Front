import api from "./axios";

// ======================
// GET ALL MEETINGS
// ======================
export const getMeetings = async () => {
  const res = await api.get("/meetings");
  return res.data;
};

// ======================
// GET MEETING BY ID
// ======================
export const getMeeting = async (id) => {
  const res = await api.get(`/meetings/${id}`);
  return res.data;
};

// ======================
// CREATE MEETING
// ======================
export const createMeeting = async (meetingData) => {
  const res = await api.post("/meetings", meetingData);
  return res.data;
};

// ======================
// UPDATE MEETING
// ======================
export const updateMeeting = async (id, meetingData) => {
  const res = await api.put(`/meetings/${id}`, meetingData);
  return res.data;
};

// ======================
// DELETE MEETING
// ======================
export const deleteMeeting = async (id) => {
  const res = await api.delete(`/meetings/${id}`);
  return res.data;
};