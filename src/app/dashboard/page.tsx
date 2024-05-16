// src/app/jobs/dashboard/page.tsx
import * as React from 'react';
import { AppLayout } from '../../components/AppLayout';
import { Index } from '../../components/Dashboard';

const DashboardPage: React.FC = () => {
  return (
    <AppLayout>
      <Index />
    </AppLayout>
  );
};

export default DashboardPage;
