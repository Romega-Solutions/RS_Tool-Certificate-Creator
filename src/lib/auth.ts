// src/lib/auth.ts
// Client-side helpers for reflecting the server-authenticated session in UI state.

export interface User {
  username: string;
  name: string;
  email: string;
}

export const logout = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
  }
};

export const getCurrentUser = (): User | null => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("isAuthenticated") === "true";
  }
  return false;
};
