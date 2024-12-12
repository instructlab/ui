// src/app/contribute/skill/page.tsx
import SkillFormNative from '@/components/Contribute/Skill/Native';
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { SkillFormGithub } from '../../../components/Contribute/Skill/Github';

const SkillFormPage: React.FC = () => {
  return <AppLayout>{process.env.IL_UI_DEPLOYMENT === 'native' ? <SkillFormNative /> : <SkillFormGithub />}</AppLayout>;
};

export default SkillFormPage;
