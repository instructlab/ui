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

export const isSkillSeedExamplesValid = (skillFormData: SkillFormData): boolean => {
  if (skillFormData.seedExamples.length < 5) {
    return false;
  }
  return skillFormData.seedExamples.every(
    (seedExample) =>
      seedExample.questionAndAnswer.question.trim().length > 0 &&
      seedExample.questionAndAnswer.isQuestionValid !== ValidatedOptions.error &&
      seedExample.questionAndAnswer.answer.trim().length > 0 &&
      seedExample.questionAndAnswer.isAnswerValid !== ValidatedOptions.error
  );
};

export const isKnowledgeSeedExamplesValid = (knowledgeFormData: KnowledgeFormData): boolean => {
  if (knowledgeFormData.seedExamples.length < 5) {
    return false;
  }

  return knowledgeFormData.seedExamples.every((seedExample) => {
    return (
      seedExample.context.trim().length > 0 &&
      seedExample.isContextValid !== ValidatedOptions.error &&
      seedExample.questionAndAnswers.every(
        (questionAndAnswerPair) =>
          questionAndAnswerPair.question.trim().length > 0 &&
          questionAndAnswerPair.isQuestionValid !== ValidatedOptions.error &&
          questionAndAnswerPair.answer.trim().length > 0 &&
          questionAndAnswerPair.isAnswerValid !== ValidatedOptions.error
      )
    );
  });
};

export const getValidatedSkillSeedExamples = (formData: SkillFormData) =>
  formData.seedExamples.map((seedExample) => {
    const isQuestionValid = seedExample.questionAndAnswer.question.trim().length > 0;
    const isAnswerValid = seedExample.questionAndAnswer.answer.trim().length > 0;
    return {
      ...seedExample,
      questionAndAnswer: {
        ...seedExample.questionAndAnswer,
        isQuestionValid: isQuestionValid ? ValidatedOptions.default : ValidatedOptions.error,
        questionValidationError: isQuestionValid ? undefined : 'Required',
        isAnswerValid: isAnswerValid ? ValidatedOptions.default : ValidatedOptions.error,
        answerValidationError: isAnswerValid ? undefined : 'Required'
      }
    };
  });

export const getValidatedKnowledgeSeedExamples = (formData: KnowledgeFormData) =>
  formData.seedExamples.map((seedExample) => ({
    ...seedExample,
    questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswer) => {
      const isQuestionValid = questionAndAnswer.question.trim().length > 0;
      const isAnswerValid = questionAndAnswer.answer.trim().length > 0;

      return {
        ...questionAndAnswer,
        isQuestionValid: isQuestionValid ? ValidatedOptions.default : ValidatedOptions.error,
        questionValidationError: isQuestionValid ? undefined : 'Required',
        isAnswerValid: isAnswerValid ? ValidatedOptions.default : ValidatedOptions.error,
        answerValidationError: isAnswerValid ? undefined : 'Required'
      };
    })
  }));

export const isAttributionInformationValid = (contributionFormData: ContributionFormData): boolean => {
  const { titleWork, licenseWork, creators } = contributionFormData;
  return titleWork.trim().length > 0 && licenseWork.trim().length > 0 && creators.trim().length > 0;
};

export const isKnowledgeAttributionInformationValid = (knowledgeFormData: KnowledgeFormData): boolean =>
  knowledgeFormData.linkWork.trim().length > 0 && isAttributionInformationValid(knowledgeFormData);
