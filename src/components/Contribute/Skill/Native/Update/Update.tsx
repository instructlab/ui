import React from 'react';
import { ActionGroupAlertContent } from '..';
import { SkillFormData, SkillYamlData } from '@/types';
import { SkillSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { validateFields } from '@/components/Contribute/Skill/validation';
import { Button } from '@patternfly/react-core';
import { useRouter } from 'next/navigation';

interface Props {
  disableAction: boolean;
  skillFormData: SkillFormData;
  oldFilesPath: string;
  branchName: string;
  email: string;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
}

const Update: React.FC<Props> = ({ disableAction, skillFormData, oldFilesPath, branchName, email, setActionGroupAlertContent }) => {
  const router = useRouter();

  const handleUpdate = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!validateFields(skillFormData, setActionGroupAlertContent, true)) return;

    // Strip leading slash and ensure trailing slash in the file path
    let sanitizedFilePath = skillFormData.filePath!.startsWith('/') ? skillFormData.filePath!.slice(1) : skillFormData.filePath;
    sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

    const skillYamlData: SkillYamlData = {
      created_by: email,
      version: SkillSchemaVersion,
      task_description: skillFormData.documentOutline!,
      seed_examples: skillFormData.seedExamples.map((example) => ({
        context: example.context,
        question: example.question,
        answer: example.answer
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

    const name = skillFormData.name;
    const submissionSummary = skillFormData.submissionSummary;
    const documentOutline = skillFormData.documentOutline;
    const response = await fetch('/api/native/pr/skill/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update',
        branchName: branchName,
        content: yamlString,
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
      title: 'Skill contribution updated successfully!',
      message: `Thank you for your contribution!`,
      url: '/dashboard',
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
