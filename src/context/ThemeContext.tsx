// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Retrieve saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        // Only apply if user hasn't set a preference
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const applyTheme = (dark: boolean) => {
      document.documentElement.classList.toggle('pf-v6-theme-dark', dark);
      document.documentElement.classList.toggle('pf-v6-theme-light', !dark);
    };

    applyTheme(theme === 'dark');
  }, [theme]);

  const onSetTheme = React.useCallback((newTheme: 'light' | 'dark') => {
    localStorage.setItem('theme', newTheme);
    setTheme(newTheme);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme: onSetTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
