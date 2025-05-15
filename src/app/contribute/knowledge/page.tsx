// src/app/contribute/knowledge/page.tsx
'use client';
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import KnowledgeForm from '@/components/Contribute/Knowledge/Edit/KnowledgeForm';

const AddKnowledgePage: React.FunctionComponent = () => (
  <AppLayout className="contribute-page">
    <KnowledgeForm />
  </AppLayout>
);

export default AddKnowledgePage;
