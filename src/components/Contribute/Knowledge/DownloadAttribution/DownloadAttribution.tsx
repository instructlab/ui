import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { validateFields } from '../validation';
import { ActionGroupAlertContent, KnowledgeFormData } from '..';

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
    <Button variant="primary" type="button" isDisabled={disableAction} onClick={handleDownloadAttribution}>
      Download Attribution
    </Button>
  );
};

export default DownloadAttribution;
