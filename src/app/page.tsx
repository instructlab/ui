// src/app/page.tsx
'use client';

import * as React from 'react';
import { GithubAccessPopup } from '@/components/GithubAccessPopup';
import { AppLayout } from '../components/AppLayout';
import { Index } from '../components/Dashboard';

const HomePage: React.FC = () => {
  return (
    <AppLayout>
      <GithubAccessPopup />
      <Index />
    </AppLayout>
  );
};

export default HomePage;
