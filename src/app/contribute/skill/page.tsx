// src/app/contribute/skill/page.tsx
'use client';
import React from 'react';
import { AppLayout } from '@/components/AppLayout';
import SkillForm from '@/components/Contribute/Skill/Edit/SkillForm';

const AddSkillPage: React.FunctionComponent = () => (
  <AppLayout className="contribute-page">
    <SkillForm />
  </AppLayout>
);

export default AddSkillPage;
