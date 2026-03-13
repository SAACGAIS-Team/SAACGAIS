import PropTypes from "prop-types";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiConfig } from "../apiConfig.js";

const AuthContext = createContext(null);
const API = apiConfig.baseUrl;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  const fetchMe = useCallback(async () => {
    if (isLoggingOut) return;

    try {
      const res = await fetch(`${API}/auth/me`, {
        credentials: "include",
        headers: { "Cache-Control": "no-store" }
      });

      // Handle Token Expiration and Refresh
      if (res.status === 401) {
        const data = await res.json();
        if (data.code === "TOKEN_EXPIRED") {
          const refreshRes = await fetch(`${API}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (refreshRes.ok) {
            const retryRes = await fetch(`${API}/auth/me`, { credentials: "include" });
            if (retryRes.ok) {
              const retryData = await retryRes.json();
              setUser(retryData.user);
              return;
            }
          }
        }
        setUser(null);
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("fetchMe error:", err);
      setUser(null);
    }
  }, [isLoggingOut]);

  useEffect(() => {
    if (isLoggingOut) return;

    const initialize = async () => {
      try {
        await fetch(`${API}/auth/csrf-token`, { credentials: "include" });
        await fetchMe();
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = data.error || "Login failed.";
      setError(err);
      throw new Error(err);
    }

    if (data.challenge) return { challenge: data.challenge, session: data.session };

    await fetchMe();
    return { success: true };
  }, [fetchMe]);

  const signup = useCallback(async (payload) => {
    setError(null);
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = data.error || "Signup failed.";
      setError(err);
      throw new Error(err);
    }
    return { email: data.email };
  }, []);

  const confirm = useCallback(async (email, code) => {
    setError(null);
    const res = await fetch(`${API}/auth/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, code }),
    });

    if (!res.ok) {
      const data = await res.json();
      const err = data.error || "Confirmation failed.";
      setError(err);
      throw new Error(err);
    }
    return true;
  }, []);

  const resendCode = useCallback(async (email) => {
    const res = await fetch(`${API}/auth/resend-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Failed to resend code.");
    return true;
  }, []);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch(`${API}/auth/logout`, { 
        method: "POST", 
        credentials: "include" 
      });
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      setUser(null);
      setIsLoggingOut(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        signup,
        confirm,
        resendCode,
        logout,
        refreshUser: fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = { children: PropTypes.node.isRequired };

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}