import { ValidatedOptions } from '@patternfly/react-core';
import { KnowledgeSeedExample, QuestionAndAnswerPair, SkillSeedExample } from '@/types';

export const MAX_CONTEXT_WORDS = 500;
export const MAX_SKILL_QUESTION_CHARS = 60;
export const MIN_SKILL_ANSWER_CHARS = 40;
export const MAX_CONTRIBUTION_Q_AND_A_WORDS = 250;

export const validateSkillQuestion = (question: string) => {
  const questionStr = question.trim();
  if (questionStr.length === 0) {
    return { msg: 'Required', status: ValidatedOptions.error };
  }
  if (questionStr.length <= MAX_SKILL_QUESTION_CHARS) {
    return { msg: 'Valid input', status: ValidatedOptions.success };
  }
  return { msg: `Question must be less than ${MAX_SKILL_QUESTION_CHARS} characters`, status: ValidatedOptions.error };
};

export const validateSkillAnswer = (answer: string) => {
  const answerStr = answer.trim();
  if (answerStr.length === 0) {
    return { msg: 'Required', status: ValidatedOptions.error };
  }
  if (answerStr.length >= MIN_SKILL_ANSWER_CHARS) {
    return { msg: 'Valid input', status: ValidatedOptions.success };
  }
  return { msg: `Answer must be more than ${MIN_SKILL_ANSWER_CHARS} characters`, status: ValidatedOptions.error };
};

export const validateContext = (context?: string) => {
  const contextStr = context?.trim() ?? '';
  if (contextStr.length === 0) {
    return { msg: 'Context is required', status: ValidatedOptions.error };
  }
  return { msg: 'Valid Input', status: ValidatedOptions.success };
};

export const handleSkillSeedExamplesContextInputChange = (
  seedExamples: SkillSeedExample[],
  seedExampleIndex: number,
  contextValue: string
): SkillSeedExample[] => {
  return seedExamples.map((seedExample: SkillSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          context: contextValue
        }
      : seedExample
  );
};

export const handleSkillSeedExamplesQuestionInputChange = (
  seedExamples: SkillSeedExample[],
  seedExampleIndex: number,
  questionValue: string
): SkillSeedExample[] =>
  seedExamples.map((seedExample: SkillSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswer: {
            ...seedExample.questionAndAnswer,
            question: questionValue
          }
        }
      : seedExample
  );

export const handleSkillSeedExamplesQuestionBlur = (seedExamples: SkillSeedExample[], seedExampleIndex: number): SkillSeedExample[] => {
  const { msg, status } = validateSkillQuestion(seedExamples[seedExampleIndex].questionAndAnswer.question);
  return seedExamples.map((seedExample: SkillSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswer: {
            ...seedExample.questionAndAnswer,
            isQuestionValid: status,
            questionValidationError: msg
          }
        }
      : seedExample
  );
};

export const handleSkillSeedExamplesAnswerInputChange = (
  seedExamples: SkillSeedExample[],
  seedExampleIndex: number,
  answerValue: string
): SkillSeedExample[] =>
  seedExamples.map((seedExample: SkillSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswer: {
            ...seedExample.questionAndAnswer,
            answer: answerValue
          }
        }
      : seedExample
  );

export const handleSkillSeedExamplesAnswerBlur = (seedExamples: SkillSeedExample[], seedExampleIndex: number): SkillSeedExample[] => {
  const { msg, status } = validateSkillAnswer(seedExamples[seedExampleIndex].questionAndAnswer.answer);
  return seedExamples.map((seedExample: SkillSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswer: {
            ...seedExample.questionAndAnswer,
            isAnswerValid: status,
            answerValidationError: msg
          }
        }
      : seedExample
  );
};

export const toggleSkillSeedExamplesExpansion = (seedExamples: SkillSeedExample[], index: number): SkillSeedExample[] =>
  seedExamples.map((seedExample, idx) => (idx === index ? { ...seedExample, isExpanded: !seedExample.isExpanded } : seedExample));

export const handleKnowledgeSeedExamplesQuestionBlur = (
  seedExamples: KnowledgeSeedExample[],
  seedExampleIndex: number,
  questionAndAnswerIndex: number
): KnowledgeSeedExample[] =>
  seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) => {
            if (qaIndex === questionAndAnswerIndex) {
              const isValid = questionAndAnswerPair.question.trim().length > 0;
              return {
                ...questionAndAnswerPair,
                isQuestionValid: isValid ? ValidatedOptions.default : ValidatedOptions.error,
                questionValidationError: isValid ? undefined : 'Required'
              };
            }
            return questionAndAnswerPair;
          })
        }
      : seedExample
  );

export const handleKnowledgeSeedExamplesAnswerBlur = (
  seedExamples: KnowledgeSeedExample[],
  seedExampleIndex: number,
  questionAndAnswerIndex: number
): KnowledgeSeedExample[] =>
  seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) => {
            if (qaIndex === questionAndAnswerIndex) {
              const isValid = questionAndAnswerPair.answer.trim().length > 0;
              return {
                ...questionAndAnswerPair,
                isAnswerValid: isValid ? ValidatedOptions.default : ValidatedOptions.error,
                answerValidationError: isValid ? undefined : 'Required'
              };
            }
            return questionAndAnswerPair;
          })
        }
      : seedExample
  );

const EmptyQuestionAndAnswer: QuestionAndAnswerPair = {
  immutable: true,
  question: '',
  isQuestionValid: ValidatedOptions.default,
  questionValidationError: '',
  answer: '',
  isAnswerValid: ValidatedOptions.default,
  answerValidationError: ''
};

// Functions to create a unique empty seed example
export const createEmptySkillSeedExample = (): SkillSeedExample => ({
  immutable: true,
  isExpanded: false,
  context: '',
  isContextValid: ValidatedOptions.default,
  validationError: '',
  questionAndAnswer: { ...EmptyQuestionAndAnswer }
});

export const createDefaultSkillSeedExamples = (): SkillSeedExample[] => [
  createEmptySkillSeedExample(),
  createEmptySkillSeedExample(),
  createEmptySkillSeedExample(),
  createEmptySkillSeedExample(),
  createEmptySkillSeedExample()
];

export const createEmptyKnowledgeSeedExample = (immutable = true): KnowledgeSeedExample => ({
  immutable,
  isExpanded: false,
  context: '',
  isContextValid: ValidatedOptions.default,
  validationError: '',
  questionAndAnswers: [{ ...EmptyQuestionAndAnswer }, { ...EmptyQuestionAndAnswer }, { ...EmptyQuestionAndAnswer }]
});

export const createDefaultKnowledgeSeedExamples = (): KnowledgeSeedExample[] => [
  { ...createEmptyKnowledgeSeedExample(), isExpanded: true },
  createEmptyKnowledgeSeedExample(),
  createEmptyKnowledgeSeedExample(),
  createEmptyKnowledgeSeedExample(),
  createEmptyKnowledgeSeedExample()
];
