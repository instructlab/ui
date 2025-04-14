import { ValidatedOptions } from '@patternfly/react-core';
import { QuestionAndAnswerPair, KnowledgeSeedExample, SkillSeedExample } from '@/types';
import { devLog } from '@/utils/devlog';

export const validateQuestion = (question: string) => {
  const questionStr = question.trim();
  if (questionStr.length === 0) {
    return { msg: 'Required', status: ValidatedOptions.error };
  }
  const tokens = questionStr.split(/\s+/);
  if (tokens.length > 0 && tokens.length < 250) {
    return { msg: 'Valid input', status: ValidatedOptions.success };
  }
  return { msg: 'Question must be less than 250 words. Current word count: ' + tokens.length, status: ValidatedOptions.error };
};

export const validateAnswer = (answer: string) => {
  const answerStr = answer.trim();
  if (answerStr.length === 0) {
    return { msg: 'Required', status: ValidatedOptions.error };
  }
  const tokens = answerStr.split(/\s+/);
  if (tokens.length > 0 && tokens.length < 250) {
    return { msg: 'Valid input', status: ValidatedOptions.success };
  }
  return { msg: 'Answer must be less than 250 words. Current word count: ' + tokens.length, status: ValidatedOptions.error };
};

export const validateContext = (context?: string) => {
  // Split the context into words based on spaces
  const contextStr = context?.trim() ?? '';
  if (contextStr.length === 0) {
    return { msg: 'Context is required', status: ValidatedOptions.error };
  }
  const tokens = contextStr.split(/\s+/);
  if (tokens.length > 0 && tokens.length <= 500) {
    return { msg: 'Valid Input', status: ValidatedOptions.success };
  }
  const errorMsg = 'Context must be less than 500 words. Current word count: ' + tokens.length;
  return { msg: errorMsg, status: ValidatedOptions.error };
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
  const { msg, status } = validateQuestion(seedExamples[seedExampleIndex].questionAndAnswer.question);
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
  const { msg, status } = validateAnswer(seedExamples[seedExampleIndex].questionAndAnswer.answer);
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

export const handleKnowledgeSeedExamplesContextInputChange = (
  seedExamples: KnowledgeSeedExample[],
  seedExampleIndex: number,
  contextValue: string,
  validate = false
): KnowledgeSeedExample[] => {
  const { msg, status } = validateContext(contextValue);
  return seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          context: contextValue,
          ...(validate
            ? {
                isContextValid: status,
                validationError: msg
              }
            : {})
        }
      : seedExample
  );
};

export const handleKnowledgeSeedExamplesContextBlur = (seedExamples: KnowledgeSeedExample[], seedExampleIndex: number): KnowledgeSeedExample[] =>
  seedExamples.map((seedExample: KnowledgeSeedExample, index: number) => {
    if (index === seedExampleIndex) {
      const { msg, status } = validateContext(seedExample.context);
      devLog(`Context Validation for Seed Example ${seedExampleIndex + 1}: ${msg} (${status})`);
      return {
        ...seedExample,
        isContextValid: status,
        validationError: msg
      };
    }
    return seedExample;
  });

export const handleKnowledgeSeedExamplesQuestionInputChange = (
  seedExamples: KnowledgeSeedExample[],
  seedExampleIndex: number,
  questionAndAnswerIndex: number,
  questionValue: string
): KnowledgeSeedExample[] => {
  devLog(`Question Input Changed for Seed Example ${seedExampleIndex + 1}, Q and A Pair ${questionAndAnswerIndex + 1}: "${questionValue}"`);
  return seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) =>
            qaIndex === questionAndAnswerIndex
              ? {
                  ...questionAndAnswerPair,
                  question: questionValue
                }
              : questionAndAnswerPair
          )
        }
      : seedExample
  );
};

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
              const { msg, status } = validateQuestion(questionAndAnswerPair.question);
              devLog(`Question Validation for Seed Example ${seedExampleIndex + 1}, Q and A Pair ${questionAndAnswerIndex + 1}: ${msg} (${status})`);
              return {
                ...questionAndAnswerPair,
                isQuestionValid: status,
                questionValidationError: msg
              };
            }
            return questionAndAnswerPair;
          })
        }
      : seedExample
  );

export const handleKnowledgeSeedExamplesAnswerInputChange = (
  seedExamples: KnowledgeSeedExample[],
  seedExampleIndex: number,
  questionAndAnswerIndex: number,
  answerValue: string
): KnowledgeSeedExample[] =>
  seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) =>
            qaIndex === questionAndAnswerIndex
              ? {
                  ...questionAndAnswerPair,
                  answer: answerValue
                }
              : questionAndAnswerPair
          )
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
              const { msg, status } = validateAnswer(questionAndAnswerPair.answer);
              return {
                ...questionAndAnswerPair,
                isAnswerValid: status,
                answerValidationError: msg
              };
            }
            return questionAndAnswerPair;
          })
        }
      : seedExample
  );

export const toggleKnowledgeSeedExamplesExpansion = (seedExamples: KnowledgeSeedExample[], index: number): KnowledgeSeedExample[] =>
  seedExamples.map((seedExample, idx) => (idx === index ? { ...seedExample, isExpanded: !seedExample.isExpanded } : seedExample));

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

export const createEmptyKnowledgeSeedExample = (): KnowledgeSeedExample => ({
  immutable: true,
  isExpanded: false,
  context: '',
  isContextValid: ValidatedOptions.default,
  validationError: '',
  questionAndAnswers: [{ ...EmptyQuestionAndAnswer }, { ...EmptyQuestionAndAnswer }, { ...EmptyQuestionAndAnswer }]
});

export const createDefaultKnowledgeSeedExamples = (): KnowledgeSeedExample[] => [
  createEmptyKnowledgeSeedExample(),
  createEmptyKnowledgeSeedExample(),
  createEmptyKnowledgeSeedExample(),
  createEmptyKnowledgeSeedExample(),
  createEmptyKnowledgeSeedExample()
];
