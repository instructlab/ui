import React from 'react';
import { validateFields } from '../validation';
import { ActionGroupAlertContent, KnowledgeFormData } from '..';
import { DropdownItem } from '@patternfly/react-core/dist/esm/components/Dropdown/DropdownItem';
import FileIcon from '@patternfly/react-icons/dist/esm/icons/file-icon';

interface Props {
  disableAction: boolean;
  knowledgeFormData: KnowledgeFormData;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
}

const DownloadAttribution: React.FC<Props> = ({ disableAction, knowledgeFormData, setActionGroupAlertContent }) => {
  const handleDownloadAttribution = () => {
    // Because I have overly complicated the validatedFields function all fields are being checked and not just the attribution ones here. Not ideal.
    if (!validateFields(knowledgeFormData, setActionGroupAlertContent)) return;

    const attributionContent = `Title of work: ${knowledgeFormData.titleWork}
    Link to work: ${knowledgeFormData.linkWork}
    Revision: ${knowledgeFormData.submissionSummary}
    License of the work: ${knowledgeFormData.licenseWork}
    Creator names: ${knowledgeFormData.creators}
    `;

    const blob = new Blob([attributionContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attribution.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <DropdownItem key="DownloadAttribution" to="#default-link6" isDisabled={disableAction} onClick={handleDownloadAttribution}>
      <FileIcon /> Attribution File
    </DropdownItem>
  );
};

export default DownloadAttribution;
