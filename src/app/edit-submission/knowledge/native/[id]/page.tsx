// src/app/edit-submission/knowledge/[id]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditKnowledgeNative from '@/components/Contribute/EditKnowledge/native/EditKnowledge';

type PageProps = {
  params: Promise<{ id: string }>;
};

const EditKnowledgePage = async ({ params }: PageProps) => {
  const branchName = await params;

  return (
    <AppLayout>
      <EditKnowledgeNative branchName={branchName.id} />
    </AppLayout>
  );
};

export default EditKnowledgePage;
