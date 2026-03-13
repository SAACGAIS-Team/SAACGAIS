import { apiConfig } from "./apiConfig.js";

// ============================================
// Fetch Helper — cookies sent automatically
// ============================================
async function fetchWithAuth(endpoint, options = {}) {
  const url = `${apiConfig.baseUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // sends httpOnly cookie on every request
  });

  const contentType = response.headers.get("content-type");
  let data;

  if (contentType && contentType.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const error = new Error(data.error || data.message || "Request failed");
    error.response = { status: response.status, data };
    throw error;
  }

  return data;
}

// ============================================
// Fetch with FormData (file uploads)
// ============================================
async function fetchWithAuthFormData(endpoint, formData) {
  const url = `${apiConfig.baseUrl}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include", // sends httpOnly cookie
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
  query: async (prompt) => {
    return await fetchWithAuth(apiConfig.endpoints.ai, {
      method: "POST",
      body: JSON.stringify({ prompt }),
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

  getFileUploads: async () => {
    return await fetchWithAuth("/upload/file");
  },

  getTextUploads: async () => {
    return await fetchWithAuth("/upload/text");
  },

  getSignedUrl: async (s3Key) => {
    return await fetchWithAuth(`/upload/signed-url?key=${encodeURIComponent(s3Key)}`);
  },

  downloadFile: async (s3Key) => {
    const url = `${apiConfig.baseUrl}/upload/download?key=${encodeURIComponent(s3Key)}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Download failed");
    return response.blob();
  },
};

// ============================================
// User Service
// ============================================
export const userService = {
  searchUsers: async (query) => {
    return await fetchWithAuth(`/search-users?search=${encodeURIComponent(query)}`);
  },

  searchUsersByRole: async (role, query) => {
    return await fetchWithAuth(
      `/search-users?role=${encodeURIComponent(role)}&search=${encodeURIComponent(query)}`
    );
  },

  getUserById: async (userId) => {
    return await fetchWithAuth(`/search-users/${userId}`);
  },

  getUserRoles: async () => {
    return await fetchWithAuth("/user-roles");
  },

  getUserRolesById: async (userId) => {
    return await fetchWithAuth(`/user-roles/${userId}`);
  },

  updateUserRoles: async (data) => {
    return await fetchWithAuth("/user-roles", {
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
  getAll: async () => {
    return await fetchWithAuth("/provider");
  },

  getById: async (id) => {
    return await fetchWithAuth(`/provider/${id}`);
  },

  getByUserId: async () => {
    return await fetchWithAuth("/provider");
  },

  create: async (providerData) => {
    return await fetchWithAuth("/provider", {
      method: "POST",
      body: JSON.stringify(providerData),
    });
  },

  selectProvider: async (data) => {
    return await fetchWithAuth("/provider", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  update: async (id, providerData) => {
    return await fetchWithAuth(`/provider/${id}`, {
      method: "PUT",
      body: JSON.stringify(providerData),
    });
  },

  delete: async (id) => {
    return await fetchWithAuth(`/provider/${id}`, {
      method: "DELETE",
    });
  },
};

// ============================================
// Patient Service
// ============================================
export const patientService = {
  getAll: async () => {
    return await fetchWithAuth("/patients");
  },

  getById: async (patientId) => {
    return await fetchWithAuth(`/patients/${patientId}`);
  },

  create: async (patientData) => {
    return await fetchWithAuth("/patients", {
      method: "POST",
      body: JSON.stringify(patientData),
    });
  },

  update: async (patientId, patientData) => {
    return await fetchWithAuth(`/patients/${patientId}`, {
      method: "PUT",
      body: JSON.stringify(patientData),
    });
  },

  delete: async (patientId) => {
    return await fetchWithAuth(`/patients/${patientId}`, {
      method: "DELETE",
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