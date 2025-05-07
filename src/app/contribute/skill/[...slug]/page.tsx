// src/app/contribute/skill/[...slug]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import ViewSkillPage from '@/components/Contribute/Skill/View/ViewSkillPage';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const SkillViewPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;

  return (
    <AppLayout className="contribute-page">
      <ViewSkillPage branchName={resolvedParams.slug[0]} isDraft={resolvedParams.slug[1] === 'isDraft'} />
    </AppLayout>
  );
};

export default SkillViewPage;
