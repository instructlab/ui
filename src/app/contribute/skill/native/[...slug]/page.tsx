// src/app/contribute/knowledge/github/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkill from '@/components/Contribute/EditSkill/native/EditSkill';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditKnowledgePage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditSkill branchName={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] != null ? true : false} />
    </AppLayout>
  );
};

export default EditKnowledgePage;
