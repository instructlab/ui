import React from 'react';
import { KnowledgeFormData } from '@/types';
import { DropdownItem, Icon } from '@patternfly/react-core';
import { FileIcon } from '@patternfly/react-icons';

interface Props {
  knowledgeFormData: KnowledgeFormData;
}

const DownloadAttribution: React.FC<Props> = ({ knowledgeFormData }) => {
  const handleDownloadAttribution = () => {
    // Because I have overly complicated the validatedFields function all fields are being checked and not just the attribution ones here. Not ideal.

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
    <DropdownItem
      key="DownloadAttribution"
      to="#default-link6"
      onClick={handleDownloadAttribution}
      icon={
        <Icon>
          <FileIcon />
        </Icon>
      }
    >
      {' '}
      Attribution File
    </DropdownItem>
  );
};

export default DownloadAttribution;
