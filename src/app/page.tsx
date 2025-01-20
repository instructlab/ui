// src/app/page.tsx
'use client';

import { DashboardGithub } from '@/components/Dashboard/Github/dashboard';
import { GithubAccessPopup } from '@/components/GithubAccessPopup';
import * as React from 'react';
import { useState } from 'react';
import { AppLayout } from '../components/AppLayout';

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
      {isWarningConditionAccepted && <DashboardGithub />}
    </AppLayout>
  );
};

export default HomePage;
