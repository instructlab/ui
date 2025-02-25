import { ValidatedOptions } from '@patternfly/react-core';
import { KnowledgeSeedExample, QuestionAndAnswerPair } from '@/types';
import { devLog } from '@/utils/devlog';

export const validateQuestion = (question: string) => {
  const questionStr = question.trim();
  if (questionStr.length === 0) {
    return { msg: 'Question is required', status: ValidatedOptions.error };
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
    return { msg: 'Answer is required', status: ValidatedOptions.error };
  }
  const tokens = answerStr.split(/\s+/);
  if (tokens.length > 0 && tokens.length < 250) {
    return { msg: 'Valid input', status: ValidatedOptions.success };
  }
  return { msg: 'Answer must be less than 250 words. Current word count: ' + tokens.length, status: ValidatedOptions.error };
};

export const validateContext = (context: string) => {
  // Split the context into words based on spaces
  const contextStr = context.trim();
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

export const handleSeedExamplesContextInputChange = (
  seedExamples: KnowledgeSeedExample[],
  seedExampleIndex: number,
  contextValue: string,
  validate = false
): KnowledgeSeedExample[] => {
  const { msg, status } = validateContext(contextValue);
  const newSeed = seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
    index === seedExampleIndex
      ? {
          ...seedExample,
          context: contextValue,
          isContextValid: validate ? status : seedExample.isContextValid,
          validationError: validate ? msg : seedExample.validationError
        }
      : seedExample
  );
  return newSeed;
};

export const handleSeedExamplesContextBlur = (seedExamples: KnowledgeSeedExample[], seedExampleIndex: number): KnowledgeSeedExample[] =>
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

export const handleSeedExamplesQuestionInputChange = (
  seedExamples: KnowledgeSeedExample[],
  seedExampleIndex: number,
  questionAndAnswerIndex: number,
  questionValue: string
): KnowledgeSeedExample[] => {
  devLog(`Question Input Changed for Seed Example ${seedExampleIndex + 1}, Q&A Pair ${questionAndAnswerIndex + 1}: "${questionValue}"`);
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

export const handleSeedExamplesQuestionBlur = (
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
              devLog(`Question Validation for Seed Example ${seedExampleIndex + 1}, Q&A Pair ${questionAndAnswerIndex + 1}: ${msg} (${status})`);
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

export const handleSeedExamplesAnswerInputChange = (
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

export const handleSeedExamplesAnswerBlur = (
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

export const toggleSeedExamplesExpansion = (seedExamples: KnowledgeSeedExample[], index: number): KnowledgeSeedExample[] => {
  devLog(`toggleSeedExampleExpansion: Seed Example ${index + 1} expanded to ${!seedExamples[index].isExpanded}`);
  return seedExamples.map((seedExample, idx) => (idx === index ? { ...seedExample, isExpanded: !seedExample.isExpanded } : seedExample));
};

// Function to create a unique empty seed example
export const createEmptySeedExample = (): KnowledgeSeedExample => ({
  immutable: true,
  isExpanded: false,
  context: '',
  isContextValid: ValidatedOptions.default,
  validationError: '',
  questionAndAnswers: [
    {
      immutable: true,
      question: '',
      isQuestionValid: ValidatedOptions.default,
      questionValidationError: '',
      answer: '',
      isAnswerValid: ValidatedOptions.default,
      answerValidationError: ''
    },
    {
      immutable: true,
      question: '',
      isQuestionValid: ValidatedOptions.default,
      questionValidationError: '',
      answer: '',
      isAnswerValid: ValidatedOptions.default,
      answerValidationError: ''
    },
    {
      immutable: true,
      question: '',
      isQuestionValid: ValidatedOptions.default,
      questionValidationError: '',
      answer: '',
      isAnswerValid: ValidatedOptions.default,
      answerValidationError: ''
    }
  ]
});

export const yamlSeedExampleToFormSeedExample = (
  yamlSeedExamples: { context: string; questions_and_answers: { question: string; answer: string }[] }[]
): KnowledgeSeedExample[] => {
  const mappedSeedExamples = yamlSeedExamples.map((yamlSeedExample) => {
    const { msg: validationError, status: isContextValid } = validateContext(yamlSeedExample.context);
    return {
      immutable: true,
      isExpanded: false,
      context: yamlSeedExample.context,
      isContextValid,
      validationError,
      questionAndAnswers: yamlSeedExample.questions_and_answers.map((qa) => {
        const { msg: questionValidationError, status: isQuestionValid } = validateQuestion(qa.question);
        const { msg: answerValidationError, status: isAnswerValid } = validateAnswer(qa.answer);
        return {
          immutable: true,
          question: qa.question,
          answer: qa.answer,
          isQuestionValid,
          questionValidationError,
          isAnswerValid,
          answerValidationError
        };
      })
    };
  });

  devLog('Mapped Seed Examples from YAML:', mappedSeedExamples);
  return mappedSeedExamples;
};
