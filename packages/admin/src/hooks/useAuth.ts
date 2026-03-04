import { useState, useCallback, useEffect } from "react";
import {
  AUTH_CHANGED_EVENT,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from "../lib/auth";

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  useEffect(() => {
    const syncToken = () => setToken(getStoredToken());

    window.addEventListener("storage", syncToken);
    window.addEventListener(AUTH_CHANGED_EVENT, syncToken);

    return () => {
      window.removeEventListener("storage", syncToken);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncToken);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message || "Login failed");
    }

    const { token } = await res.json();
    setStoredToken(token);
    setToken(token);
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setToken(null);
  }, []);

  return {
    token,
    isAuthenticated: !!token,
    login,
    logout,
  };
}
