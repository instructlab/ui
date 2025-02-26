import { ValidatedOptions } from '@patternfly/react-core';
import { ContributionFormData, KnowledgeFormData, SkillFormData } from '@/types';

const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

export const isEmailValid = (email: string): boolean => {
  return !!email && emailRegex.test(email);
};

export const isAuthInfoValid = (knowledgeFormData: ContributionFormData): boolean =>
  isEmailValid(knowledgeFormData.email) && !!knowledgeFormData.name;

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

export const isSkillInfoValid = (knowledgeFormData: SkillFormData): boolean => {
  const description = knowledgeFormData.submissionSummary.trim();
  if (!description.length) {
    return false;
  }

  const outline = knowledgeFormData.documentOutline.trim();
  if (outline.length < 40) {
    return false;
  }

  return true;
};

export const isFilePathInfoValid = (knowledgeFormData: ContributionFormData): boolean => knowledgeFormData.filePath.trim().length > 0;

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
  const title = contributionFormData.titleWork.trim();
  if (!title.length) {
    return false;
  }

  const license = contributionFormData.licenseWork.trim();
  if (!license.length) {
    return false;
  }

  const creators = contributionFormData.creators.trim();
  if (!creators.length) {
    return false;
  }

  return true;
};

export const isKnowledgeAttributionInformationValid = (knowledgeFormData: KnowledgeFormData): boolean => {
  const link = knowledgeFormData.linkWork.trim();
  if (!link.length) {
    return false;
  }

  const revision = knowledgeFormData.revision.trim();
  if (!revision.length) {
    return false;
  }
  return isAttributionInformationValid(knowledgeFormData);
};
