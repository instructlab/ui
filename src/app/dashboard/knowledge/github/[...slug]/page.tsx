// src/app/dashboard/knowledge/github/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditKnowledge from '@/components/Contribute/EditKnowledge/github/EditKnowledge';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditKnowledgePage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditKnowledge prNumber={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] != null ? true : false} />
    </AppLayout>
  );
};

export default EditKnowledgePage;
