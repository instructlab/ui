import { ValidatedOptions } from '@patternfly/react-core';
import { ContributionFormData, KnowledgeFormData, SkillFormData } from '@/types';

export const MAX_SUMMARY_CHARS = 256;

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

export const isEmailValid = (email: string): boolean => {
  return !!email && emailRegex.test(email);
};

export const isAuthInfoValid = (knowledgeFormData: ContributionFormData): boolean =>
  isEmailValid(knowledgeFormData.email) && !!knowledgeFormData.name;

export const isSubmissionSummaryValid = (formData: ContributionFormData): boolean =>
  formData.submissionSummary.trim().length > 0 && formData.submissionSummary.trim().length <= MAX_SUMMARY_CHARS;

export const isDetailsValid = (formData: ContributionFormData): boolean =>
  isAuthInfoValid(formData) && isSubmissionSummaryValid(formData) && isFilePathInfoValid(formData);

export const isFilePathInfoValid = (knowledgeFormData: ContributionFormData): boolean => knowledgeFormData.filePath.trim().length > 0;

export const isDocumentInfoValid = (knowledgeFormData: KnowledgeFormData): boolean => {
  if (
    knowledgeFormData.uploadedFiles.length === 0 &&
    knowledgeFormData.filesToUpload.length === 0 &&
    knowledgeFormData.knowledgeDocumentCommit.length === 0
  ) {
    return false;
  }
  return true;
};

export const isSkillSeedExamplesValid = (skillFormData: SkillFormData): boolean => {
  if (skillFormData.seedExamples.length < 5) {
    return false;
  }
  return skillFormData.seedExamples.every(
    (seedExample) =>
      seedExample.questionAndAnswer.isQuestionValid === ValidatedOptions.success &&
      seedExample.questionAndAnswer.isAnswerValid === ValidatedOptions.success
  );
};

export const isKnowledgeSeedExamplesValid = (knowledgeFormData: KnowledgeFormData): boolean => {
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

export const isAttributionInformationValid = (contributionFormData: ContributionFormData): boolean => {
  const { titleWork, licenseWork, creators } = contributionFormData;
  return titleWork.trim().length > 0 && licenseWork.trim().length > 0 && creators.trim().length > 0;
};

export const isKnowledgeAttributionInformationValid = (knowledgeFormData: KnowledgeFormData): boolean =>
  knowledgeFormData.linkWork.trim().length > 0 && isAttributionInformationValid(knowledgeFormData);
