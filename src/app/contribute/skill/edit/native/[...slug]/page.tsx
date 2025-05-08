// src/app/contribute/skill/edit/native/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkill from '@/components/Contribute/Skill/Edit/native/EditSkill';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditSkillNativePage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditSkill branchName={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] === 'isDraft'} />
    </AppLayout>
  );
};

export default EditSkillNativePage;
