// src/components/Dashboard/Native/DashboardPage.tsx
import * as React from 'react';
import { AlertProps } from '@patternfly/react-core';
import { v4 as uuidv4 } from 'uuid';
import { ContributionInfo, DraftEditFormInfo } from '@/types';
import { fetchDraftContributions } from '@/components/Contribute/Utils/autoSaveUtils';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import Dashboard, { AlertItem } from '@/components/Dashboard/Dashboard';

const fetchBranchTaxonomy = async (branchName: string) => {
  let taxonomy = '';
  try {
    const response = await fetch('/api/native/git/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchName, action: 'diff' })
    });

    const result = await response.json();
    if (response.ok) {
      if (result?.changes.length > 0) {
        result.changes.forEach((change: { status: string; content?: string; file: string }) => {
          if (change.status !== 'deleted' && change.content) {
            if (change.file.includes('qna.yaml')) {
              // Set the file path from the current YAML file (remove the root folder name from the path)
              const currentFilePath = change.file.split('/').slice(1, -1).join('/');
              taxonomy = currentFilePath + '/';
            }
          }
        });
      }
    }
  } catch (error) {
    console.error('Error fetching branch changes:', error);
  }

  return taxonomy;
};

const cloneNativeTaxonomyRepo = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/native/clone-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (response.ok) {
      return true;
    }
    console.error(result.message);
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error cloning repo:', errorMessage);
    return false;
  }
};

const DashboardNative: React.FunctionComponent = () => {
  const {
    featureFlags: { skillFeaturesEnabled }
  } = useFeatureFlags();
  const [branches, setBranches] = React.useState<
    { name: string; creationDate: number; message: string; author: string; state: string; taxonomy: string }[]
  >([]);
  const [draftContributions, setDraftContributions] = React.useState<DraftEditFormInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);

  const addAlert = React.useCallback((title: string, variant: AlertProps['variant']) => {
    const alertKey = uuidv4();
    const newAlert: AlertItem = { title, variant, key: alertKey };
    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
  }, []);

  const removeAlert = (alertToRemove: AlertItem) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.key !== alertToRemove.key));
  };

  const fetchBranches = React.useCallback(async () => {
    try {
      const response = await fetch('/api/native/git/branches');
      const result = await response.json();
      if (response.ok) {
        // Filter out 'main' branch
        const filteredBranches = result.branches.filter(
          (branch: { name: string }) => branch.name !== 'main' && (skillFeaturesEnabled || branch.name.includes('knowledge-contribution'))
        );
        for (const branch of filteredBranches) {
          branch.taxonomy = await fetchBranchTaxonomy(branch.name);
        }
        setBranches(filteredBranches);
      } else {
        console.error('Failed to fetch branches:', result.error);
        addAlert(result.error || 'Failed to fetch branches.', 'danger');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      addAlert('Error fetching branches.', 'danger');
    }
  }, [addAlert, skillFeaturesEnabled]);

  // Fetch branches from the API route
  React.useEffect(() => {
    let refreshIntervalId: NodeJS.Timeout;

    cloneNativeTaxonomyRepo().then((success) => {
      if (success) {
        fetchBranches().then(() => {
          setIsLoading(false);
        });
        refreshIntervalId = setInterval(fetchBranches, 60000);
      } else {
        addAlert('Failed to fetch branches.', 'danger');
        setIsLoading(false);
      }
    });

    return () => clearInterval(refreshIntervalId);
  }, [addAlert, fetchBranches]);

  React.useEffect(() => {
    // Fetch all the draft contributions and mark them submitted if present in the branches
    const drafts = fetchDraftContributions()
      .map((draft: DraftEditFormInfo) => ({
        ...draft,
        isSubmitted: branches.some((branch) => branch.name === draft.branchName)
      }))
      .filter((draft) => skillFeaturesEnabled || draft.isKnowledgeDraft);

    setDraftContributions(drafts);
  }, [branches, skillFeaturesEnabled]);

  const contributions: ContributionInfo[] = React.useMemo(
    () => [
      ...draftContributions
        .filter((draft) => !branches.find((branch) => branch.name === draft.branchName))
        .map((draft) => ({
          branchName: draft.branchName,
          title: draft.title || `Draft ${draft.isKnowledgeDraft ? 'knowledge' : 'skill'} contribution`,
          author: draft.author,
          lastUpdated: new Date(draft.lastUpdated),
          isDraft: true,
          isKnowledge: draft.isKnowledgeDraft,
          isSubmitted: draft.isSubmitted,
          state: 'draft',
          taxonomy: draft.taxonomy
        })),
      ...branches.map((branch) => ({
        branchName: branch.name,
        title: branch.message,
        author: branch.author,
        lastUpdated: (() => {
          const date = new Date();
          date.setTime(branch.creationDate);
          return date;
        })(),
        isDraft: !!draftContributions.find((draft) => draft.branchName == branch.name),
        isKnowledge: branch.name.includes('knowledge-contribution'),
        isSubmitted: true,
        state: branch.state,
        taxonomy: branch.taxonomy
      }))
    ],
    [branches, draftContributions]
  );

  const onUpdateContributions = () => {
    fetchBranches();
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

export { DashboardNative };
