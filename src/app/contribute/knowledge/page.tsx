// src/app/contribute/knowledge/page.tsx
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { KnowledgeForm } from '../../../components/Contribute/Knowledge';

const KnowledgeFormPage: React.FC = () => {
  return (
    <AppLayout>
      <KnowledgeForm />
    </AppLayout>
  );
};

export default KnowledgeFormPage;
