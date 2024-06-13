// src/app/page.tsx
'use client';

import * as React from 'react';
import { AppLayout } from '../components/AppLayout';
import { Index } from '../components/Dashboard';

const HomePage: React.FC = () => {
  return (
    <AppLayout>
      <Index />
    </AppLayout>
  );
};

export default HomePage;
