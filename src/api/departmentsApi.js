// src/api/departmentsApi.js

import api from "./axios";

// GET ALL DEPARTMENTS
export const getDepartments = async (params = {}) => {
  const response = await api.get("/departments", { params });

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
export const getEmployees = async () => {
  const response = await api.get("/employees");

  return response.data;
};