// src/components/Contribute/Skill/View/ViewSkillPage.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { SkillEditFormData } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { fetchDraftSkillChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchSkillBranchChanges } from '@/components/Contribute/fetchUtils';
import ViewSkill from '@/components/Contribute/Skill/View/ViewSkill';

interface ViewKnowledgeClientComponentProps {
  branchName: string;
  isDraft: boolean;
}

const ViewSkillPage: React.FC<ViewKnowledgeClientComponentProps> = ({ branchName, isDraft }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [skillEditFormData, setSkillEditFormData] = useState<SkillEditFormData>();

  useEffect(() => {
    if (isDraft) {
      fetchDraftSkillChanges({ branchName, setIsLoading, setLoadingMsg, setSkillEditFormData });
      return;
    }

    setLoadingMsg('Fetching knowledge data from branch : ' + branchName);
    const fetchFormData = async () => {
      const { editFormData, error } = await fetchSkillBranchChanges(session, branchName);
      if (error) {
        setLoadingMsg(error);
        return;
      }
      setIsLoading(false);
      setSkillEditFormData(editFormData);
    };
    fetchFormData();
  }, [branchName, isDraft, session]);

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading || !skillEditFormData?.formData) {
    return (
      <Modal variant={ModalVariant.small} title="Loading Skills Data" isOpen={isLoading} onClose={() => handleOnClose()}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <ViewSkill skillEditFormData={skillEditFormData} />;
};

export default ViewSkillPage;
