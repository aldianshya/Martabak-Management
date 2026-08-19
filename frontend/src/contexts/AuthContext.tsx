import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role } from "../types";
import { api } from "../api/client";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isKasir: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("martabak_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("martabak_token");
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyAuth() {
      const savedToken = localStorage.getItem("martabak_token");
      if (savedToken) {
        try {
          const profile = await api.getMe();
          setUser(profile);
          localStorage.setItem("martabak_user", JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setIsLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    const { token: receivedToken, user: receivedUser } = response.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem("martabak_token", receivedToken);
    localStorage.setItem("martabak_user", JSON.stringify(receivedUser));
    return receivedUser;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("martabak_token");
    localStorage.removeItem("martabak_user");
    window.location.href = "/login";
  };

  const isAdmin = user?.role === "ADMIN";
  const isKasir = user?.role === "KASIR";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        isKasir,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
