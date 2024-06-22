// src/app/page.tsx
'use client';

import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import { Index } from '@/components/Dashboard';

const Home: React.FunctionComponent = () => {
  return (
    <AppLayout>
      <Index />
    </AppLayout>
  );
};

export default Home;
