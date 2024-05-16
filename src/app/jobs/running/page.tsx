// src/app/jobs/running/page.tsx
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { RunningJobs } from '../../../components/Jobs/Running/';

const RunningPage: React.FC = () => {
  return (
    <AppLayout>
      <RunningJobs />
    </AppLayout>
  );
};

export default RunningPage;
