// src/hooks/use-auth.ts
"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  logout as authLogout,
  getCurrentUser,
  isAuthenticated as checkAuth,
  User,
} from "@/lib/auth";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on mount
    const authenticated = checkAuth();
    const currentUser = getCurrentUser();

    setIsAuthenticated(authenticated);
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const { user: userData } = await response.json();
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("isAuthenticated", "true");
      setUser(userData);
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = () => {
    void fetch("/api/auth/logout", { method: "POST" });
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
};
