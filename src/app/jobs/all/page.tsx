// src/app/jobs/all/page.tsx
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { AllJobs } from '../../../components/Jobs/All/';

const AllJobsPage: React.FC = () => {
  return (
    <AppLayout>
      <AllJobs />
    </AppLayout>
  );
};

export default AllJobsPage;
