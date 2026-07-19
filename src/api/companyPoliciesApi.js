import api from "./axios";

// GET ALL
export const getCompanyPolicies = async () => {
  const res = await api.get("/company_policies");
  return res.data;
};

// GET ONE
export const getCompanyPolicy = async (id) => {
  const res = await api.get(`/company_policies/${id}`);
  return res.data;
};

export const createCompanyPolicy = async (formData) => {
  const res = await api.post("/company_policies", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

// UPDATE
export const updateCompanyPolicy = async (id, formData) => {
  const res = await api.put(`/company_policies/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
// DELETE
export const deleteCompanyPolicy = async (id) => {
  const res = await api.delete(`/company_policies/${id}`);
  return res.data;
};


// DOWNLOAD
export const downloadCompanyPolicy = async (
  id,
  filename = "policy"
) => {
  const res = await api.get(
    `/company_policies/${id}/download`,
    {
      responseType: "blob", // 👈 مهم جدًا
    }
  );

  // 👇 نعرف نوع الفايل
  const contentType = res.headers["content-type"];

  let extension = "";

  if (contentType.includes("pdf")) {
    extension = ".pdf";
  } else if (contentType.includes("png")) {
    extension = ".png";
  } else if (
    contentType.includes("jpg") ||
    contentType.includes("jpeg")
  ) {
    extension = ".jpg";
  } else if (contentType.includes("csv")) {
    extension = ".csv";
  } else {
    extension = "";
  }

  // 👇 create blob
  const blob = new Blob([res.data], {
    type: contentType,
  });

  // 👇 create local url
  const url = window.URL.createObjectURL(blob);

  // 👇 download
  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename?.includes(".")
      ? filename
      : `${filename}${extension}`;

  document.body.appendChild(link);
  link.click();

  link.remove();

  // cleanup
  window.URL.revokeObjectURL(url);
};