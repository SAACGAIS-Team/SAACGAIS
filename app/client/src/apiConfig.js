export const apiConfig = {
  baseUrl: "http://localhost:3001/api",
  
  endpoints: {
    health: "/health",
    ai: "/ai",
    searchUsers: "/search-users",
    userRoles: "/user-roles",
    provider: "/provider",
    patients: "/patients",
  },
  
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
};