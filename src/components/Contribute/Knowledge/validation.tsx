import { ActionGroupAlertContent, KnowledgeFormData, SeedExample } from '.';

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

const hasDuplicateSeedExamples = (seedExamples: SeedExample[]): boolean => {
  // Just checking contexts for duplication.
  const contexts = new Set();

  seedExamples.forEach((seedExample) => {
    if (!contexts.has(seedExample.context)) {
      contexts.add(seedExample.context);
    } else {
      return true;
    }
  });

  return false;
};

export const validateFields = (
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>
): boolean => {
  // validate that data has been entered into all fields
  for (const [key, value] of Object.entries(knowledgeFormData)) {
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

  if (knowledgeFormData.email && !validateEmail(knowledgeFormData.email!)) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Email address issue!`,
      message: `Please enter a valid email address.`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  //   checking for seedExample duplication

  if (hasDuplicateSeedExamples(knowledgeFormData.seedExamples)) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Seed example issue!`,
      message: `There is duplicated context. Please provide unique contexts`,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: `Data entry success`,
    message: `All fields completed successfully`,
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};
