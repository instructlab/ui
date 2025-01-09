// src/components/ThemePreference/ThemePreference.tsx
import React, { useEffect, useState } from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';

const ThemePreference: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    const applyTheme = (dark: boolean) => {
      document.documentElement.classList.toggle('pf-v6-theme-dark', dark);
      document.documentElement.classList.toggle('pf-v6-theme-light', !dark);
    };

    // Retrieve saved theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      const isDarkMode = savedTheme === 'dark';
      setIsDark(isDarkMode);
      applyTheme(isDarkMode);
    } else {
      // Fallback to system preference
      setIsDark(false);
      applyTheme(false);
    }

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        // Only apply if user hasn't set a preference
        setIsDark(e.matches);
        applyTheme(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.documentElement.classList.add('pf-v6-theme-dark');
      document.documentElement.classList.remove('pf-v6-theme-light');
    } else {
      document.documentElement.classList.add('pf-v6-theme-light');
      document.documentElement.classList.remove('pf-v6-theme-dark');
    }
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <Tooltip content={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
      <Button variant="plain" onClick={toggleTheme} aria-label="Toggle dark and light theme">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </Button>
    </Tooltip>
  );
};

export default ThemePreference;
