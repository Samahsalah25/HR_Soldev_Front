// src/api/departmentsApi.js

import api from "./axios";

// GET ALL DEPARTMENTS
export const getDepartments = async () => {
  const response = await api.get("/departments");

  return response.data;
};

// GET SINGLE DEPARTMENT
export const getDepartmentById = async (id) => {
  const response = await api.get(`/departments/${id}`);

  return response.data;
};

// CREATE DEPARTMENT
export const createDepartment = async (data) => {
  const response = await api.post("/departments", data);

  return response.data;
};

// UPDATE DEPARTMENT
export const updateDepartment = async (id, data) => {
  const response = await api.put(`/departments/${id}`, data);

  return response.data;
};

// DELETE DEPARTMENT
export const deleteDepartmentApi = async (id) => {
  const response = await api.delete(`/departments/${id}`);

  return response.data;
};

// GET EMPLOYEES (FOR MANAGER DROPDOWN)
// السيرفر بيرجع الاسم في name_ar (وحقل name اللي مش دايمًا متطابق معاه) —
// بنطبّع كل السجلات هنا في مكان واحد عشان كل الصفحات (اللي بتقرا full_name_ar/employee_name/name)
// تعرض نفس الاسم العربي دايمًا.
export const getEmployees = async () => {
  const response = await api.get("/employees");
  const payload = response.data;

  const list = Array.isArray(payload?.data)
    ? payload.data
    : Array.isArray(payload)
      ? payload
      : [];

  const normalized = list.map((e) => {
    const arabicName = e.name_ar || e.name || "";
    return {
      ...e,
      name: arabicName,
      full_name_ar: arabicName,
      employee_name: arabicName,
      full_name: arabicName,
    };
  });

  if (Array.isArray(payload)) return normalized;
  return { ...payload, data: normalized };
};