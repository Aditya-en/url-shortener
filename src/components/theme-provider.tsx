// src/components/theme-provider.tsx
import React, { JSX, createContext, useContext, useEffect, useState } from "react";

// Define the possible theme values
type Theme = "dark" | "light" | "system";

// Define the props for the ThemeProvider component
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Define the shape of the context value
interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Define the initial state for the context
// This is used if useContext is called outside a provider
const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => console.warn("setTheme called outside of ThemeProvider"),
};

// Create the context with the initial state and type
const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps): JSX.Element {
  const [theme, setTheme] = useState<Theme>(() => {
      try {
          const storedTheme = localStorage.getItem(storageKey);
          if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
              return storedTheme;
          }
      } catch (e) {
          console.error("Error reading theme from localStorage", e);
          // Fallback to default if localStorage access fails or value is invalid
      }
      return defaultTheme;
  });


  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    let effectiveTheme = theme;
    if (theme === "system") {
      // Check system preference
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      effectiveTheme = systemTheme;
    }

    root.classList.add(effectiveTheme);

  // Add listener for system theme changes only if current theme is 'system'
  // Return cleanup function to remove listener
    if (theme === 'system') {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
            const systemTheme = mediaQuery.matches ? "dark" : "light";
            root.classList.remove("light", "dark");
            root.classList.add(systemTheme);
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }

  }, [theme]); // Rerun effect when theme changes

  const value: ThemeProviderState = {
    theme,
    setTheme: (newTheme: Theme) => {
      try {
          localStorage.setItem(storageKey, newTheme);
      } catch (e) {
          console.error("Error saving theme to localStorage", e);
      }
      setTheme(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// Custom hook to use the theme context, ensuring it's used within a provider
export const useTheme = (): ThemeProviderState => {
  const context = useContext(ThemeProviderContext);

  // Check if context is still the initial default value (meaning no Provider found)
  if (context === initialState) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};