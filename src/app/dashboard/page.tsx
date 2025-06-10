// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import DashboardPage from '@/components/Dashboard/DashboardPage';

const Home: React.FunctionComponent = () => (
  <AppLayout className="dashboard-page">
    <DashboardPage />
  </AppLayout>
);

export default Home;
