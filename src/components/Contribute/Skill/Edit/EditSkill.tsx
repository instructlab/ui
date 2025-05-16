// src/components/Contribute/Skill/Edit/EditSkill.tsx
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkillEditFormData, SkillFormData } from '@/types';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { useSession } from 'next-auth/react';
import { fetchDraftSkillChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchSkillBranchChanges } from '@/components/Contribute/fetchUtils';
import SkillForm from '@/components/Contribute/Skill/Edit/SkillForm';

interface EditSkillClientComponentProps {
  branchName: string;
}

const EditSkill: React.FC<EditSkillClientComponentProps> = ({ branchName }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [skillData, setSkillData] = useState<{ draftData?: SkillFormData; editFormData?: SkillEditFormData }>();
  const router = useRouter();

  useEffect(() => {
    setLoadingMsg('Fetching skill data');

    const fetchBranchChanges = async () => {
      setLoadingMsg('Fetching skill data from branch: ' + branchName);
      const draftData = fetchDraftSkillChanges(branchName);

      const { editFormData, error } = await fetchSkillBranchChanges(session, branchName);
      if (error && !draftData) {
        setLoadingMsg(error);
        return;
      }
      setIsLoading(false);
      setSkillData({ draftData, editFormData });
    };
    fetchBranchChanges();
  }, [branchName, session]);

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

  return <SkillForm skillEditFormData={skillData?.editFormData} draftData={skillData?.draftData} />;
};

export default EditSkill;
