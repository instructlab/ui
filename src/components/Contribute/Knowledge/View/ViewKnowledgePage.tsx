// src/app/components/Contribute/Knowledge/View/ViewKnowledgePage.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { KnowledgeEditFormData } from '@/types';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, ModalVariant, ModalBody } from '@patternfly/react-core';
import { fetchDraftKnowledgeChanges } from '@/components/Contribute/Utils/autoSaveUtils';
import { fetchKnowledgeBranchChanges } from '@/components/Contribute/fetchUtils';
import ViewKnowledge from '@/components/Contribute/Knowledge/View/ViewKnowledge';

interface Props {
  branchName: string;
  isDraft: boolean;
}

const ViewKnowledgePage: React.FC<Props> = ({ branchName, isDraft }) => {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [knowledgeEditFormData, setKnowledgeEditFormData] = useState<KnowledgeEditFormData>();

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
      setIsLoading(false);
      setKnowledgeEditFormData(editFormData);
    };
    fetchFormData();
  }, [branchName, isDraft, session]);

  const handleOnClose = () => {
    router.push('/dashboard');
    setIsLoading(false);
  };

  if (isLoading || !knowledgeEditFormData?.formData) {
    return (
      <Modal variant={ModalVariant.small} title="Loading Knowledge Data" isOpen={isLoading} onClose={() => handleOnClose()}>
        <ModalBody>
          <div>{loadingMsg}</div>
        </ModalBody>
      </Modal>
    );
  }

  return <ViewKnowledge knowledgeEditFormData={knowledgeEditFormData} />;
};

export default ViewKnowledgePage;
