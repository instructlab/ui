// src/app/contribute/knowledge/edit/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditKnowledge from '@/components/Contribute/Knowledge/Edit/EditKnowledge';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditKnowledgePage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditKnowledge branchName={resolvedParams.slug[0]} />
    </AppLayout>
  );
};

export default EditKnowledgePage;
