// src/app/layout.tsx

import { ReactNode } from 'react';
import ClientProvider from '../components/ClientProviders';
import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/react-styles/css/components/Menu/menu.css';

interface RootLayoutProps {
  children: ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  return (
    <html lang="en">
      <head></head>
      <body>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
};

export default RootLayout;
