// src/app/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { GithubAccessPopup } from '@/components/GithubAccessPopup';
import { AppLayout } from '../components/AppLayout';

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleWarningConditionAccepted = () => {
    router.push('/dashboard');
  };

  return (
    <AppLayout>
      <GithubAccessPopup onAccept={handleWarningConditionAccepted} />
    </AppLayout>
  );
};

export default HomePage;
