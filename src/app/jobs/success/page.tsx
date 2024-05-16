// src/app/jobs/success/page.tsx
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { SuccessJobs } from '../../../components/Jobs/Success/';

const SuccessJobsPage: React.FC = () => {
  return (
    <AppLayout>
      <SuccessJobs />
    </AppLayout>
  );
};

export default SuccessJobsPage;
