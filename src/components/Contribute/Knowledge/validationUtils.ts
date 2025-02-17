import { ValidatedOptions } from '@patternfly/react-core';
import { KnowledgeFormData } from '@/types';

export const isAuthInfoValid = (knowledgeFormData: KnowledgeFormData): boolean => !!knowledgeFormData.email && !!knowledgeFormData.name;

export const isKnowledgeInfoValid = (knowledgeFormData: KnowledgeFormData): boolean => {
  const description = knowledgeFormData.submissionSummary.trim();
  if (!description.length) {
    return false;
  }

  const domain = knowledgeFormData.domain.trim();
  if (!domain.length) {
    return false;
  }

  const outline = knowledgeFormData.documentOutline.trim();
  if (outline.length < 40) {
    return false;
  }

  return true;
};

export const isFilePathInfoValid = (knowledgeFormData: KnowledgeFormData): boolean => knowledgeFormData.filePath.trim().length > 0;

export const isDocumentInfoValid = (knowledgeFormData: KnowledgeFormData): boolean => {
  const commit = knowledgeFormData.knowledgeDocumentCommit.trim();
  if (!commit.length) {
    return false;
  }

  const documentName = knowledgeFormData.documentName.trim();
  if (!documentName.length) {
    return false;
  }

  const documentURL = knowledgeFormData.knowledgeDocumentRepositoryUrl.trim();
  if (!documentURL.length) {
    return false;
  }

  return true;
};

export const isSeedExamplesValid = (knowledgeFormData: KnowledgeFormData): boolean => {
  if (knowledgeFormData.seedExamples.length < 5) {
    return false;
  }
  return knowledgeFormData.seedExamples.every(
    (seedExample) =>
      seedExample.isContextValid === ValidatedOptions.success &&
      seedExample.questionAndAnswers.every(
        (questionAndAnswerPair) =>
          questionAndAnswerPair.isQuestionValid === ValidatedOptions.success && questionAndAnswerPair.isAnswerValid === ValidatedOptions.success
      )
  );
};
