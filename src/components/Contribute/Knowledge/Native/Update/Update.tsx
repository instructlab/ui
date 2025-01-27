// src/components/contribute/Knowledge/Native/Update/Update.tsx
import React from 'react';
import { ActionGroupAlertContent } from '..';
import { AttributionData, KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { validateFields } from '@/components/Contribute/Knowledge/validation';
import { Button } from '@patternfly/react-core';
import { useRouter } from 'next/navigation';

interface Props {
  disableAction: boolean;
  knowledgeFormData: KnowledgeFormData;
  oldFilesPath: string;
  branchName: string;
  email: string;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
}

const Update: React.FC<Props> = ({ disableAction, knowledgeFormData, oldFilesPath, branchName, email, setActionGroupAlertContent }) => {
  const router = useRouter();

  const handleUpdate = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!validateFields(knowledgeFormData, setActionGroupAlertContent)) return;

    // Strip leading slash and ensure trailing slash in the file path
    let sanitizedFilePath = knowledgeFormData.filePath!.startsWith('/') ? knowledgeFormData.filePath!.slice(1) : knowledgeFormData.filePath;
    sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

    const knowledgeYamlData: KnowledgeYamlData = {
      created_by: email,
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

    const attributionData: AttributionData = {
      title_of_work: knowledgeFormData.titleWork!,
      link_to_work: knowledgeFormData.linkWork!,
      revision: knowledgeFormData.revision!,
      license_of_the_work: knowledgeFormData.licenseWork!,
      creator_names: knowledgeFormData.creators!
    };

    const waitForSubmissionAlert: ActionGroupAlertContent = {
      title: 'Knowledge contribution submission in progress!',
      message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
      success: true,
      waitAlert: true,
      timeout: false
    };
    setActionGroupAlertContent(waitForSubmissionAlert);

    const name = knowledgeFormData.name;
    const submissionSummary = knowledgeFormData.submissionSummary;
    const documentOutline = knowledgeFormData.documentOutline;
    const response = await fetch('/api/native/pr/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update',
        branchName: branchName,
        content: yamlString,
        attribution: attributionData,
        name,
        email,
        submissionSummary,
        documentOutline,
        filePath: sanitizedFilePath,
        oldFilesPath: oldFilesPath
      })
    });

    if (!response.ok) {
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Failed data submission`,
        message: response.statusText,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return;
    }

    await response.json();
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: 'Knowledge contribution updated successfully!',
      message: `Thank you for your contribution!`,
      url: '/dashboard/',
      success: true
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    router.push('/dashboard');
  };
  return (
    <Button variant="primary" type="submit" isDisabled={disableAction} onClick={handleUpdate}>
      Update
    </Button>
  );
};

export default Update;
