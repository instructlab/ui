// src/app/contribute/skill/page.tsx
'use client';
import React from 'react';
import { AppLayout, FeaturePages } from '@/components/AppLayout';
import SkillForm from '@/components/Contribute/Skill/Edit/SkillForm';

const AddSkillPage: React.FunctionComponent = () => (
  <AppLayout className="contribute-page" requiredFeature={FeaturePages.Skill}>
    <SkillForm />
  </AppLayout>
);

export default AddSkillPage;
