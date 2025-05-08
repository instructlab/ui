// src/app/components/contribute/EditSkill/native/EditSkill.tsx
'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SkillEditFormData } from '@/types';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { useSession } from 'next-auth/react';
import { fetchDraftSkillChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchSkillBranchChanges } from '@/components/Contribute/fetchUtils';
import SkillWizard from '@/components/Contribute/Skill/SkillWizard/SkillWizard';

interface EditSkillClientComponentProps {
  branchName: string;
  isDraft: boolean;
}

const EditSkillNative: React.FC<EditSkillClientComponentProps> = ({ branchName, isDraft }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [skillEditFormData, setSkillEditFormData] = useState<SkillEditFormData>();
  const router = useRouter();

  useEffect(() => {
    if (isDraft) {
      fetchDraftSkillChanges({ branchName, setIsLoading, setLoadingMsg, setSkillEditFormData });
      return;
    }

    const fetchBranchChanges = async () => {
      setLoadingMsg('Fetching skills data from branch: ' + branchName);
      const { editFormData, error } = await fetchSkillBranchChanges(session, branchName);
      if (error) {
        setLoadingMsg(error);
        return;
      }
      setIsLoading(false);
      setSkillEditFormData(editFormData);
    };
    fetchBranchChanges();
  }, [branchName, isDraft, session]);

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

  return <SkillWizard isGithubMode={false} skillEditFormData={skillEditFormData} />;
};

export default EditSkillNative;
