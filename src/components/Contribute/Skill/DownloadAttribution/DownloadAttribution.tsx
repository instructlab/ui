import React from 'react';
import { DropdownItem } from '@patternfly/react-core/dist/esm/components/Dropdown/DropdownItem';
import FileIcon from '@patternfly/react-icons/dist/esm/icons/file-icon';
import { SkillFormData } from '@/types';

interface Props {
  skillFormData: SkillFormData;
}

const DownloadAttribution: React.FC<Props> = ({ skillFormData }) => {
  const handleDownloadAttribution = () => {
    // Because I have overly complicated the validatedFields function all fields are being checked and not just the attribution ones here. Not ideal.

    const attributionContent = `Title of work: ${skillFormData.titleWork}
    License of the work: ${skillFormData.licenseWork}
    Creator names: ${skillFormData.creators}
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
    <DropdownItem key="DownloadAttribution" to="#default-link6" onClick={handleDownloadAttribution}>
      <FileIcon /> Attribution File
    </DropdownItem>
  );
};

export default DownloadAttribution;
