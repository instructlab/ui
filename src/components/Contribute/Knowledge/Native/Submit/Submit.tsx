// src/components/contribute/native/Knowledge/Submit/Submit.tsx
import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ActionGroupAlertContent, KnowledgeFormData } from '..';
import { AttributionData, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { validateFields } from '@/components/Contribute/Knowledge/validation';

interface Props {
  disableAction: boolean;
  knowledgeFormData: KnowledgeFormData;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
  email: string;
  resetForm: () => void;
}

const Submit: React.FC<Props> = ({ disableAction, knowledgeFormData, setActionGroupAlertContent, email, resetForm }) => {
  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
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
        content: yamlString,
        attribution: attributionData,
        name,
        email,
        submissionSummary,
        documentOutline,
        filePath: sanitizedFilePath
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
      title: 'Knowledge contribution submitted successfully!',
      message: `Thank you for your contribution!`,
      url: '/dashboard/',
      success: true
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    resetForm();
  };
  return (
    <Button variant="primary" type="submit" isDisabled={disableAction} onClick={handleSubmit}>
      Submit
    </Button>
  );
};

export default Submit;
