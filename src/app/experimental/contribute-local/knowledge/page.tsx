// src/app/experimental/contribute-local/knowledge/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import { KnowledgeFormLocal } from '@/components/Experimental/ContributeLocal/Knowledge';

const KnowledgeFormLocalPage: React.FC = () => {
  return (
    <AppLayout>
      <KnowledgeFormLocal />
    </AppLayout>
  );
};

export default KnowledgeFormLocalPage;
