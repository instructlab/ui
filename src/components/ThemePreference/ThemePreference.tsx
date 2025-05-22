// src/components/ThemePreference/ThemePreference.tsx
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core';
import { MoonIcon, SunIcon } from '@patternfly/react-icons';
import { useTheme } from '@/context/ThemeContext';

const ThemePreference: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <ToggleGroup aria-label="Theme toggle group">
      <ToggleGroupItem
        aria-label="light theme"
        icon={<SunIcon />}
        isSelected={theme === 'light'}
        onChange={() => {
          setTheme('light');
        }}
      />
      <ToggleGroupItem
        aria-label="dark theme"
        icon={<MoonIcon />}
        isSelected={theme === 'dark'}
        onChange={() => {
          setTheme('dark');
        }}
      />
    </ToggleGroup>
  );
};

export default ThemePreference;
