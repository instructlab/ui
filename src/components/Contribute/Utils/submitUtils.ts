import { KnowledgeEditFormData, KnowledgeFormData, KnowledgeYamlData, SkillEditFormData, SkillFormData, SkillYamlData } from '@/types';
import { KnowledgeSchemaVersion, SkillSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { validateKnowledgeFormFields, validateSkillFormFields } from '@/components/Contribute/Utils/validation';

const domainFromFilePath = (filePath: string): string => {
  if (!filePath) {
    return '';
  }
  const pathElements = filePath.split('/').filter((element) => !!element);
  return pathElements[pathElements.length - 1] || '';
};

export const submitKnowledgeData = async (
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void,
  knowledgeEditFormData?: KnowledgeEditFormData
): Promise<boolean> => {
  if (!validateKnowledgeFormFields(knowledgeFormData, setActionGroupAlertContent)) {
    return false;
  }

  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = knowledgeFormData.filePath?.startsWith('/') ? knowledgeFormData.filePath!.slice(1) : knowledgeFormData.filePath;
  sanitizedFilePath = sanitizedFilePath?.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const knowledgeYamlData: KnowledgeYamlData = {
    created_by: knowledgeFormData.email,
    version: KnowledgeSchemaVersion,
    domain: domainFromFilePath(knowledgeFormData.filePath),
    document_outline: knowledgeFormData.submissionSummary,
    seed_examples: knowledgeFormData.seedExamples.map((example) => ({
      context: example.context,
      questions_and_answers: example.questionAndAnswers.map((questionAndAnswer) => ({
        question: questionAndAnswer.question,
        answer: questionAndAnswer.answer
      }))
    })),
    document: {
      repo: knowledgeFormData.knowledgeDocumentRepositoryUrl,
      commit: knowledgeFormData.knowledgeDocumentCommit,
      patterns: knowledgeFormData.documentName?.split(',').map((pattern) => pattern.trim())
    }
  };

  const yamlString = dumpYaml(knowledgeYamlData);

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Knowledge contribution submission in progress!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { branchName, name, email, submissionSummary } = knowledgeFormData;

  const response = await fetch('/api/pr/knowledge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: knowledgeEditFormData ? 'update' : 'submit',
      branchName: branchName,
      content: yamlString,
      name,
      email,
      submissionSummary,
      documentOutline: submissionSummary,
      filePath: sanitizedFilePath,
      oldFilesPath: knowledgeEditFormData ? knowledgeEditFormData.oldFilesPath : sanitizedFilePath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Knowledge contribution submitted successfully!',
    message: `Thank you for your contribution!`,
    url: '/dashboard/',
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};

export const submitSkillData = async (
  skillFormData: SkillFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void,
  skillEditFormData?: SkillEditFormData
): Promise<boolean> => {
  if (!validateSkillFormFields(skillFormData, setActionGroupAlertContent)) {
    return false;
  }

  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = skillFormData.filePath!.startsWith('/') ? skillFormData.filePath!.slice(1) : skillFormData.filePath;
  sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const skillYamlData: SkillYamlData = {
    created_by: skillFormData.name,
    version: SkillSchemaVersion,
    task_description: skillFormData.submissionSummary,
    seed_examples: skillFormData.seedExamples.map((example) => ({
      context: example.context,
      question: example.questionAndAnswer.question,
      answer: example.questionAndAnswer.answer
    }))
  };

  const yamlString = dumpYaml(skillYamlData);

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Skill contribution submission in progress!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { branchName, name, email, submissionSummary } = skillFormData;

  const response = await fetch('/api/pr/skill/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: skillEditFormData ? 'update' : 'submit',
      branchName: branchName,
      content: yamlString,
      name,
      email,
      submissionSummary,
      filePath: sanitizedFilePath,
      oldFilesPath: skillEditFormData ? skillEditFormData.oldFilesPath : sanitizedFilePath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Skill contribution submitted successfully!',
    message: `Thank you for your contribution!`,
    url: '/dashboard',
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};
