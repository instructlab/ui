// src/app/contribute/skill/page.tsx
import SkillFormNative from '@/components/Contribute/Native/Skill';
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { SkillFormGithub } from '../../../components/Contribute/Github/Skill';

const SkillFormPage: React.FC = () => {
  return <AppLayout>{process.env.IL_UI_DEPLOYMENT === 'native' ? <SkillFormNative /> : <SkillFormGithub />}</AppLayout>;
};

export default SkillFormPage;
