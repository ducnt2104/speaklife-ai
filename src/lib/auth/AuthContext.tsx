"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

interface UserSettings {
  theme: "light" | "dark" | "system";
  accent_color: string;
  font_size: "small" | "medium" | "large";
  language: "vi" | "en";
  reduced_motion: boolean;
  compact_mode: boolean;
  notifications_enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, displayName: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<boolean>;
}

const defaultSettings: UserSettings = {
  theme: "system",
  accent_color: "violet",
  font_size: "medium",
  language: "vi",
  reduced_motion: false,
  compact_mode: false,
  notifications_enabled: true,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  settings: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  refreshUser: async () => {},
  updateSettings: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          setSettings(data.settings || defaultSettings);
          return;
        }
      }
    } catch {
      // Network error, user not authenticated
    }
    setUser(null);
    // Load local settings for unauthenticated users
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("speaklife_settings");
        if (local) setSettings(JSON.parse(local));
        else setSettings(defaultSettings);
      } catch {
        setSettings(defaultSettings);
      }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  // Apply theme whenever settings change
  useEffect(() => {
    if (!settings || typeof window === "undefined") return;

    const root = document.documentElement;

    // Theme
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = settings.theme === "dark" || (settings.theme === "system" && prefersDark);
    root.classList.toggle("dark", isDark);

    // Font size
    const fontSizes = { small: "14px", medium: "16px", large: "18px" };
    root.style.fontSize = fontSizes[settings.font_size] || "16px";

    // Reduced motion
    root.classList.toggle("reduce-motion", settings.reduced_motion);

    // Compact mode
    root.classList.toggle("compact", settings.compact_mode);

    // Accent color data attribute
    root.setAttribute("data-accent", settings.accent_color);
  }, [settings]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
        return { success: true };
      }
      const errorMsg = typeof data.error === "object" ? data.error?.message : data.error;
      return { success: false, error: errorMsg || "Đăng nhập thất bại" };
    } catch {
      return { success: false, error: "Lỗi kết nối máy chủ" };
    }
  };

  const register = async (email: string, displayName: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await refreshUser();
        return { success: true };
      }
      const errorMsg = typeof data.error === "object" ? data.error?.message : data.error;
      return { success: false, error: errorMsg || "Đăng ký thất bại" };
    } catch {
      return { success: false, error: "Lỗi kết nối máy chủ" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    setSettings(defaultSettings);
  };

  const updateSettings = async (updates: Partial<UserSettings>) => {
    const newSettings = { ...settings, ...updates } as UserSettings;
    setSettings(newSettings); // Optimistic update

    if (user) {
      // Save to server for authenticated users
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          setSettings(settings); // Revert on failure
          return false;
        }
        return true;
      } catch {
        setSettings(settings);
        return false;
      }
    } else {
      // Save to localStorage for unauthenticated users
      if (typeof window !== "undefined") {
        localStorage.setItem("speaklife_settings", JSON.stringify(newSettings));
      }
      return true;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        updateSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
