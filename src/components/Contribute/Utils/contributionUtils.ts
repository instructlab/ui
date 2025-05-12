import { KnowledgeFile, KnowledgeFormData, SkillFormData } from '@/types';
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

export const getWordCount = (text?: string): number => text?.split(/\s+/).filter((word) => word.length > 0).length ?? 0;

export const compareKnowledgeFileDates = (a: KnowledgeFile, b: KnowledgeFile): number => {
  const now = new Date().getTime();
  const aDate = a.commitDate ? Date.parse(a.commitDate) : now;
  const bDate = b.commitDate ? Date.parse(b.commitDate) : now;

  return aDate - bDate;
};

export const descendingCompareKnowledgeFileDates = (a: KnowledgeFile, b: KnowledgeFile): number => {
  return compareKnowledgeFileDates(a, b) * -1;
};
