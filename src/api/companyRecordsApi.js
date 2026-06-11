import api from "./axios";

// ======================
// GET ALL RECORDS
// ======================
export const getCompanyRecords = async () => {
  const res = await api.get("/company_records");
  return res.data;
};

// ======================
// GET SINGLE RECORD
// ======================
export const getCompanyRecord = async (id) => {
  const res = await api.get(`/company_records/${id}`);
  return res.data;
};

// ======================
// CREATE RECORD
// ======================
export const createCompanyRecord = async (data) => {
  const res = await api.post("/company_records", data);
  return res.data;
};

// ======================
// UPDATE RECORD
// ======================
export const updateCompanyRecord = async (id, data) => {
  const res = await api.put(`/company_records/${id}`, data);
  return res.data;
};

// ======================
// DELETE RECORD
// ======================
export const deleteCompanyRecord = async (id) => {
  const res = await api.delete(`/company_records/${id}`);
  return res.data;
};

// ======================
// DOWNLOAD FILE
// ======================
export const downloadCompanyRecord = async (id, filename) => {
  try {
    const res = await api.get(
      `/company_records/${id}/download`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], {
      type: res.headers["content-type"],
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "document";

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("فشل التحميل");
  }
};