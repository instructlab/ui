import { KnowledgeFormData, SkillFormData } from '@/types';
import { createDefaultKnowledgeSeedExamples, createDefaultSkillSeedExamples } from './seedExampleUtils';

export const getDefaultKnowledgeFormData = (): KnowledgeFormData => {
  return {
    branchName: `knowledge-contribution-${Date.now()}`,
    email: '',
    name: '',
    submissionSummary: '',
    filePath: '',
    seedExamples: createDefaultKnowledgeSeedExamples(),
    knowledgeDocumentRepositoryUrl: '',
    knowledgeDocumentCommit: '',
    documentName: '',
    titleWork: '',
    linkWork: '',
    revision: '',
    licenseWork: '',
    creators: '',
    filesToUpload: [],
    uploadedFiles: []
  };
};

export const getDefaultSkillFormData = (): SkillFormData => {
  return {
    branchName: `skill-contribution-${Date.now()}`,
    email: '',
    name: '',
    submissionSummary: '',
    filePath: '',
    seedExamples: createDefaultSkillSeedExamples(),
    titleWork: '',
    licenseWork: '',
    creators: ''
  };
};
