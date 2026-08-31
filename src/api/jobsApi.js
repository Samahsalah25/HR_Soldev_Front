import api from "./axios";

// =============================
// GET ALL JOBS
// =============================
export const getJobs = async (params = {}) => {
  const response = await api.get("/jobs", { params });

  return response.data;
};

// =============================
// GET SINGLE JOB
// =============================
export const getJobById = async (id) => {
  const response = await api.get(`/jobs/${id}`);

  return response.data?.data || response.data;
};

// =============================
// CREATE JOB
// =============================
export const createJob = async (data) => {
  const response = await api.post("/jobs", data);

  return response.data;
};

// =============================
// ACCEPT JOB
// =============================
export const acceptJob = async (id) => {
  const response = await api.post(`/jobs/${id}/accept`);

  return response.data;
};

// =============================
// REJECT JOB
// =============================
export const rejectJob = async (id) => {
  const response = await api.post(`/jobs/${id}/reject`);

  return response.data;
};

// =============================
// APPLY FOR JOB
// =============================
export const applyForJob = async (jobId, data) => {
  const formData = new FormData();

  formData.append("full_name", data.full_name);
  formData.append("nationality", data.nationality || "");
  formData.append("email", data.email);
  formData.append("mobile_no", data.mobile_no);
  formData.append("years_of_experience", data.years_of_experience || 0);
  formData.append("current_salary", data.current_salary || 0);
  formData.append("expected_salary", data.expected_salary || 0);
  formData.append("cover_letter", data.cover_letter || "");

  if (data.resume) {
    formData.append("resume", data.resume); // file
  }

  const response = await api.post(`/jobs/${jobId}/apply`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};


export const  activeJobs = async () => {
  const response = await api.get("/jobs/active");

  return response.data;
};