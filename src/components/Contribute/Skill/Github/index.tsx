// src/components/Contribute/Skill/Github/index.tsx
'use client';
import React from 'react';
import { SkillEditFormData } from '@/types';
import SkillWizard from '@/components/Contribute/Skill/SkillWizard/SkillWizard';

export interface SkillFormProps {
  skillEditFormData?: SkillEditFormData;
}

export const SkillFormGithub: React.FunctionComponent<SkillFormProps> = ({ skillEditFormData }) => (
  <SkillWizard isGithubMode skillEditFormData={skillEditFormData} />
);

export default SkillFormGithub;
