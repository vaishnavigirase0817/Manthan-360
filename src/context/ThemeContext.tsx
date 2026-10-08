import React, { createContext, useContext, useEffect, ReactNode } from "react";

export type ThemeMode = "dark";

export interface ThemeContextType {
  theme: "dark";
  setTheme: (mode: "dark") => void;
  isDark: true;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Ensure dark mode is permanently active on root and body
    const root = document.documentElement;
    const body = document.body;

    root.classList.add("dark");
    root.classList.remove("light");
    body.classList.add("dark");
    body.classList.remove("light");

    // Clean any old light theme preference from localStorage
    localStorage.setItem("manthan360_theme", "dark");
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: "dark", setTheme: () => {}, isDark: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
