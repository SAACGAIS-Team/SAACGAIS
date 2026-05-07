const BASE_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:3001";

export const apiConfig = {
  baseUrl: BASE_URL,
  baseUrlAPI: `${BASE_URL}/api`,
  
  endpoints: {
    health: "/health",
    ai: "/ai",
    searchUsers: "/search-users",
    userRoles: "/user-roles",
    provider: "/provider",
    patients: "/provider/patients",
  },
  
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};