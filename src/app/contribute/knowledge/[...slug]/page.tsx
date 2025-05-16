// src/app/contribute/knowledge/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import ViewKnowledgePage from '@/components/Contribute/Knowledge/View/ViewKnowledgePage';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const KnowledgeViewPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <ViewKnowledgePage branchName={resolvedParams.slug[0]} />
    </AppLayout>
  );
};

export default KnowledgeViewPage;
