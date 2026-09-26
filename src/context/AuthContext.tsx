import React, { createContext, useContext, useEffect, useState } from "react";
import { api, getToken, type User, type UserStats } from "../api/client";

interface AuthContextType {
  user: User | null;
  stats: UserStats | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setStats(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.auth.getMe();
      setUser(data.user);
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch session:", err);
      api.auth.logout();
      setUser(null);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    setUser(res.user);
    await refreshUser();
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const res = await api.auth.register({ name, email, password, confirmPassword });
    setUser(res.user);
    await refreshUser();
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setStats(null);
  };

  const updateName = async (name: string) => {
    const res = await api.auth.updateProfile(name);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
