import { KnowledgeFormData, KnowledgeSeedExample } from '@/types';
import { ValidatedOptions } from '@patternfly/react-core';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const hasDuplicateSeedExamples = (seedExamples: KnowledgeSeedExample[]): { duplicate: boolean; index: number } => {
  const contexts = new Set<string>();
  for (let index = 0; index < seedExamples.length; index++) {
    const seedExample = seedExamples[index];
    if (!contexts.has(seedExample.context)) {
      contexts.add(seedExample.context);
    } else {
      return { duplicate: true, index: index };
    }
  }
  return { duplicate: false, index: -1 };
};

// Check if the question in Q&A pairs in a each seed example are unique
const hasDuplicateQuestionAndAnswerPairs = (seedExample: KnowledgeSeedExample): { duplicate: boolean; index: number } => {
  const questions = new Set<string>();
  for (let index = 0; index < seedExample.questionAndAnswers.length; index++) {
    const questionAndAnswerPair = seedExample.questionAndAnswers[index];
    const question = questionAndAnswerPair.question;
    if (!questions.has(question)) {
      questions.add(question);
    } else {
      return { duplicate: true, index: index };
    }
  }
  return { duplicate: false, index: -1 };
};

// Validate that the total length of all the question and answer pairs
// and context in a seed example is not more than 750 characters.
const validateQuestionAndAnswerPairs = (seedExample: KnowledgeSeedExample): { success: boolean; currLength: number } => {
  const totalQnAPairsTokenCount = seedExample.questionAndAnswers.reduce((acc, questionAndAnswerPair) => {
    const questionTokens = questionAndAnswerPair.question.trim().split(/\s+/);
    const answerTokens = questionAndAnswerPair.answer.trim().split(/\s+/);
    return acc + questionTokens.length + answerTokens.length;
  }, 0);

  const contextTokens = seedExample.context.trim().split(/\s+/);
  const totalLength = totalQnAPairsTokenCount + contextTokens.length;
  if (totalLength > 750) {
    return { success: false, currLength: totalLength };
  }
  return { success: true, currLength: totalLength };
};

const nativeOptionalKeys = ['titleWork', 'linkWork', 'revision', 'licenseWork', 'creators'];

export const validateFields = (
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>,
  isNativeMode: boolean
): boolean => {
  // validate that data has been entered into all fields
  for (const [key, value] of Object.entries(knowledgeFormData)) {
    if (!value) {
      if (isNativeMode && nativeOptionalKeys.includes(key)) {
        continue;
      } else {
        const actionGroupAlertContent: ActionGroupAlertContent = {
          title: `Please make sure you complete the ${key} field`,
          message: `Some fields are not filled out`,
          success: false
        };
        setActionGroupAlertContent(actionGroupAlertContent);
        return false;
      }
    }
  }

  //   Validate email only if email has been entered
  if (knowledgeFormData.email && !validateEmail(knowledgeFormData.email!)) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Email address issue!`,
      message: `Please enter a valid email address.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  if (knowledgeFormData.seedExamples.length < 5) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Seed examples issue!`,
      message: `Please provide at least 5 seed examples.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  //  checking for seedExample duplication
  const { duplicate, index } = hasDuplicateSeedExamples(knowledgeFormData.seedExamples);
  if (duplicate) {
    knowledgeFormData.seedExamples[index].isContextValid = ValidatedOptions.error;
    knowledgeFormData.seedExamples[index].validationError = 'This is duplicate context, please provide unique contexts.';
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Seed example issue!`,
      message: `Seed example ${index + 1} context is duplicate. Please provide unique contexts`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  // Check that each seed example has at least 3 question and answer pairs
  for (let index = 0; index < knowledgeFormData.seedExamples.length; index++) {
    if (knowledgeFormData.seedExamples[index].questionAndAnswers.length < 3) {
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Seed example ${index + 1} has an issue!`,
        message: `Please provide at least 3 question and answer pairs.`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
    }
  }

  // Check that each seed example has at least 3 question and answer pairs
  for (let index = 0; index < knowledgeFormData.seedExamples.length; index++) {
    const { duplicate, index: qnaIndex } = hasDuplicateQuestionAndAnswerPairs(knowledgeFormData.seedExamples[index]);
    if (duplicate) {
      knowledgeFormData.seedExamples[index].questionAndAnswers[qnaIndex].isQuestionValid = ValidatedOptions.error;
      knowledgeFormData.seedExamples[index].questionAndAnswers[qnaIndex].questionValidationError =
        'This is duplicate question, please provide unique questions.';
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Seed example ${index + 1} has an issue!`,
        message: `Question ${qnaIndex + 1} is a duplicate in the seed example. Please provide unique questions in each seed example.`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
    }
  }

  //  checking for question and answer pairs length
  for (let index = 0; index < knowledgeFormData.seedExamples.length; index++) {
    const { success, currLength: length } = validateQuestionAndAnswerPairs(knowledgeFormData.seedExamples[index]);
    if (!success) {
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Seed Example ${index + 1} has an issue!`,
        message: `Total size of the Q&A pairs and context should not exceed 750 words (current size ${length}). Please provide shorter Q&A pairs or context.`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
    }
  }

  if (knowledgeFormData.documentOutline && knowledgeFormData.documentOutline.length < 40) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Document outline issue!`,
      message: `Document outline should be at least 40 characters long.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  return true;
};

const optionalKeys = ['context', 'isContextValid', 'validationError', 'questionValidationError', 'answerValidationError'];

export const checkKnowledgeFormCompletion = (knowledgeFormData: object, isNativeMode?: boolean): boolean => {
  // Helper function to check if a value is non-empty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isNonEmpty = (value: any): boolean => {
    if (Array.isArray(value)) {
      return value.every((item) => isNonEmpty(item));
    }
    if (typeof value === 'object') {
      return checkObject(value);
    }
    return value !== undefined && value !== null && value !== '';
  };

  // Function to check if an object has all non-empty values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const checkObject = (obj: Record<string, any>): boolean => {
    return Object.keys(obj).every((key) => {
      // Skip validation for optional keys
      if (optionalKeys.includes(key)) {
        return true;
      }
      // Skip validation for keys that are optional only for native mode
      if (isNativeMode && nativeOptionalKeys.includes(key)) {
        return true;
      }
      const value = obj[key];
      if (typeof value === 'object' && !Array.isArray(value)) {
        return checkObject(value); // Recursively check nested objects
      } else {
        return isNonEmpty(value);
      }
    });
  };

  return checkObject(knowledgeFormData);
};
