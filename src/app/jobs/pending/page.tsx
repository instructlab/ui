// src/app/jobs/pending/page.tsx
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { PendingJobs } from '../../../components/Jobs/Pending/';

const PendingJobsPage: React.FC = () => {
  return (
    <AppLayout>
      <PendingJobs />
    </AppLayout>
  );
};

export default PendingJobsPage;
