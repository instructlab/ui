import { SkillFormData, SkillSeedExample } from '@/types';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { ActionGroupAlertContent } from './Github';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const hasDuplicateSeedExamples = (seedExamples: SkillSeedExample[]): { duplicate: boolean; index: number } => {
  const question = new Set<string>();
  for (let index = 0; index < seedExamples.length; index++) {
    const seedExample = seedExamples[index];
    if (!question.has(seedExample.question)) {
      question.add(seedExample.question);
    } else {
      return { duplicate: true, index: index };
    }
  }
  return { duplicate: false, index: -1 };
};

export const validateFields = (
  skillFormData: SkillFormData,
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>
): boolean => {
  // validate that data has been entered into all fields
  for (const [key, value] of Object.entries(skillFormData)) {
    if (!value) {
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Please make sure you complete the ${key} field`,
        message: `Some fields are not filled out`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
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
  const { duplicate, index } = hasDuplicateSeedExamples(skillFormData.seedExamples);
  if (duplicate) {
    skillFormData.seedExamples[index].isQuestionValid = ValidatedOptions.error;
    skillFormData.seedExamples[index].questionValidationError = 'This is duplicate question, please provide unique questions.';
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Seed example issue!`,
      message: `Seed example ${index + 1} question is duplicate. Please provide unique questions.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  if (skillFormData.documentOutline && skillFormData.documentOutline.length < 40) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Task description issue!`,
      message: `Task description should be at least 40 characters long.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }
  return true;
};

const optionalKeys = ['context', 'isContextValid', 'validationError', 'questionValidationError', 'answerValidationError'];

export const checkSkillFormCompletion = (skillFormData: object): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isObject = (value: Record<string, any>): boolean => {
    return value && typeof value === 'object' && !Array.isArray(value);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasValidValues = (obj: any): boolean => {
    if (Array.isArray(obj)) {
      return obj.every((item) => hasValidValues(item));
    }

    if (isObject(obj)) {
      return Object.keys(obj).every((key) => {
        const value = obj[key];

        // Skip validation for optional keys
        if (optionalKeys.includes(key)) {
          return true;
        }

        // For objects or arrays, recurse
        if (isObject(value) || Array.isArray(value)) {
          return hasValidValues(value);
        }

        // Check if the value is not null, undefined, or an empty string
        return value !== undefined && value !== null && value !== '';
      });
    }

    // In case the obj is not an object or array, it should return true (not expected)
    return true;
  };
  return hasValidValues(skillFormData);
};
