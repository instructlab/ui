// src/app/experimental/contribute-local/skill/page.tsx
import * as React from 'react';
import { AppLayout } from '@/components/AppLayout';
import SkillFormLocal from '@/components/Experimental/ContributeLocal/Skill';

const SkillFormPageLocal: React.FC = () => {
  return (
    <AppLayout>
      <SkillFormLocal />
    </AppLayout>
  );
};

export default SkillFormPageLocal;
