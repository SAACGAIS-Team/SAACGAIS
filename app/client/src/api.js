import { apiConfig } from "./apiConfig.js";

// ============================================
// Fetch Helper with Cognito Auth
// ============================================
async function fetchWithAuth(endpoint, options = {}, token = null) {
  const url = `${apiConfig.baseUrl}${endpoint}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Parse response
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
// Fetch with FormData (for file uploads)
// ============================================
async function fetchWithAuthFormData(endpoint, formData, token = null) {
  const url = `${apiConfig.baseUrl}${endpoint}`;

  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
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
  query: async (prompt, token) => {
    return await fetchWithAuth(apiConfig.endpoints.ai, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }, token);
  },

  // OLD FUNCTION, NEEDS TO ONLY PROMPT THE AI IN THE FUTURE, NEW VERSION IS UPLOAD SERVICE BELOW
  // uploadFile: async (userMessage, file, token) => {
  //   const formData = new FormData();
  //   formData.append("userMessage", userMessage);
  //   if (file) {
  //     formData.append("file", file);
  //   }
  //   return await fetchWithAuthFormData("/ai/upload", formData, token);
  // },
};

// ============================================
// Upload Service
// ============================================
export const uploadService = {
  uploadFiles: async (files, token) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    return await fetchWithAuthFormData("/upload/file", formData, token);
  },

  uploadText: async (text, token) => {
    return await fetchWithAuth("/upload/text", {
      method: "POST",
      body: JSON.stringify({ text }),
    }, token);
  },

  getFileUploads: async (token) => {
    return await fetchWithAuth("/upload/file", {}, token);
  },

  getTextUploads: async (token) => {
    return await fetchWithAuth("/upload/text", {}, token);
  },

  getSignedUrl: async (s3Key, token) => {
    return await fetchWithAuth(`/upload/signed-url?key=${encodeURIComponent(s3Key)}`, {}, token);
  },

  downloadFile: async (s3Key, token) => {
    const url = `${apiConfig.baseUrl}/upload/download?key=${encodeURIComponent(s3Key)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Download failed");
    return response.blob();
  },
};

// ============================================
// User Service
// ============================================
export const userService = {
  searchUsers: async (query, token) => {
    return await fetchWithAuth(`/search-users?search=${encodeURIComponent(query)}`, {}, token);
  },

  searchUsersByRole: async (role, query, token) => {
    return await fetchWithAuth(
      `/search-users?role=${encodeURIComponent(role)}&search=${encodeURIComponent(query)}`, {}, token
    );
  },

  getUserById: async (userId, token) => {
    return await fetchWithAuth(`/search-users/${userId}`, {}, token);
  },

  getUserRoles: async (token) => {
    return await fetchWithAuth("/user-roles", {}, token);
  },

  getUserRolesById: async (userId, token) => {
    return await fetchWithAuth(`/user-roles/${userId}`, {}, token);
  },

  updateUserRoles: async (data, token) => {
    return await fetchWithAuth("/user-roles", {
      method: "POST",
      body: JSON.stringify(data),
    }, token);
  },

  updateUserAttributes: async (data, token) => {
    return await fetchWithAuth("/user/attributes", {
      method: "PUT",
      body: JSON.stringify(data),
    }, token);
  },

  changePassword: async (data, token) => {
    return await fetchWithAuth("/user/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }, token);
  },
};

// ============================================
// Provider Service
// ============================================
export const providerService = {
  getAll: async (token) => {
    return await fetchWithAuth("/provider", {}, token);
  },

  getById: async (id, token) => {
    return await fetchWithAuth(`/provider/${id}`, {}, token);
  },

  getByUserId: async (token) => {
    return await fetchWithAuth("/provider", {}, token);
  },

  create: async (providerData, token) => {
    return await fetchWithAuth("/provider", {
      method: "POST",
      body: JSON.stringify(providerData),
    }, token);
  },

  selectProvider: async (data, token) => {
    return await fetchWithAuth("/provider", {
      method: "POST",
      body: JSON.stringify(data),
    }, token);
  },

  update: async (id, providerData, token) => {
    return await fetchWithAuth(`/provider/${id}`, {
      method: "PUT",
      body: JSON.stringify(providerData),
    }, token);
  },

  delete: async (id, token) => {
    return await fetchWithAuth(`/provider/${id}`, {
      method: "DELETE",
    }, token);
  },
};

// ============================================
// Patient Service
// ============================================
export const patientService = {
  getAll: async (token) => {
    return await fetchWithAuth("/patients", {}, token);
  },

  getById: async (patientId, token) => {
    return await fetchWithAuth(`/patients/${patientId}`, {}, token);
  },

  create: async (patientData, token) => {
    return await fetchWithAuth("/patients", {
      method: "POST",
      body: JSON.stringify(patientData),
    }, token);
  },

  update: async (patientId, patientData, token) => {
    return await fetchWithAuth(`/patients/${patientId}`, {
      method: "PUT",
      body: JSON.stringify(patientData),
    }, token);
  },

  delete: async (patientId, token) => {
    return await fetchWithAuth(`/patients/${patientId}`, {
      method: "DELETE",
    }, token);
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