// src/components/Dashboard/Github/DashboardPage.tsx
import * as React from 'react';
import { useSession } from 'next-auth/react';
import { v4 as uuidv4 } from 'uuid';
import { ContributionInfo, DraftEditFormInfo, EnvConfigType, PullRequest, PullRequestFile } from '@/types';
import { useState } from 'react';
import { AlertProps } from '@patternfly/react-core';
import { useEnvConfig } from '@/context/EnvConfigContext';
import { fetchDraftContributions } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchPullRequestFiles, fetchPullRequests, getGitHubUsername } from '@/utils/github';
import Dashboard, { AlertItem } from '@/components/Dashboard/Dashboard';

const fetchPrTaxonomy = async (accessToken: string, envConfig: EnvConfigType, prNumber: number) => {
  try {
    const prFiles: PullRequestFile[] = await fetchPullRequestFiles(accessToken, envConfig, prNumber);

    const foundYamlFile = prFiles.find((file: PullRequestFile) => file.filename.includes('qna.yaml'));
    if (foundYamlFile) {
      const currentFilePath = foundYamlFile.filename.split('/').slice(1, -1).join('/');
      return currentFilePath + '/';
    }

    const errorMsg = 'No YAML file found in the pull request.';
    console.error('Error fetching pull request data: ', errorMsg);
  } catch (error) {
    console.error('Error fetching branch changes:', error);
  }

  return '';
};

const DashboardGithub: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const { envConfig } = useEnvConfig();
  const [pullRequests, setPullRequests] = React.useState<PullRequest[]>([]);
  const [draftContributions, setDraftContributions] = React.useState<DraftEditFormInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);

  const addAlert = React.useCallback((title: string, variant: AlertProps['variant']) => {
    const alertKey = uuidv4();
    const newAlert: AlertItem = { title, variant, key: alertKey };
    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
  }, []);

  const removeAlert = (alertToRemove: AlertItem) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.key !== alertToRemove.key));
  };

  const fetchAndSetPullRequests = React.useCallback(async () => {
    if (session?.accessToken) {
      try {
        const header = {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        };
        const fetchedUsername = await getGitHubUsername(header);
        const data = await fetchPullRequests(session.accessToken, envConfig);
        const filteredPRs = data.filter(
          (pr: PullRequest) => pr.user.login === fetchedUsername && pr.labels.some((label) => label.name === 'skill' || label.name === 'knowledge')
        );
        for (const pr of filteredPRs) {
          pr.taxonomy = await fetchPrTaxonomy(session.accessToken, envConfig, pr.number);
        }

        // Sort by date (newest first)
        const sortedPRs = filteredPRs.sort((a: PullRequest, b: PullRequest) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPullRequests(sortedPRs);
      } catch (error) {
        console.error('Failed to fetch pull requests.' + error);
        addAlert('Error fetching pull requests.', 'danger');
      }
    }
  }, [addAlert, session?.accessToken, envConfig]);

  React.useEffect(() => {
    fetchAndSetPullRequests().then(() => {
      setIsLoading(false);
    });

    const intervalId = setInterval(fetchAndSetPullRequests, 60000);

    return () => clearInterval(intervalId);
  }, [fetchAndSetPullRequests]);

  React.useEffect(() => {
    // Fetch all the draft contributions and mark them submitted if present in the pull requests
    const drafts = fetchDraftContributions().map((draft: DraftEditFormInfo) => ({
      ...draft,
      isSubmitted: pullRequests.some((pr) => pr.head.ref === draft.branchName)
    }));

    setDraftContributions(drafts);
  }, [pullRequests]);

  const contributions: ContributionInfo[] = React.useMemo(
    () => [
      ...draftContributions
        .filter((draft) => !pullRequests.find((pr) => pr.head.ref === draft.branchName))
        .map((draft, index) => ({
          branchName: draft.branchName,
          title: draft.title || `Untitled ${draft.isKnowledgeDraft ? 'knowledge' : 'skill'} contribution ${index + 1}`,
          author: draft.author,
          lastUpdated: new Date(draft.lastUpdated),
          isDraft: true,
          isKnowledge: draft.isKnowledgeDraft,
          isSubmitted: draft.isSubmitted,
          state: 'draft',
          taxonomy: draft.taxonomy
        })),
      ...pullRequests.map((pr) => ({
        branchName: `${pr.head.ref}`,
        title: pr.title,
        author: '',
        lastUpdated: new Date(pr.updated_at),
        isDraft: !!draftContributions.find((draft) => draft.branchName == pr.head.ref),
        isKnowledge: pr.labels.some((label) => label.name === 'knowledge'),
        isSubmitted: true,
        state: 'Available',
        taxonomy: pr.taxonomy
      }))
    ],
    [pullRequests, draftContributions]
  );

  const onUpdateContributions = () => {
    fetchAndSetPullRequests();
  };

  return (
    <Dashboard
      contributions={contributions}
      isLoading={isLoading}
      triggerUpdateContributions={onUpdateContributions}
      alerts={alerts}
      addAlert={addAlert}
      removeAlert={removeAlert}
    />
  );
};

export { DashboardGithub };
