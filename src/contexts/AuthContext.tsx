"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Load user from sessionStorage (isolated per tab)
  useEffect(() => {
    const storedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    const authFlag =
      sessionStorage.getItem("isAuthenticated") ||
      localStorage.getItem("isAuthenticated");

    if (storedUser && authFlag === "true") {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // ✅ Sync logout across tabs (still works)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser =
        sessionStorage.getItem("user") || localStorage.getItem("user");
      const authFlag =
        sessionStorage.getItem("isAuthenticated") ||
        localStorage.getItem("isAuthenticated");

      if (!storedUser || authFlag !== "true") {
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Login: use sessionStorage for isolated sessions
  const login = (userData: User, rememberMe: boolean) => {
    setUser(userData);
    setIsAuthenticated(true);

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("user", JSON.stringify(userData));
    storage.setItem("isAuthenticated", "true");
  };

  // ✅ Logout: clear both storages
  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("isAuthenticated");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
