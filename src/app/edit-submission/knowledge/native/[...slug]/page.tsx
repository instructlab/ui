// src/app/edit-submission/knowledge/[...slug]/page.tsx
import { AppLayout } from '@/components/AppLayout';
import EditKnowledgeNative from '@/components/Contribute/EditKnowledge/native/EditKnowledge';
import * as React from 'react';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditKnowledgePage = async ({ params }: PageProps) => {
  const contribution = await params;
  return (
    <AppLayout className="contribute-page">
      <EditKnowledgeNative branchName={contribution.slug[0]} isDraft={contribution.slug[1] != null ? true : false} />
    </AppLayout>
  );
};

export default EditKnowledgePage;
