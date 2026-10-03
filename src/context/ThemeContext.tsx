"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeMode, AccentColor } from "@/types";
import { useAuth } from "./AuthContext";
import { getUserSettings, updateUserSettings } from "@/services/firestore";

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
  accentClass: {
    bg: string;
    text: string;
    border: string;
    hoverBg: string;
    lightBg: string;
    ring: string;
  };
}

const ACCENT_MAP: Record<
  AccentColor,
  { bg: string; text: string; border: string; hoverBg: string; lightBg: string; ring: string }
> = {
  amber: {
    bg: "bg-amber-600 dark:bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
    hoverBg: "hover:bg-amber-700 dark:hover:bg-amber-600",
    lightBg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
    ring: "focus-visible:ring-amber-500",
  },
  indigo: {
    bg: "bg-indigo-600 dark:bg-indigo-500",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500",
    hoverBg: "hover:bg-indigo-700 dark:hover:bg-indigo-600",
    lightBg: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
    ring: "focus-visible:ring-indigo-500",
  },
  emerald: {
    bg: "bg-emerald-600 dark:bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500",
    hoverBg: "hover:bg-emerald-700 dark:hover:bg-emerald-600",
    lightBg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
    ring: "focus-visible:ring-emerald-500",
  },
  rose: {
    bg: "bg-rose-600 dark:bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500",
    hoverBg: "hover:bg-rose-700 dark:hover:bg-rose-600",
    lightBg: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300",
    ring: "focus-visible:ring-rose-500",
  },
  sky: {
    bg: "bg-sky-600 dark:bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500",
    hoverBg: "hover:bg-sky-700 dark:hover:bg-sky-600",
    lightBg: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300",
    ring: "focus-visible:ring-sky-500",
  },
  violet: {
    bg: "bg-violet-600 dark:bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500",
    hoverBg: "hover:bg-violet-700 dark:hover:bg-violet-600",
    lightBg: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300",
    ring: "focus-visible:ring-violet-500",
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [accentColor, setAccentColorState] = useState<AccentColor>("amber");

  // Load from local storage or firestore settings
  useEffect(() => {
    const savedTheme = localStorage.getItem("notenest_theme") as ThemeMode | null;
    const savedAccent = localStorage.getItem("notenest_accent") as AccentColor | null;

    if (savedTheme) setThemeState(savedTheme);
    if (savedAccent && ACCENT_MAP[savedAccent]) setAccentColorState(savedAccent);

    if (user) {
      getUserSettings(user.uid).then((settings) => {
        if (settings) {
          if (settings.theme) setThemeState(settings.theme);
          if (settings.accentColor && ACCENT_MAP[settings.accentColor]) {
            setAccentColorState(settings.accentColor);
          }
        }
      }).catch(console.error);
    }
  }, [user]);

  // Handle system vs user light/dark change
  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      if (isDark) {
        root.classList.add("dark");
        setResolvedTheme("dark");
      } else {
        root.classList.remove("dark");
        setResolvedTheme("light");
      }
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem("notenest_theme", newTheme);
    if (user) {
      updateUserSettings(user.uid, { theme: newTheme }).catch(console.error);
    }
  };

  const setAccentColor = (newAccent: AccentColor) => {
    setAccentColorState(newAccent);
    localStorage.setItem("notenest_accent", newAccent);
    if (user) {
      updateUserSettings(user.uid, { accentColor: newAccent }).catch(console.error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        accentColor,
        setAccentColor,
        accentClass: ACCENT_MAP[accentColor] || ACCENT_MAP.amber,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
