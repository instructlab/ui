// src/context/ThemeContext.tsx
'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AlertProps } from '@patternfly/react-core';
import { AlertItem } from '@/types';

interface AlertContextType {
  alerts: AlertItem[];
  addAlert: (message: string, status: 'success' | 'danger') => void;
  removeAlert: (key: React.Key) => void;
}

const AlertContext = React.createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);

  const addAlert = React.useCallback((title: string, variant: AlertProps['variant']) => {
    const alertKey = uuidv4();
    const newAlert: AlertItem = { title, variant, key: alertKey };
    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
  }, []);

  const removeAlert = React.useCallback((key: React.Key) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.key !== key));
  }, []);

  return <AlertContext.Provider value={{ alerts, addAlert, removeAlert }}>{children}</AlertContext.Provider>;
};

export const useAlerts = () => {
  const context = React.useContext(AlertContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
