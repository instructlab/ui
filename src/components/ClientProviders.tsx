// src/components/ClientProvider.tsx
'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { EnvConfigProvider } from '@/context/EnvConfigContext';
import { FeatureFlagsProvider } from '@/context/FeatureFlagsContext';
import { AlertProvider } from '@/context/AlertContext';
import { SideDrawerProvider } from '@/context/SideDrawerContext';

interface ClientProviderProps {
  children: ReactNode;
}

const ClientProvider = ({ children }: ClientProviderProps) => {
  return (
    <SessionProvider>
      <EnvConfigProvider>
        <FeatureFlagsProvider>
          <ThemeProvider>
            <SideDrawerProvider>
              <AlertProvider>{children}</AlertProvider>
            </SideDrawerProvider>
          </ThemeProvider>
        </FeatureFlagsProvider>
      </EnvConfigProvider>
    </SessionProvider>
  );
};

export default ClientProvider;
