// src/components/Contribute/Skill/View/ViewSkillPage.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { SkillEditFormData, SkillFormData } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { fetchDraftSkillChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchSkillBranchChanges } from '@/components/Contribute/fetchUtils';
import ViewSkill from '@/components/Contribute/Skill/View/ViewSkill';

interface ViewKnowledgeClientComponentProps {
  branchName: string;
}

const ViewSkillPage: React.FC<ViewKnowledgeClientComponentProps> = ({ branchName }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [skillData, setSkillData] = useState<{ draftData?: SkillFormData; editFormData?: SkillEditFormData }>();

  useEffect(() => {
    setLoadingMsg('Fetching skill data');
    const fetchFormData = async () => {
      const draftData = fetchDraftSkillChanges(branchName);

      const { editFormData, error } = await fetchSkillBranchChanges(session, branchName);
      if (error && !draftData) {
        setLoadingMsg(error);
        return;
      }
      setIsLoading(false);
      setSkillData({ draftData, editFormData });
    };
    fetchFormData();
  }, [branchName, session]);

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading || (!skillData?.editFormData && !skillData?.draftData)) {
    return (
      <Modal variant={ModalVariant.small} title="Loading skill data" isOpen={isLoading} onClose={() => handleOnClose()}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <ViewSkill skillEditFormData={skillData.editFormData} draftData={skillData.draftData} />;
};

export default ViewSkillPage;
