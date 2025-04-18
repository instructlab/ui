import { KnowledgeSeedExample } from '@/types';

export const getSeedExampleTitle = (seedExample: KnowledgeSeedExample, seedExampleIndex: number) =>
  seedExample.knowledgeFile?.filename
    ? `Seed example ${seedExampleIndex + 1}: ${seedExample.knowledgeFile?.filename}`
    : `Select context for seed example ${seedExampleIndex + 1}`;
