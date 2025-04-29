// src/app/dashboard/skill/[id]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkill from '@/components/Contribute/EditSkill/github/EditSkill';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditSkillPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditSkill prNumber={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] != null ? true : false} />
    </AppLayout>
  );
};

export default EditSkillPage;
