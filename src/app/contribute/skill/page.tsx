// src/app/contribute/skill/page.tsx
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { SkillForm } from '../../../components/Contribute/Skill';

const SkillFormPage: React.FC = () => {
  return (
    <AppLayout>
      <SkillForm />
    </AppLayout>
  );
};

export default SkillFormPage;
