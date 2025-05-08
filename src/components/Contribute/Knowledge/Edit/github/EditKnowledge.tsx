// src/app/components/contribute/EditKnowledge/github/EditKnowledge.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { KnowledgeEditFormData, PullRequest } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { useEnvConfig } from '@/context/EnvConfigContext';
import { fetchDraftKnowledgeChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchKnowledgePRData } from '@/components/Contribute/fetchUtils';
import KnowledgeWizard from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeWizard';
import { fetchPullRequests } from '@/utils/github';

interface EditKnowledgeClientComponentProps {
  branchName: string;
  isDraft: boolean;
}

const EditKnowledge: React.FC<EditKnowledgeClientComponentProps> = ({ branchName, isDraft }) => {
  const { data: session } = useSession();
  const { envConfig, loaded } = useEnvConfig();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [knowledgeEditFormData, setKnowledgeEditFormData] = useState<KnowledgeEditFormData>();
  const router = useRouter();

  useEffect(() => {
    if (isDraft) {
      fetchDraftKnowledgeChanges({ branchName, setIsLoading, setLoadingMsg, setKnowledgeEditFormData });
      return;
    }

    setLoadingMsg('Fetching knowledge data from PR : ' + branchName);

    const fetchPRData = async () => {
      if (!loaded || !session?.accessToken) {
        return;
      }

      const pullRequests: PullRequest[] = await fetchPullRequests(session.accessToken, envConfig);
      const pr = pullRequests.find((pullRequest) => pullRequest.head.ref === branchName);
      if (!pr) {
        return;
      }

      const { editFormData, error } = await fetchKnowledgePRData(session, envConfig, String(pr.number));
      if (error) {
        setLoadingMsg(error);
        return;
      }
      setIsLoading(false);
      setKnowledgeEditFormData(editFormData);
    };
    fetchPRData();
  }, [session, loaded, envConfig, branchName, isDraft]);

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Modal variant={ModalVariant.small} title="Loading Knowledge Data" isOpen={isLoading} onClose={() => handleOnClose()}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <KnowledgeWizard isGithubMode knowledgeEditFormData={knowledgeEditFormData} />;
};

export default EditKnowledge;
