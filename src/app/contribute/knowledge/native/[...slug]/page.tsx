// src/app/contribute/knowledge/native/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import ViewKnowledgePage from '@/components/Contribute/Knowledge/View/native/ViewKnowledgePage';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const KnowledgeNativePage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <ViewKnowledgePage branchName={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] === 'isDraft'} />
    </AppLayout>
  );
};

export default KnowledgeNativePage;
