// src/app/contribute/knowledge/edit/github/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditKnowledge from '@/components/Contribute/Knowledge/Edit/github/EditKnowledge';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditKnowledgeGithubPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditKnowledge branchName={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] === 'isDraft'} />
    </AppLayout>
  );
};

export default EditKnowledgeGithubPage;
