// src/app/experimental/dashboard-local/page.tsx
'use client';

import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import { DashboardLocal } from '@/components/Experimental/DashboardLocal';

const Home: React.FunctionComponent = () => {
  return (
    <AppLayout>
      <DashboardLocal />
    </AppLayout>
  );
};

export default Home;
