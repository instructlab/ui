// src/app/page.tsx
'use client';

import { GithubAccessPopup } from '@/components/GithubAccessPopup';
import * as React from 'react';
import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';
import { Index } from '../components/Dashboard';

const HomePage: React.FC = () => {
  const [isWarningConditionAccepted, setIsWarningConditionAccepted] = useState<boolean>(false);

  const handleWarningConditionAccepted = () => {
    if (!isWarningConditionAccepted) {
      setIsWarningConditionAccepted(true);
    }
  };

  return (
    <AppLayout>
      <GithubAccessPopup onAccept={handleWarningConditionAccepted} />
      {isWarningConditionAccepted && <Index />}
    </AppLayout>
  );
};

export default HomePage;
