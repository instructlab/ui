// src/app/components/Contribute/Knowledge/View/ViewKnowledgePage.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { KnowledgeEditFormData, KnowledgeFormData } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { fetchDraftKnowledgeChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchKnowledgeBranchChanges } from '@/components/Contribute/fetchUtils';
import ViewKnowledge from '@/components/Contribute/Knowledge/View/ViewKnowledge';

interface Props {
  branchName: string;
}

const ViewKnowledgePage: React.FC<Props> = ({ branchName }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [knowledgeData, setKnowledgeData] = useState<{ draftData?: KnowledgeFormData; editFormData?: KnowledgeEditFormData }>();

  useEffect(() => {
    setLoadingMsg('Fetching knowledge data');
    const fetchFormData = async () => {
      const draftData = fetchDraftKnowledgeChanges(branchName);

      const { editFormData, error } = await fetchKnowledgeBranchChanges(session, branchName);
      if (error && !draftData) {
        setLoadingMsg(error);
        return;
      }

      // If there is only one associated knowledge file, set it for each seed example
      if (editFormData?.formData.uploadedFiles.length === 1) {
        editFormData.formData.seedExamples.forEach((seedExample) => (seedExample.knowledgeFile = editFormData?.formData.uploadedFiles[0]));
      }

      setIsLoading(false);
      setKnowledgeData({ draftData, editFormData });
    };

    fetchFormData();
  }, [branchName, session]);

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading || (!knowledgeData?.editFormData && !knowledgeData?.draftData)) {
    return (
      <Modal variant={ModalVariant.small} title="Loading Knowledge Data" isOpen={isLoading} onClose={() => handleOnClose()}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <ViewKnowledge knowledgeEditFormData={knowledgeData.editFormData} draftData={knowledgeData?.draftData} />;
};

export default ViewKnowledgePage;
