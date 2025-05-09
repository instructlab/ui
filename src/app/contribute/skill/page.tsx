// src/app/contribute/skill/page.tsx
'use client';
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import SkillWizard from '@/components/Contribute/Skill/SkillWizard/SkillWizard';

const AddSkillPage: React.FunctionComponent = () => (
  <AppLayout className="contribute-page">
    <SkillWizard />
  </AppLayout>
);

export default AddSkillPage;
