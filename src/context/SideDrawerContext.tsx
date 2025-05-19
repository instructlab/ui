// src/context/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SideDrawerContext {
  sideDrawerContent: React.ReactNode | null;
  setSideDrawerContent: (content: React.ReactNode) => void;
  close: () => void;
}

const SideDrawerContext = createContext<SideDrawerContext | undefined>(undefined);

export const SideDrawerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sideDrawerContent, setSideDrawerContent] = useState<React.ReactNode | null>(null);

  const close = React.useCallback(() => setSideDrawerContent(null), []);

  return <SideDrawerContext.Provider value={{ sideDrawerContent, setSideDrawerContent, close }}>{children}</SideDrawerContext.Provider>;
};

export const useSideDrawer = () => {
  const context = useContext(SideDrawerContext);
  if (!context) {
    throw new Error('useSideDrawer must be used within a SideDrawerProvider');
  }
  return context;
};
