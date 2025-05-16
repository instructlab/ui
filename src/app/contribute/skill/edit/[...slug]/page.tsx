// src/app/contribute/skill/edit/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout, FeaturePages } from '@/components/AppLayout';
import EditSkill from '@/components/Contribute/Skill/Edit/EditSkill';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditSkillPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page" requiredFeature={FeaturePages.Skill}>
      <EditSkill branchName={resolvedParams.slug[0]} />
    </AppLayout>
  );
};

export default EditSkillPage;
