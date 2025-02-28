// src/components/Contribute/Skill/Native/index.tsx
'use client';
import React from 'react';
import { SkillEditFormData } from '@/types';
import SkillWizard from '@/components/Contribute/Skill/SkillWizard/SkillWizard';

export interface SkillFormProps {
  skillEditFormData?: SkillEditFormData;
}

export const SkillFormNative: React.FunctionComponent<SkillFormProps> = ({ skillEditFormData }) => (
  <SkillWizard isGithubMode={false} skillEditFormData={skillEditFormData} />
);

export default SkillFormNative;
