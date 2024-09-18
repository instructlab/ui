import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ActionGroupAlertContent, KnowledgeFormData } from '..';
import { AttributionData, KnowledgeYamlData, PullRequestFile } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { validateFields } from '../validation';
import { amendCommit, getGitHubUsername, updatePullRequest } from '@/utils/github';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const KNOWLEDGE_DIR = 'knowledge/';
interface Props {
  disableAction: boolean;
  knowledgeFormData: KnowledgeFormData;
  pullRequestNumber: number;
  yamlFile: PullRequestFile;
  attributionFile: PullRequestFile;
  branchName: string;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
}

const Update: React.FC<Props> = ({
  disableAction,
  knowledgeFormData,
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
    if (!validateFields(knowledgeFormData, setActionGroupAlertContent)) return;
    if (session?.accessToken) {
      try {
        console.log(`Updating PR with number: ${pullRequestNumber}`);
        await updatePullRequest(session.accessToken, pullRequestNumber, {
          title: knowledgeFormData.submissionSummary,
          body: knowledgeFormData.documentOutline
        });

        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        };

        const githubUsername = await getGitHubUsername(headers);
        console.log(`GitHub username: ${githubUsername}`);

        const knowledgeYamlData: KnowledgeYamlData = {
          created_by: githubUsername!,
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
        console.log('Updated YAML content:', yamlString);

        const attributionData: AttributionData = {
          title_of_work: knowledgeFormData.titleWork!,
          link_to_work: knowledgeFormData.linkWork!,
          revision: knowledgeFormData.revision!,
          license_of_the_work: knowledgeFormData.licenseWork!,
          creator_names: knowledgeFormData.creators!
        };
        const attributionContent = `Title of work: ${attributionData.title_of_work}
Link to work: ${attributionData.link_to_work}
Revision: ${attributionData.revision}
License of the work: ${attributionData.license_of_the_work}
Creator names: ${attributionData.creator_names}
`;

        console.log('Updated Attribution content:', attributionData);

        const commitMessage = `Amend commit with updated content\n\nSigned-off-by: ${knowledgeFormData.name} <${knowledgeFormData.email}>`;

        // Ensure proper file paths for the edit
        const finalYamlPath = KNOWLEDGE_DIR + knowledgeFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + yamlFile.filename.split('/').pop();
        const finalAttributionPath =
          KNOWLEDGE_DIR + knowledgeFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + attributionFile.filename.split('/').pop();
        console.log('finalYamlPath:', finalYamlPath);

        const origFilePath = yamlFile.filename.split('/').slice(0, -1).join('/');
        const oldFilePath = {
          yaml: origFilePath.replace(/^\//, '').replace(/\/?$/, '/') + yamlFile.filename.split('/').pop(),
          attribution: origFilePath.replace(/^\//, '').replace(/\/?$/, '/') + attributionFile.filename.split('/').pop()
        };

        const newFilePath = {
          yaml: finalYamlPath,
          attribution: finalAttributionPath
        };

        const waitForSubmissionAlert: ActionGroupAlertContent = {
          title: 'Knowledge contribution update is in progress.!',
          message: `Once the update is successful, it will provide the link to the updated Pull Request.`,
          success: true,
          waitAlert: true,
          timeout: false
        };
        setActionGroupAlertContent(waitForSubmissionAlert);

        const res = await fetch('/api/envConfig');
        const envConfig = await res.json();

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
          title: 'Knowledge contribution updated successfully!',
          message: `Thank you for your contribution!`,
          url: `${prLink}`,
          success: true
        };
        setActionGroupAlertContent(actionGroupAlertContent);
        // Knowledge is updated, wait for a bit and let's go back to dashboard.
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
      Update Knowledge
    </Button>
  );
};

export default Update;
