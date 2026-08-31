import api from "./axios";

// ======================
// GET ALL MISSIONS
// ======================
export const getMissions = async (params = {}) => {
  const res = await api.get("/missions", { params });
  return res.data;
};

// ======================
// GET MISSION BY ID
// ======================
export const getMission = async (id) => {
  const res = await api.get(`/missions/${id}`);
  return res.data;
};

// ======================
// CREATE MISSION
// ======================
export const createMission = async (missionData) => {
  const res = await api.post("/missions", missionData);
  return res.data;
};

// ======================
// UPDATE MISSION
// ======================
export const updateMission = async (id, missionData) => {
  const res = await api.put(`/missions/${id}`, missionData);
  return res.data;
};

// ======================
// DELETE MISSION
// ======================
export const deleteMission = async (id) => {
  const res = await api.delete(`/missions/${id}`);
  return res.data;
};