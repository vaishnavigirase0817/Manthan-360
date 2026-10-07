import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeMode = "dark" | "light" | "system";

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem("manthan360_theme") as ThemeMode) || "dark";
  });

  const [isDark, setIsDark] = useState<boolean>(true);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    const applyTheme = (mode: ThemeMode) => {
      let activeDark = true;
      if (mode === "light") {
        activeDark = false;
      } else if (mode === "system") {
        activeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        activeDark = true;
      }

      setIsDark(activeDark);

      if (activeDark) {
        root.classList.add("dark");
        root.classList.remove("light");
        body.classList.add("dark");
        body.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
        body.classList.add("light");
        body.classList.remove("dark");
      }
    };

    applyTheme(theme);

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => {
    setThemeState(mode);
    localStorage.setItem("manthan360_theme", mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: "dark" as ThemeMode,
      setTheme: (mode: ThemeMode) => localStorage.setItem("manthan360_theme", mode),
      isDark: true,
    };
  }
  return context;
}
