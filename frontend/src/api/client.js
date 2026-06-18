function getBaseUrl() {
  const configuredUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
  return configuredUrl.endsWith("/api") ? configuredUrl : `${configuredUrl}/api`;
}

const BASE_URL = getBaseUrl();
const NETWORK_ERROR_MESSAGES = {
  en: "Network issue detected. Please check your internet connection and try again.",
  id: "Masalah jaringan terdeteksi. Periksa koneksi internet Anda lalu coba lagi.",
};

function getNetworkErrorMessage() {
  return NETWORK_ERROR_MESSAGES[localStorage.getItem("language")] || NETWORK_ERROR_MESSAGES.en;
}

function isNetworkError(err) {
  return err instanceof TypeError || err?.message === "Failed to fetch";
}

async function request(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...options.headers };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    if (!navigator.onLine || isNetworkError(err)) {
      throw new Error(getNetworkErrorMessage());
    }
    throw err;
  }

  if (res.status === 401 && !path.startsWith("/auth/")) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  // Handle blob responses for exports
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/pdf") || contentType.includes("spreadsheetml")) {
    return res.blob();
  }

  return res.json();
}

export const api = {
  // Auth
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  getMe: () => request("/auth/me"),
  changePassword: (data) =>
    request("/auth/change-password", { method: "PUT", body: JSON.stringify(data) }),

  // Projects
  listProjects: () => request("/projects"),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (data) => request("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),
  finalizeProject: (id) => request(`/projects/${id}/finalize`, { method: "POST" }),

  // Categories (scoped under events)
  createCategory: (projectId, eventId, data) =>
    request(`/projects/${projectId}/events/${eventId}/categories`, { method: "POST", body: JSON.stringify(data) }),
  updateCategory: (projectId, eventId, id, data) =>
    request(`/projects/${projectId}/events/${eventId}/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCategory: (projectId, eventId, id) =>
    request(`/projects/${projectId}/events/${eventId}/categories/${id}`, { method: "DELETE" }),

  // Exports
  exportPDF: (id) => request(`/projects/${id}/export/pdf`),
  exportExcel: (id) => request(`/projects/${id}/export/excel`),

  // Vendors
  listVendors: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/vendors${qs ? `?${qs}` : ""}`);
  },
  getVendor: (id) => request(`/vendors/${id}`),
  getRecommendations: (projectId) => request(`/vendors/recommend/${projectId}`),

  // Project Vendors
  listProjectVendors: (projectId) => request(`/projects/${projectId}/vendors`),
  addProjectVendor: (projectId, data) =>
    request(`/projects/${projectId}/vendors`, { method: "POST", body: JSON.stringify(data) }),
  removeProjectVendor: (projectId, vendorId) =>
    request(`/projects/${projectId}/vendors/${vendorId}`, { method: "DELETE" }),
  addVendorToBudget: (projectId, vendorId, data) =>
    request(`/projects/${projectId}/vendors/${vendorId}/add-to-budget`, { method: "POST", body: JSON.stringify(data) }),

  // Master Categories
  listMasterCategories: (eventType) => {
    const qs = eventType ? `?eventType=${eventType}` : "";
    return request(`/master-categories${qs}`);
  },

  // Vendor Types
  listVendorTypes: () => request("/vendor-types"),

  // Admin
  adminCreateVendor: (data) =>
    request("/admin/vendors", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateVendor: (id, data) =>
    request(`/admin/vendors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteVendor: (id) =>
    request(`/admin/vendors/${id}`, { method: "DELETE" }),
  adminCreateMasterCategory: (data) =>
    request("/admin/master-categories", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateMasterCategory: (id, data) =>
    request(`/admin/master-categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteMasterCategory: (id) =>
    request(`/admin/master-categories/${id}`, { method: "DELETE" }),

  // Admin - Vendor Types
  adminCreateVendorType: (data) =>
    request("/admin/vendor-types", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateVendorType: (id, data) =>
    request(`/admin/vendor-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteVendorType: (id) =>
    request(`/admin/vendor-types/${id}`, { method: "DELETE" }),

  // Admin - Users
  adminListUsers: () => request("/admin/users"),
  adminCreateUser: (data) =>
    request("/admin/users", { method: "POST", body: JSON.stringify(data) }),
  adminUpdateUser: (id, data) =>
    request(`/admin/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  adminResetPassword: (id, data) =>
    request(`/admin/users/${id}/reset-password`, { method: "PUT", body: JSON.stringify(data) }),
  adminDeleteUser: (id) =>
    request(`/admin/users/${id}`, { method: "DELETE" }),
};
