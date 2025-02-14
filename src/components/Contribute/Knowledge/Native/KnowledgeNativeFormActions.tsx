import React from 'react';
import { ActionGroup } from '@patternfly/react-core';
import { DownloadDropdown } from '@/components/Contribute/Knowledge/DownloadDropdown/DownloadDropdown';
import { ViewDropdown } from '@/components/Contribute/Knowledge/ViewDropdown/ViewDropdown';
import Update from '@/components/Contribute/Knowledge/Native/Update/Update';
import { KnowledgeEditFormData, KnowledgeFormData } from '@/types';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

interface Props {
  knowledgeEditFormData?: KnowledgeEditFormData;
  knowledgeFormData: KnowledgeFormData;
  disableAction: boolean;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
  resetForm: () => void;
  handleCancel: () => void;
}

export const KnowledgeNativeFormActions: React.FunctionComponent<Props> = ({
  knowledgeEditFormData,
  knowledgeFormData,
  setActionGroupAlertContent,
  disableAction
}) => {
  return (
    <ActionGroup>
      {knowledgeEditFormData?.isEditForm && (
        <Update
          disableAction={disableAction}
          knowledgeFormData={knowledgeFormData}
          oldFilesPath={knowledgeEditFormData.oldFilesPath}
          branchName={knowledgeEditFormData.branchName}
          email={knowledgeFormData?.email}
          setActionGroupAlertContent={setActionGroupAlertContent}
        />
      )}
      <DownloadDropdown knowledgeFormData={knowledgeFormData} githubUsername={knowledgeFormData.email} isGithubMode={false} />
      <ViewDropdown knowledgeFormData={knowledgeFormData} githubUsername={knowledgeFormData.email} isGithubMode={false} />
    </ActionGroup>
  );
};

export default KnowledgeNativeFormActions;
