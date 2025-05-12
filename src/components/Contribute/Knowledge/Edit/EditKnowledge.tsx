// src/app/components/contribute/Knowledge/Edit/EditKnowledge.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { KnowledgeEditFormData } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { fetchDraftKnowledgeChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchKnowledgeBranchChanges } from '@/components/Contribute/fetchUtils';
import KnowledgeForm from '@/components/Contribute/Knowledge/Edit/KnowledgeForm';

interface EditKnowledgeClientComponentProps {
  branchName: string;
  isDraft: boolean;
}

const EditKnowledge: React.FC<EditKnowledgeClientComponentProps> = ({ branchName, isDraft }) => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [knowledgeEditFormData, setKnowledgeEditFormData] = useState<KnowledgeEditFormData>();
  const router = useRouter();

  useEffect(() => {
    if (isDraft) {
      fetchDraftKnowledgeChanges({ branchName, setIsLoading, setLoadingMsg, setKnowledgeEditFormData });
      return;
    }

    setLoadingMsg('Fetching knowledge data from branch : ' + branchName);
    const fetchFormData = async () => {
      const { editFormData, error } = await fetchKnowledgeBranchChanges(session, branchName);
      if (error) {
        setLoadingMsg(error);
        return;
      }

      // If there is only one associated knowledge file, set it for each seed example
      if (editFormData?.formData.uploadedFiles.length === 1) {
        editFormData.formData.seedExamples.forEach((seedExample) => (seedExample.knowledgeFile = editFormData?.formData.uploadedFiles[0]));
      }

      setIsLoading(false);
      setKnowledgeEditFormData(editFormData);
    };
    fetchFormData();
  }, [branchName, isDraft, session]);

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

  return <KnowledgeForm knowledgeEditFormData={knowledgeEditFormData} />;
};

export default EditKnowledge;
