// src/app/components/contribute/EditSkill/github/EditSkill.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PullRequest, SkillEditFormData } from '@/types';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { useEnvConfig } from '@/context/EnvConfigContext';
import { fetchDraftSkillChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchSkillPRData } from '@/components/Contribute/fetchUtils';
import SkillWizard from '@/components/Contribute/Skill/SkillWizard/SkillWizard';
import { fetchPullRequests } from '@/utils/github';

interface EditSkillClientComponentProps {
  branchName: string;
  isDraft: boolean;
}

const EditSkill: React.FC<EditSkillClientComponentProps> = ({ branchName, isDraft }) => {
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

    const fetchPRData = async () => {
      setLoadingMsg('Fetching skills data from PR : ' + branchName);
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
  }, [session, loaded, envConfig, branchName, isDraft]);

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Modal variant={ModalVariant.small} title="Loading Skill Data" isOpen={isLoading} onClose={handleOnClose}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <SkillWizard isGithubMode skillEditFormData={skillEditFormData} />;
};

export default EditSkill;
