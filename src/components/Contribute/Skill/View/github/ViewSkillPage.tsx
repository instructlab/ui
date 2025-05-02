// src/app/components/Contribute/Skill/View/github/ViewSkillPage.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { PullRequest, SkillEditFormData } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { useEnvConfig } from '@/context/EnvConfigContext';
import { fetchDraftSkillChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchSkillPRData } from '@/components/Contribute/fetchUtils';
import ViewSkill from '@/components/Contribute/Skill/View/ViewSkill';
import { fetchPullRequests } from '@/utils/github';

interface Props {
  branchName: string;
  isDraft: boolean;
}

const ViewSkillPage: React.FC<Props> = ({ branchName, isDraft }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { envConfig, loaded } = useEnvConfig();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [skillEditFormData, setSkillEditFormData] = useState<SkillEditFormData>();

  useEffect(() => {
    if (isDraft) {
      fetchDraftSkillChanges({ branchName, setIsLoading, setLoadingMsg, setSkillEditFormData });
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

      const { editFormData, error } = await fetchSkillPRData(session, envConfig, String(pr.number));
      if (error) {
        setLoadingMsg(error);
        return;
      }
      setIsLoading(false);
      setSkillEditFormData(editFormData);
    };
    fetchPRData();
  }, [session, envConfig, loaded, branchName, isDraft]);

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading || !skillEditFormData?.formData) {
    return (
      <Modal variant={ModalVariant.small} title="Loading Knowledge Data" isOpen={isLoading} onClose={() => handleOnClose()}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <ViewSkill skillEditFormData={skillEditFormData} />;
};

export default ViewSkillPage;
