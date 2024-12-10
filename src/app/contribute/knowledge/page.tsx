// src/app/contribute/knowledge/page.tsx
import KnowledgeFormNative from '@/components/Contribute/Native/Knowledge';
import * as React from 'react';
import { AppLayout } from '../../../components/AppLayout';
import { KnowledgeFormGithub } from '../../../components/Contribute/Github/Knowledge';

const KnowledgeFormPage: React.FC = () => {
  return <AppLayout>{process.env.IL_UI_DEPLOYMENT === 'native' ? <KnowledgeFormNative /> : <KnowledgeFormGithub />}</AppLayout>;
};

export default KnowledgeFormPage;
