// src/components/Contribute/Knowledge/Github/index.tsx
'use client';
import React from 'react';
import { KnowledgeEditFormData } from '@/types';
import KnowledgeWizard from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeWizard';

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
}
export const KnowledgeFormNative: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData }) => (
  <KnowledgeWizard isGithubMode knowledgeEditFormData={knowledgeEditFormData} />
);

export default KnowledgeFormNative;
