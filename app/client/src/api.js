import { apiConfig } from "./apiConfig.js";

// Helper to get CSRF token from the browser cookie
const getCsrfToken = () => {
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith("XSRF-TOKEN="));
  return cookie ? cookie.split("=")[1] : null;
};

// ============================================
// Fetch Helper — JSON
// ============================================
async function fetchWithAuth(endpoint, options = {}) {
  const url = `${apiConfig.baseUrlAPI}${endpoint}`;
  const token = getCsrfToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { "X-CSRF-Token": token } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type");
  let data = contentType?.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === "object"
      ? (data.error || data.message || "Request failed")
      : "Request failed";
    const error = new Error(message);
    error.response = { status: response.status, data };
    throw error;
  }

  return data;
}

// ============================================
// Fetch with FormData (file uploads)
// ============================================
async function fetchWithAuthFormData(endpoint, formData) {
  const url = `${apiConfig.baseUrlAPI}${endpoint}`;

  const token = getCsrfToken();
  const headers = token ? { "X-CSRF-Token": token } : {};

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Request failed");
    error.response = { status: response.status, data };
    throw error;
  }

  return data;
}

// ============================================
// Health Check
// ============================================
export const healthService = {
  check: async () => {
    return await fetchWithAuth(apiConfig.endpoints.health);
  },
};

// ============================================
// AI Service
// ============================================
export const aiService = {
  queryPatients: async (query, patientIds) => {
    return await fetchWithAuth(`${apiConfig.endpoints.ai}/query`, {
      method: "POST",
      body: JSON.stringify({ query, patientIds }),
    });
  },
  querySelf: async (query, conversationHistory = []) => {
    return await fetchWithAuth(`${apiConfig.endpoints.ai}/patient-self-query`, {
      method: "POST",
      body: JSON.stringify({ query, conversationHistory }),
    });
  },
};

// ============================================
// Upload Service
// ============================================
export const uploadService = {
  uploadFiles: async (files) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    return await fetchWithAuthFormData("/upload/file", formData);
  },

  uploadText: async (text) => {
    return await fetchWithAuth("/upload/text", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
  },

  deleteFile: async (id) => {
    return await fetchWithAuth(`/upload/file/${id}`, { method: "DELETE" });
  },

  deleteText: async (id) => {
    return await fetchWithAuth(`/upload/text/${id}`, { method: "DELETE" });
  },

  getFileUploads: async () => {
    return await fetchWithAuth("/upload/file");
  },

  getTextUploads: async () => {
    return await fetchWithAuth("/upload/text");
  },

  getTextById: async (id) => {
    return await fetchWithAuth(`/upload/text/${id}`);
  },

  downloadFile: async (id) => {
    const url = `${apiConfig.baseUrlAPI}/upload/download/${id}`;
    const token = getCsrfToken();
    const response = await fetch(url, {
      credentials: "include",
      headers: token ? { "X-CSRF-Token": token } : {},
    });
    if (!response.ok) {
      const data = await response.json();
      const error = new Error(data.error || "Download failed");
      error.response = { status: response.status, data };
      throw error;
    }
    return response.blob();
  },
};

// ============================================
// User Service
// ============================================
export const userService = {
  searchUsers: async (query) => {
    return await fetchWithAuth(`${apiConfig.endpoints.searchUsers}?search=${encodeURIComponent(query)}`);
  },

  searchUsersByRole: async (role, query) => {
    return await fetchWithAuth(
      `${apiConfig.endpoints.searchUsers}?role=${encodeURIComponent(role)}&search=${encodeURIComponent(query)}`
    );
  },

  getUserById: async (userId) => {
    return await fetchWithAuth(`${apiConfig.endpoints.searchUsers}/${userId}`);
  },

  getUserRoles: async () => {
    return await fetchWithAuth(apiConfig.endpoints.userRoles);
  },

  getUserRolesById: async (userId) => {
    return await fetchWithAuth(`${apiConfig.endpoints.userRoles}/${userId}`);
  },

  updateUserRoles: async (data) => {
    return await fetchWithAuth(apiConfig.endpoints.userRoles, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  updateUserAttributes: async (data) => {
    return await fetchWithAuth("/user/attributes", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  changePassword: async (data) => {
    return await fetchWithAuth("/user/password", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
};

// ============================================
// Provider Service
// ============================================
export const providerService = {
  getMyPatients: async () => {
    return await fetchWithAuth(apiConfig.endpoints.patients);
  },
};

// ============================================
// Patient Service
// ============================================
export const patientService = {
  getByUserId: async () => {
    return await fetchWithAuth(apiConfig.endpoints.provider);
  },

  selectProvider: async (data) => {
    return await fetchWithAuth(apiConfig.endpoints.provider, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
};

export default {
  health: healthService,
  ai: aiService,
  user: userService,
  provider: providerService,
  patient: patientService,
  upload: uploadService,
};