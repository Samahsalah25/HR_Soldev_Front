import api from "./axios";

// GET ALL USERS
// GET /auth/users
// Response: { success: true, data: [{ id, name, email, role }, ...] }
export const getUsers = async () => {
    const response = await api.get("/auth/users");
    return response.data;
};

// INVITE EMPLOYEE (sends invitation email)
// POST /employees/invite
// Body: { email, job_grade }
export const inviteEmployee = async (email, job_grade) => {
    const response = await api.post("/employees/invite", { email, job_grade });
    return response.data;
};

// CHANGE USER ROLE
// POST /auth/users/:id/role
// Body: { role }
export const changeUserRole = async (userId, role) => {
    const response = await api.post(`/auth/users/${userId}/role`, { role });
    return response.data;
};

// ACCEPT INVITE / RESET PASSWORD
// POST /auth/signup/accept
// Body: { token, password }
export const acceptSignup = async (token, password) => {
    const response = await api.post("/auth/signup/accept", { token, password });
    return response.data;
};
