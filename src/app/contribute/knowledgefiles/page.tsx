// src/app/contribute/knowledgefiles/page.tsx
'use client';

import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import KnowledgeFiles from '@/components/Contribute/KnowledgeFiles';

const repoName = process.env.NEXT_PUBLIC_TAXONOMY_DOCUMENTS_REPO!.split('/').pop()!;

const KFiles: React.FunctionComponent = () => {
  return (
    <AppLayout>
      <KnowledgeFiles repoName={repoName} />
    </AppLayout>
  );
};

export default KFiles;
