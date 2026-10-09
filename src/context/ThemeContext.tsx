import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type ThemeMode = "dark" | "light";

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("manthan360_theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    }
    return "dark";
  });

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    const body = document.body;

    if (mode === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      body.classList.add("light");
      body.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      body.classList.add("dark");
      body.classList.remove("light");
    }

    try {
      localStorage.setItem("manthan360_theme", mode);
    } catch (e) {
      console.warn("Unable to persist theme to localStorage:", e);
    }
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

