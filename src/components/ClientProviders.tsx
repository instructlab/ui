// src/components/ClientProvider.tsx
'use client';

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { EnvConfigProvider } from '@/context/EnvConfigContext';
import { FeatureFlagsProvider } from '@/context/FeatureFlagsContext';
import { AlertProvider } from '@/context/AlertContext';

interface ClientProviderProps {
  children: ReactNode;
}

const ClientProvider = ({ children }: ClientProviderProps) => {
  return (
    <SessionProvider>
      <EnvConfigProvider>
        <FeatureFlagsProvider>
          <ThemeProvider>
            <AlertProvider>{children}</AlertProvider>
          </ThemeProvider>
        </FeatureFlagsProvider>
      </EnvConfigProvider>
    </SessionProvider>
  );
};

export default ClientProvider;
