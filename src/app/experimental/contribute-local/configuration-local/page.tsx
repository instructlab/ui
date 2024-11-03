// src/app/experimental/contribute-local/clone-repo/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import CloneRepoLocal from '@/components/Experimental/CloneRepoLocal/CloneRepoLocal';

const CloneRepoPage: React.FC = () => {
  return (
    <AppLayout>
      <CloneRepoLocal />
    </AppLayout>
  );
};

export default CloneRepoPage;
