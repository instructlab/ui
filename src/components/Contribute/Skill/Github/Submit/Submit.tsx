import React from 'react';
import { ActionGroupAlertContent } from '..';
import { AttributionData, SkillFormData, SkillYamlData } from '@/types';
import { SkillSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { validateFields } from '../../validation';
import { Button } from '@patternfly/react-core';

interface Props {
  disableAction: boolean;
  skillFormData: SkillFormData;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
  githubUsername: string | undefined;
  resetForm: () => void;
}

// temporary location of these validation functions. Once the Skills form has been refactored then these can be moved out to the utils file.

const Submit: React.FC<Props> = ({ disableAction, skillFormData, setActionGroupAlertContent, githubUsername, resetForm }) => {
  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!validateFields(skillFormData, setActionGroupAlertContent)) return;

    console.log('skillFormData :' + skillFormData);
    // Strip leading slash and ensure trailing slash in the file path
    let sanitizedFilePath = skillFormData.filePath!.startsWith('/') ? skillFormData.filePath!.slice(1) : skillFormData.filePath;
    sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

    const skillYamlData: SkillYamlData = {
      created_by: githubUsername!,
      version: SkillSchemaVersion,
      task_description: skillFormData.documentOutline!,
      seed_examples: skillFormData.seedExamples.map((example) => ({
        context: example.context,
        question: example.question,
        answer: example.answer
      }))
    };

    const yamlString = dumpYaml(skillYamlData);

    const attributionData: AttributionData = {
      title_of_work: skillFormData.titleWork!,
      license_of_the_work: skillFormData.licenseWork!,
      creator_names: skillFormData.creators!,
      link_to_work: '',
      revision: ''
    };

    const waitForSubmissionAlert: ActionGroupAlertContent = {
      title: 'Skill contribution submission in progress.!',
      message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
      success: true,
      waitAlert: true,
      timeout: false
    };
    setActionGroupAlertContent(waitForSubmissionAlert);

    const name = skillFormData.name;
    const email = skillFormData.email;
    const submissionSummary = skillFormData.submissionSummary;
    const documentOutline = skillFormData.documentOutline;
    const response = await fetch('/api/github/pr/skill', {
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

    const result = await response.json();
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: 'Skill contribution submitted successfully!',
      message: `Thank you for your contribution!`,
      url: `${result.html_url}`,
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
