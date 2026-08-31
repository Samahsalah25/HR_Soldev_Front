import api from "./axios";

// ======================
// GET ALL TASKS
// ======================
export const getTasks = async (params = {}) => {
  const res = await api.get("/tasks", { params });
  return res.data;
};

// ======================
// GET TASK BY ID
// ======================
export const getTask = async (id) => {
  const res = await api.get(`/tasks/${id}`);
  return res.data;
};

// ======================
// CREATE TASK
// ======================
export const createTask = async (taskData) => {
  const res = await api.post(
    "/tasks",
    taskData
  );

  return res.data;
};

// ======================
// UPDATE TASK
// ======================
export const updateTask = async (
  id,
  taskData
) => {
  const res = await api.put(
    `/tasks/${id}`,
    taskData
  );

  return res.data;
};

// ======================
// DELETE TASK
// ======================
export const deleteTask = async (id) => {
  const res = await api.delete(
    `/tasks/${id}`
  );

  return res.data;
};