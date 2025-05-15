import { KnowledgeSeedExample } from '@/types';

export const getKnowledgeSeedExampleTitle = (seedExample: KnowledgeSeedExample, seedExampleIndex: number) =>
  seedExample.context
    ? `Seed example ${seedExampleIndex + 1}: ${seedExample.knowledgeFile?.filename || ''}`
    : `Select context for seed example ${seedExampleIndex + 1}`;
