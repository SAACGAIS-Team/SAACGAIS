import PropTypes from "prop-types";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API = "http://localhost:3001";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);         // { email, given_name, family_name, sub, groups }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user from /auth/me (uses httpOnly cookie automatically)
  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/me`, { credentials: "include" });

      if (res.status === 401) {
        const data = await res.json();

        // Token expired — try to refresh
        if (data.code === "TOKEN_EXPIRED") {
          const refreshRes = await fetch(`${API}/auth/refresh`, {
            method: "POST",
            credentials: "include",
          });

          if (refreshRes.ok) {
            // Retry /auth/me after refresh
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
  }, []);

  // On mount, check if user is already logged in
  useEffect(() => {
    fetchMe().finally(() => setIsLoading(false));
  }, [fetchMe]);

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

    // If Cognito returned a challenge
    if (data.challenge) {
      return { challenge: data.challenge, session: data.session };
    }

    await fetchMe(); // populate user state from /auth/me
    return { success: true };
  }, [fetchMe]);

  const signup = useCallback(async ({ email, password, given_name, family_name, birthdate, phone_number }) => {
    setError(null);
    const res = await fetch(`${API}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password, given_name, family_name, birthdate, phone_number }),
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

    const data = await res.json();

    if (!res.ok) {
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
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.warn("Logout request failed:", err);
    }
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
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