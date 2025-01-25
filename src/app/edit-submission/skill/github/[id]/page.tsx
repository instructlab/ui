// src/app/edit-submission/skill/[id]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkill from '@/components/Contribute/EditSkill/github/EditSkill';

type PageProps = {
  params: Promise<{ id: string }>;
};

const EditSkillPage = async ({ params }: PageProps) => {
  const resolvedParams = await params;
  const prNumber = parseInt(resolvedParams.id, 10);

  return (
    <AppLayout>
      <EditSkill prNumber={prNumber} />
    </AppLayout>
  );
};

export default EditSkillPage;
