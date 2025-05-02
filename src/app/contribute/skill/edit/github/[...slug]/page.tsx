// src/app/contribute/skill/edit/github/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkill from '@/components/Contribute/Skill/Edit/github/EditSkill';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditSkillGithubPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <EditSkill branchName={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] === 'isDraft'} />
    </AppLayout>
  );
};

export default EditSkillGithubPage;
