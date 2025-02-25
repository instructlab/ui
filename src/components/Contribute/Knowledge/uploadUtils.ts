import { KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { yamlSeedExampleToFormSeedExample } from '@/components/Contribute/Knowledge/seedExampleUtils';

export const addYamlUploadKnowledge = (knowledgeFormData: KnowledgeFormData, data: KnowledgeYamlData): KnowledgeFormData => ({
  ...knowledgeFormData,
  name: data.created_by ?? knowledgeFormData.name,
  documentOutline: data.document_outline ?? '',
  submissionSummary: data.document_outline ?? '',
  domain: data.domain ?? '',
  knowledgeDocumentRepositoryUrl: data.document.repo ?? '',
  knowledgeDocumentCommit: data.document.commit ?? '',
  documentName: data.document.patterns.join(', ') ?? '',
  seedExamples: yamlSeedExampleToFormSeedExample(data.seed_examples)
});
