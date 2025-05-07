// src/app/contribute/knowledge/page.tsx
'use client';
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import KnowledgeWizard from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeWizard';

const AddKnowledgePage: React.FunctionComponent = () => (
  <AppLayout className="contribute-page">
    <KnowledgeWizard />
  </AppLayout>
);

export default AddKnowledgePage;
