import { apiConfig } from "./apiConfig.js";

let _csrfToken = null;
let _initPromise = null;

export function initializeApi() {
  if (_initPromise) {
    return _initPromise;
  }
  _initPromise = fetch(`${apiConfig.baseUrl}/auth/csrf-token`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((data) => {
      _csrfToken = data.csrfToken;
    })
    .catch(() => {});
  return _initPromise;
}

export async function refreshCsrfToken() {
  _initPromise = null;
  return initializeApi();
}

function getCsrfToken() {
  return _csrfToken;
}

// ============================================
// Fetch Helper — JSON
// ============================================
async function fetchWithAuth(endpoint, options = {}) {
  const url = `${apiConfig.baseUrlAPI}${endpoint}`;

  const token = getCsrfToken();
  const defaultOptions = {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-CSRF-Token": token } : {}),
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...(options.headers || {}) },
  };

  let response = await fetch(url, mergedOptions);

  if (response.status === 401) {
    const refreshRes = await fetch(`${apiConfig.baseUrl}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      const retryOptions = {
        ...mergedOptions,
        headers: {
          ...mergedOptions.headers,
          ...(getCsrfToken() ? { "X-CSRF-Token": getCsrfToken() } : {}),
        },
      };
      response = await fetch(url, retryOptions);
    } else {
      await fetch(`${apiConfig.baseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      window.dispatchEvent(new CustomEvent("auth:sessionExpired"));
      return;
    }
  }

  const data = response.status !== 204 ? await response.json() : {};

  if (!response.ok) {
    const message = response.status !== 204
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
// Fetch with Blob (file downloads)
// ============================================
async function fetchWithAuthBlob(endpoint) {
  const url = `${apiConfig.baseUrlAPI}${endpoint}`;
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
    return await fetchWithAuthBlob(`/upload/download/${id}`);
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