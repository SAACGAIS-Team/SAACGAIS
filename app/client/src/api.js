import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { apiConfig } from "./apiConfig.js";

// ============================================
// Fetch Helper with Cognito Auth
// ============================================
async function fetchWithAuth(endpoint, options = {}) {
  const url = `${apiConfig.baseUrl}${endpoint}`;
  
  // Get Cognito token (aws-amplify v6)
  let token = null;
  try {
    const session = await fetchAuthSession();
    token = session.tokens?.idToken?.toString();
  } catch (error) {
    console.error("Failed to get auth token:", error);
  }
  
  // Build headers
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
  
  // Handle 401 - try token refresh
  if (response.status === 401 && !options._retry) {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      const newToken = session.tokens?.idToken?.toString();
      
      return fetchWithAuth(endpoint, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
        _retry: true,
      });
    } catch (refreshError) {
      await signOut();
      window.location.href = "/";
      throw new Error("Authentication failed");
    }
  }
  
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
async function fetchWithAuthFormData(endpoint, formData) {
  const url = `${apiConfig.baseUrl}${endpoint}`;
  
  // Get Cognito token (aws-amplify v6)
  let token = null;
  try {
    const session = await fetchAuthSession();
    token = session.tokens?.idToken?.toString();
  } catch (error) {
    console.error("Failed to get auth token:", error);
  }
  
  // Build headers (no Content-Type for FormData - browser sets it with boundary)
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });
  
  // Handle 401 - try token refresh
  if (response.status === 401) {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      const newToken = session.tokens?.idToken?.toString();
      
      headers.Authorization = `Bearer ${newToken}`;
      const retryResponse = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });
      
      const data = await retryResponse.json();
      if (!retryResponse.ok) {
        const error = new Error(data.error || "Request failed");
        error.response = { status: retryResponse.status, data };
        throw error;
      }
      return data;
    } catch (refreshError) {
      await signOut();
      window.location.href = "/";
      throw new Error("Authentication failed");
    }
  }
  
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
  
  uploadFile: async (userMessage, file) => {
    const formData = new FormData();
    formData.append("userMessage", userMessage);
    if (file) {
      formData.append("file", file);
    }
    
    return await fetchWithAuthFormData("/ai/upload", formData);
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
  
  getByUserId: async (userId) => {
    return await fetchWithAuth(`/provider?user=${encodeURIComponent(userId)}`);
  },
  
  create: async (providerData) => {
    // Note: DO NOT include userId - backend gets it from Cognito token
    return await fetchWithAuth("/provider", {
      method: "POST",
      body: JSON.stringify(providerData),
    });
  },
  
  selectProvider: async (data) => {
    // IMPORTANT: userId should be removed in backend - it gets from Cognito token
    return await fetchWithAuth("/provider", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  
  update: async (id, providerData) => {
    // Note: DO NOT include userId - backend gets it from Cognito token
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
    // CRITICAL: Do NOT include userId, providerId, etc.
    // Backend will use req.user.sub from Cognito token
    return await fetchWithAuth("/patients", {
      method: "POST",
      body: JSON.stringify(patientData),
    });
  },
  
  update: async (patientId, patientData) => {
    // CRITICAL: Do NOT include userId, providerId, etc.
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

// Export all services as default
export default {
  health: healthService,
  ai: aiService,
  user: userService,
  provider: providerService,
  patient: patientService,
};