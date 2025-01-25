// src/app/edit-submission/skill/[id]/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import EditSkillNative from '@/components/Contribute/EditSkill/native/EditSkill';

type PageProps = {
  params: Promise<{ id: string }>;
};

const EditSkillPage = async ({ params }: PageProps) => {
  const branchName = await params;

  return (
    <AppLayout>
      <EditSkillNative branchName={branchName.id} />
    </AppLayout>
  );
};

export default EditSkillPage;
