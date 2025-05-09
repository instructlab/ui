// src/app/contribute/skill/edit/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkill from '@/components/Contribute/Skill/Edit/EditSkill';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditSkillPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditSkill branchName={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] === 'isDraft'} />
    </AppLayout>
  );
};

export default EditSkillPage;
