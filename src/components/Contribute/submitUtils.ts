import { KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

export const submitNativeKnowledgeData = async (
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = knowledgeFormData.filePath!.startsWith('/') ? knowledgeFormData.filePath!.slice(1) : knowledgeFormData.filePath;
  sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const knowledgeYamlData: KnowledgeYamlData = {
    created_by: knowledgeFormData.email,
    version: KnowledgeSchemaVersion,
    domain: knowledgeFormData.domain!,
    document_outline: knowledgeFormData.documentOutline!,
    seed_examples: knowledgeFormData.seedExamples.map((example) => ({
      context: example.context,
      questions_and_answers: example.questionAndAnswers.map((questionAndAnswer) => ({
        question: questionAndAnswer.question,
        answer: questionAndAnswer.answer
      }))
    })),
    document: {
      repo: knowledgeFormData.knowledgeDocumentRepositoryUrl!,
      commit: knowledgeFormData.knowledgeDocumentCommit!,
      patterns: knowledgeFormData.documentName!.split(',').map((pattern) => pattern.trim())
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

  const { name, submissionSummary, documentOutline, email } = knowledgeFormData;

  const response = await fetch('/api/native/pr/knowledge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'submit',
      branch: '',
      content: yamlString,
      name,
      email,
      submissionSummary,
      documentOutline,
      filePath: sanitizedFilePath,
      oldFilesPath: sanitizedFilePath
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
