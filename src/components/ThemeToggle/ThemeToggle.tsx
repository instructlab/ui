// src/components/ThemeToggle/ThemeToggle.tsx
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import SunIcon from '@patternfly/react-icons/dist/dynamic/icons/sun-icon';
import MoonIcon from '@patternfly/react-icons/dist/dynamic/icons/moon-icon';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button variant="plain" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </Button>
  );
};

export default ThemeToggle;
