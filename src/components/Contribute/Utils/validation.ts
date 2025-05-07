import { KnowledgeFormData, KnowledgeSeedExample, SkillFormData, SkillSeedExample } from '@/types';
import { ValidatedOptions } from '@patternfly/react-core';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const hasDuplicateKnowledgeSeedExamples = (seedExamples: KnowledgeSeedExample[]): { duplicate: boolean; index: number } => {
  const contexts = new Set<string>();
  for (let index = 0; index < seedExamples.length; index++) {
    const seedExample = seedExamples[index];
    if (seedExample.context && !contexts.has(seedExample.context)) {
      contexts.add(seedExample.context);
    } else {
      return { duplicate: true, index: index };
    }
  }
  return { duplicate: false, index: -1 };
};

// Check if the question in Q and A pairs in a each seed example are unique
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

  const contextTokens = seedExample.context?.trim().split(/\s+/) ?? [];
  const totalLength = totalQnAPairsTokenCount + contextTokens.length;
  if (totalLength > 750) {
    return { success: false, currLength: totalLength };
  }
  return { success: true, currLength: totalLength };
};

const knowledgeOptionalKeys = ['titleWork', 'linkWork', 'revision', 'licenseWork', 'creators'];

export const validateKnowledgeFormFields = (
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): boolean => {
  // validate that data has been entered into all fields
  for (const [key, value] of Object.entries(knowledgeFormData)) {
    if (!value) {
      if (knowledgeOptionalKeys.includes(key)) {
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
  const { duplicate, index } = hasDuplicateKnowledgeSeedExamples(knowledgeFormData.seedExamples);
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
        title: `Seed example ${index + 1} has an issue!`,
        message: `Total size of the question-and-answer pairs and context should not exceed 750 words (current size ${length}). Please provide shorter question-and-answer pairs or context.`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
    }
  }

  return true;
};

const skillOptionalKeys = ['titleWork', 'licenseWork', 'creators'];

const hasDuplicateSkillSeedExamples = (seedExamples: SkillSeedExample[]): { duplicate: boolean; index: number } => {
  const question = new Set<string>();
  for (let index = 0; index < seedExamples.length; index++) {
    const seedExample = seedExamples[index];
    if (!question.has(seedExample.questionAndAnswer.question)) {
      question.add(seedExample.questionAndAnswer.question);
    } else {
      return { duplicate: true, index: index };
    }
  }
  return { duplicate: false, index: -1 };
};

export const validateSkillFormFields = (
  skillFormData: SkillFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): boolean => {
  // validate that data has been entered into all fields
  for (const [key, value] of Object.entries(skillFormData)) {
    if (!value) {
      if (skillOptionalKeys.includes(key)) {
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
  if (skillFormData.email && !validateEmail(skillFormData.email!)) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Email address issue!`,
      message: `Please enter a valid email address.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  if (skillFormData.seedExamples.length < 5) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Seed examples issue!`,
      message: `Please provide at least 5 seed examples.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  //  checking for seedExample duplication
  const { duplicate, index } = hasDuplicateSkillSeedExamples(skillFormData.seedExamples);
  if (duplicate) {
    skillFormData.seedExamples[index].questionAndAnswer.isQuestionValid = ValidatedOptions.error;
    skillFormData.seedExamples[index].questionAndAnswer.questionValidationError = 'This is duplicate question, please provide unique questions.';
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Seed example issue!`,
      message: `Seed example ${index + 1} question is duplicate. Please provide unique questions.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  return true;
};
