// src/app/jobs/failed/page.tsx
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { FailedJobs } from '../../../components/Jobs/Failed/';

const FailedJobsPage: React.FC = () => {
  return (
    <AppLayout>
      <FailedJobs />
    </AppLayout>
  );
};

export default FailedJobsPage;
