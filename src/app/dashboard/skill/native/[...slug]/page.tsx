// src/app/dashboard/skill/[id]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkillNative from '@/components/Contribute/EditSkill/native/EditSkill';

type PageProps = {
  params: Promise<{ slug: string[] }>;
};

const EditSkillPage = async ({ params }: PageProps) => {
  const contribution = await params;

  return (
    <AppLayout className="contribute-page">
      <EditSkillNative branchName={contribution.slug[0]} isDraft={contribution.slug[1] != null ? true : false} />
    </AppLayout>
  );
};

export default EditSkillPage;
