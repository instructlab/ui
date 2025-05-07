import React, { useState } from 'react';
import YamlCodeModal from '@/components/YamlCodeModal';
import { ContributionFormData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import { Button } from '@patternfly/react-core';

interface Props {
  formData: ContributionFormData;
  convertToYaml: (formData: ContributionFormData) => unknown;
}

export const ViewDropdownButton: React.FunctionComponent<Props> = ({ formData, convertToYaml }) => {
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>('');

  const handleViewYaml = () => {
    const yamlData = convertToYaml(formData);
    const yamlString = dumpYaml(yamlData);
    setModalContent(yamlString);
    setIsYamlModalOpen(true);
  };

  const handleSaveYaml = () => {
    const yamlData = convertToYaml(formData);
    const yamlString = dumpYaml(yamlData);
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qna.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      {isYamlModalOpen ? (
        <YamlCodeModal
          isModalOpen
          handleModalToggle={() => setIsYamlModalOpen(!isYamlModalOpen)}
          yamlContent={modalContent}
          onSave={handleSaveYaml}
        />
      ) : null}
      <Button variant="secondary" onClick={handleViewYaml}>
        View YAML file
      </Button>
    </>
  );
};

export default ViewDropdownButton;
