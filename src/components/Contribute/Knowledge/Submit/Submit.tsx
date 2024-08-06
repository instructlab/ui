import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ActionGroupAlertContent, KnowledgeFormData, SeedExample } from '..';
import { AttributionData, KnowledgeYamlData, SchemaVersion } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';

interface Props {
  knowledgeFormData: KnowledgeFormData;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
  githubUsername: string | undefined;
  resetForm: () => undefined;
}

// temporary location of these validation functions. Once the Skills form has been refactored then these can be moved out to the utils file.
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
};

export const hasDuplicateSeedExamples = (seedExamples: SeedExample[]): boolean => {
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
    if (value === undefined) {
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Please make sure you complete the ${key} field`,
        message: `Some fields are not filled out`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
    }
  }

  //   Validate email

  if (!validateEmail(knowledgeFormData.email!)) {
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

const Submit: React.FC<Props> = ({ knowledgeFormData, setActionGroupAlertContent, githubUsername, resetForm }) => {
  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!validateFields(knowledgeFormData, setActionGroupAlertContent)) return;

    // Strip leading slash and ensure trailing slash in the file path
    let sanitizedFilePath = knowledgeFormData.filePath!.startsWith('/') ? knowledgeFormData.filePath!.slice(1) : knowledgeFormData.filePath;
    sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

    const knowledgeYamlData: KnowledgeYamlData = {
      created_by: githubUsername!,
      version: SchemaVersion,
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

    const name = knowledgeFormData.name;
    const email = knowledgeFormData.email;
    const submissionSummary = knowledgeFormData.submissionSummary;
    const response = await fetch('/api/pr/knowledge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: yamlString, attribution: attributionData, name, email, submissionSummary, filePath: sanitizedFilePath })
    });

    if (!response.ok) {
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Failed data submission`,
        message: response.statusText,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
    }

    const result = await response.json();
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: 'Knowledge contribution submitted successfully!',
      message: `A new pull request has been created for your knowledge submission ${result.html_url}`,
      success: true
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    resetForm();
  };
  return (
    <Button variant="primary" type="submit" onClick={handleSubmit}>
      Submit Knowledge
    </Button>
  );
};

export default Submit;
