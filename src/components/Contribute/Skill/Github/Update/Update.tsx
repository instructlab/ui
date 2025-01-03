import React from 'react';
import { ActionGroupAlertContent } from '..';
import { AttributionData, SkillYamlData, PullRequestFile, SkillFormData } from '@/types';
import { SkillSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { validateFields } from '../../validation';
import { amendCommit, getGitHubUsername, updatePullRequest } from '@/utils/github';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@patternfly/react-core';

const SKILLS_DIR = 'compositional_skills/';
interface Props {
  disableAction: boolean;
  skillFormData: SkillFormData;
  pullRequestNumber: number;
  yamlFile: PullRequestFile;
  attributionFile: PullRequestFile;
  branchName: string;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
}

const Update: React.FC<Props> = ({
  disableAction,
  skillFormData,
  pullRequestNumber,
  yamlFile,
  attributionFile,
  branchName,
  setActionGroupAlertContent
}) => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleUpdate = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (!validateFields(skillFormData, setActionGroupAlertContent)) return;
    if (session?.accessToken) {
      try {
        console.log(`Updating PR with number: ${pullRequestNumber}`);
        await updatePullRequest(session.accessToken, pullRequestNumber, {
          title: skillFormData.submissionSummary,
          body: skillFormData.documentOutline
        });

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        };
        const githubUsername = await getGitHubUsername(headers);
        console.log(`GitHub username: ${githubUsername}`);

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
        console.log('Updated YAML content:', yamlString);

        const attributionData: AttributionData = {
          title_of_work: skillFormData.titleWork!,
          license_of_the_work: skillFormData.licenseWork!,
          creator_names: skillFormData.creators!,
          link_to_work: '',
          revision: ''
        };
        const attributionContent = `Title of work: ${attributionData.title_of_work}
License of the work: ${attributionData.license_of_the_work}
Creator names: ${attributionData.creator_names}
`;

        console.log('Updated Attribution content:', attributionData);

        const commitMessage = `Amend commit with updated content\n\nSigned-off-by: ${skillFormData.name} <${skillFormData.email}>`;

        // Ensure proper file paths for the edit
        const finalYamlPath = SKILLS_DIR + skillFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + yamlFile.filename.split('/').pop();
        const finalAttributionPath =
          SKILLS_DIR + skillFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + attributionFile.filename.split('/').pop();

        const origFilePath = yamlFile.filename.split('/').slice(0, -1).join('/');
        const oldFilePath = {
          yaml: origFilePath.replace(/^\//, '').replace(/\/?$/, '/') + yamlFile.filename.split('/').pop(),
          attribution: origFilePath.replace(/^\//, '').replace(/\/?$/, '/') + attributionFile.filename.split('/').pop()
        };

        const newFilePath = {
          yaml: finalYamlPath,
          attribution: finalAttributionPath
        };

        const res = await fetch('/api/envConfig');
        const envConfig = await res.json();

        const waitForSubmissionAlert: ActionGroupAlertContent = {
          title: 'Skill contribution update is in progress.!',
          message: `Once the update is successful, it will provide the link to the updated Pull Request.`,
          success: true,
          waitAlert: true,
          timeout: false
        };
        setActionGroupAlertContent(waitForSubmissionAlert);

        const amendedCommitResponse = await amendCommit(
          session.accessToken,
          githubUsername,
          envConfig.UPSTREAM_REPO_NAME,
          oldFilePath,
          newFilePath,
          yamlString,
          attributionContent,
          branchName,
          commitMessage
        );
        console.log('Amended commit response:', amendedCommitResponse);

        const prLink = `https://github.com/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/pull/${pullRequestNumber}`;
        const actionGroupAlertContent: ActionGroupAlertContent = {
          title: 'Skill contribution updated successfully!',
          message: `Thank you for your contribution!`,
          url: `${prLink}`,
          success: true
        };
        setActionGroupAlertContent(actionGroupAlertContent);
        // Skill is updated, wait for a bit and let's go back to dashboard.
        await new Promise((r) => setTimeout(r, 4000));
        router.push('/dashboard');
      } catch (error) {
        console.error('Error updating PR:', error);
        const actionGroupAlertContent: ActionGroupAlertContent = {
          title: `Failed to update PR with number: ${pullRequestNumber}`,
          message: `PR update failed because of ${error}`,
          success: false
        };
        setActionGroupAlertContent(actionGroupAlertContent);
      }
    }
  };
  return (
    <Button variant="primary" type="submit" isDisabled={disableAction} onClick={handleUpdate}>
      Update
    </Button>
  );
};

export default Update;
